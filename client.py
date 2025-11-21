import sys
import time
import pygame
import numpy as np
import requests
from pygame.locals import *

pygame.init()

BOARD_SIZE = 9
CELL_SIZE = 60
MARGIN = 50
WINDOW_SIZE = 2 * MARGIN + BOARD_SIZE * CELL_SIZE
FPS = 60

BACKGROUND = (28, 35, 43)
GRID_COLOR = (60, 70, 90)
PLAYER1_COLOR = (255, 107, 107)
PLAYER1_TERRITORY = (100, 30, 30, 150)
PLAYER2_COLOR = (107, 178, 255)
PLAYER2_TERRITORY = (30, 60, 100, 150)
HIGHLIGHT_COLOR = (255, 215, 0)
TEXT_COLOR = (240, 240, 240)
BUTTON_COLOR = (70, 130, 180)
BUTTON_HOVER_COLOR = (100, 160, 210)

screen = pygame.display.set_mode((WINDOW_SIZE, WINDOW_SIZE + 100))
pygame.display.set_caption("泡姆三消棋 客户端")
clock = pygame.time.Clock()


def load_font(size):
    font_names = [
        'SimHei', 'Microsoft YaHei', 'KaiTi', 'SimSun',
        'FangSong', 'STHeiti', 'STKaiti', 'STSong',
        'WenQuanYi Micro Hei', 'WenQuanYi Zen Hei'
    ]
    for name in font_names:
        try:
            font = pygame.font.SysFont(name, size)
            surface = font.render("测试", True, (255, 255, 255))
            if surface.get_width() > 0:
                return font
        except:
            continue
    return pygame.font.SysFont(None, size)


font = load_font(25)
small_font = load_font(20)


class LocalGame:
    def __init__(self):
        self.reset()

    def reset(self):
        self.board = np.zeros((BOARD_SIZE, BOARD_SIZE), dtype=int)
        self.territory = np.zeros((BOARD_SIZE, BOARD_SIZE), dtype=int)
        self.current_player = 1
        self.total_moves = 0
        self.max_moves = 50
        self.game_over = False
        self.winner = None
        self.last_move_pos = None
        self.player_names = {1: "玩家1", 2: "玩家2"}
        self.status_message = ""

    def make_move(self, row, col):
        if self.game_over:
            return False
        if self.board[row][col] != 0:
            return False
        if self.territory[row][col] == 3 - self.current_player:
            return False
        self.board[row][col] = self.current_player
        self.last_move_pos = (row, col)
        self.total_moves += 1
        self.process_eliminations()
        self.current_player = 3 - self.current_player
        if self.total_moves >= self.max_moves:
            self.end_game()
        return True

    def process_eliminations(self):
        player = self.current_player
        eliminations = []
        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                if col <= BOARD_SIZE - 3 and \
                        self.board[row][col] == player and \
                        self.board[row][col + 1] == player and \
                        self.board[row][col + 2] == player:
                    eliminations.append(('horizontal', (row, col), (row, col + 2)))
                if row <= BOARD_SIZE - 3 and \
                        self.board[row][col] == player and \
                        self.board[row + 1][col] == player and \
                        self.board[row + 2][col] == player:
                    eliminations.append(('vertical', (row, col), (row + 2, col)))
                if row <= BOARD_SIZE - 3 and col <= BOARD_SIZE - 3 and \
                        self.board[row][col] == player and \
                        self.board[row + 1][col + 1] == player and \
                        self.board[row + 2][col + 2] == player:
                    eliminations.append(('diagonal1', (row, col), (row + 2, col + 2)))
                if row <= BOARD_SIZE - 3 and col >= 2 and \
                        self.board[row][col] == player and \
                        self.board[row + 1][col - 1] == player and \
                        self.board[row + 2][col - 2] == player:
                    eliminations.append(('diagonal2', (row, col), (row + 2, col - 2)))
        for direction, start, end in eliminations:
            self.remove_elimination_tiles(direction, start, end)
            self.claim_line(direction, start, end)

    def remove_elimination_tiles(self, direction, start, end):
        if direction == 'horizontal':
            row, start_col = start
            _, end_col = end
            for col in range(start_col, end_col + 1):
                self.board[row][col] = 0
        elif direction == 'vertical':
            start_row, col = start
            end_row, _ = end
            for row in range(start_row, end_row + 1):
                self.board[row][col] = 0
        elif direction == 'diagonal1':
            r, c = start
            end_r, end_c = end
            while r <= end_r and c <= end_c:
                self.board[r][c] = 0
                r += 1
                c += 1
        elif direction == 'diagonal2':
            r, c = start
            end_r, end_c = end
            while r <= end_r and c >= end_c:
                self.board[r][c] = 0
                r += 1
                c -= 1

    def claim_line(self, direction, start, end):
        opponent = 3 - self.current_player
        if direction == 'horizontal':
            row = start[0]
            start_col = min(start[1], end[1])
            end_col = max(start[1], end[1])
            for c in range(start_col, end_col + 1):
                self.territory[row][c] = self.current_player
            for c in range(start_col, -1, -1):
                if self.board[row][c] == opponent:
                    break
                self.territory[row][c] = self.current_player
                if c > 0 and self.board[row][c - 1] == opponent:
                    break
            for c in range(end_col, BOARD_SIZE):
                if self.board[row][c] == opponent:
                    break
                self.territory[row][c] = self.current_player
                if c < BOARD_SIZE - 1 and self.board[row][c + 1] == opponent:
                    break
        elif direction == 'vertical':
            col = start[1]
            start_row = min(start[0], end[0])
            end_row = max(start[0], end[0])
            for r in range(start_row, end_row + 1):
                self.territory[r][col] = self.current_player
            for r in range(start_row, -1, -1):
                if self.board[r][col] == opponent:
                    break
                self.territory[r][col] = self.current_player
                if r > 0 and self.board[r - 1][col] == opponent:
                    break
            for r in range(end_row, BOARD_SIZE):
                if self.board[r][col] == opponent:
                    break
                self.territory[r][col] = self.current_player
                if r < BOARD_SIZE - 1 and self.board[r + 1][col] == opponent:
                    break
        elif direction == 'diagonal1':
            r1, c1 = start
            r2, c2 = end
            start_r, start_c = min(r1, r2), min(c1, c2)
            end_r, end_c = max(r1, r2), max(c1, c2)
            r, c = start_r, start_c
            while r <= end_r and c <= end_c:
                self.territory[r][c] = self.current_player
                r += 1
                c += 1
            r, c = start_r, start_c
            while r >= 0 and c >= 0:
                if self.board[r][c] == opponent:
                    break
                self.territory[r][c] = self.current_player
                if r > 0 and c > 0 and self.board[r - 1][c - 1] == opponent:
                    break
                r -= 1
                c -= 1
            r, c = end_r, end_c
            while r < BOARD_SIZE and c < BOARD_SIZE:
                if self.board[r][c] == opponent:
                    break
                self.territory[r][c] = self.current_player
                if r < BOARD_SIZE - 1 and c < BOARD_SIZE - 1 and self.board[r + 1][c + 1] == opponent:
                    break
                r += 1
                c += 1
        elif direction == 'diagonal2':
            r1, c1 = start
            r2, c2 = end
            start_r, start_c = min(r1, r2), max(c1, c2)
            end_r, end_c = max(r1, r2), min(c1, c2)
            r, c = start_r, start_c
            while r <= end_r and c >= end_c:
                self.territory[r][c] = self.current_player
                r += 1
                c -= 1
            r, c = start_r, start_c
            while r >= 0 and c < BOARD_SIZE:
                if self.board[r][c] == opponent:
                    break
                self.territory[r][c] = self.current_player
                if r > 0 and c < BOARD_SIZE - 1 and self.board[r - 1][c + 1] == opponent:
                    break
                r -= 1
                c += 1
            r, c = end_r, end_c
            while r < BOARD_SIZE and c >= 0:
                if self.board[r][c] == opponent:
                    break
                self.territory[r][c] = self.current_player
                if r < BOARD_SIZE - 1 and c > 0 and self.board[r + 1][c - 1] == opponent:
                    break
                r += 1
                c -= 1

    def end_game(self):
        self.game_over = True
        player1_count, player2_count = self.get_score()
        if player1_count > player2_count:
            self.winner = 1
        elif player2_count > player1_count:
            self.winner = 2
        else:
            self.winner = 0

    def get_score(self):
        return int(np.sum(self.territory == 1)), int(np.sum(self.territory == 2))


class RemoteGame:
    def __init__(self, server_url, player_name, match_id):
        self.server_url = server_url.strip().rstrip('/')
        if not self.server_url.startswith(("http://", "https://")):
            self.server_url = "http://" + self.server_url
        self.player_name = player_name
        self.match_id = match_id
        self.session = requests.Session()
        self.player_token = None
        self.player_number = None
        self.status_message = ""
        self.poll_interval = 0.8
        self._last_sync = 0
        self.available_slots = 2

        self.board = np.zeros((BOARD_SIZE, BOARD_SIZE), dtype=int)
        self.territory = np.zeros((BOARD_SIZE, BOARD_SIZE), dtype=int)
        self.current_player = 1
        self.total_moves = 0
        self.max_moves = 50
        self.game_over = False
        self.winner = None
        self.last_move_pos = None
        self.player_names = {1: "玩家1", 2: "玩家2"}

        self._join_match()
        self.sync_state(force=True)

    def _join_match(self):
        try:
            resp = self.session.post(
                f"{self.server_url}/matches/{self.match_id}/join",
                json={"playerName": self.player_name},
                timeout=5
            )
        except requests.RequestException as exc:
            raise RuntimeError(f"连接服务器失败: {exc}") from exc
        if resp.status_code != 200:
            raise RuntimeError(resp.json().get("message", "加入对局失败"))
        data = resp.json()
        self.player_token = data["playerToken"]
        self.player_number = data["playerNumber"]
        self.status_message = "成功加入对局"

    def sync_state(self, force=False):
        now = time.time()
        if not force and (now - self._last_sync) < self.poll_interval:
            return
        try:
            resp = self.session.get(
                f"{self.server_url}/matches/{self.match_id}",
                timeout=5
            )
            resp.raise_for_status()
        except requests.RequestException as exc:
            self.status_message = f"同步失败: {exc}"
            return
        data = resp.json()
        self._apply_state(data)
        if self.available_slots > 0:
            self.status_message = "等待另一名玩家加入..."
        elif self.game_over:
            self.status_message = "对局已结束"
        elif self.is_my_turn():
            self.status_message = "轮到你落子"
        else:
            self.status_message = "等待对手回合"
        self._last_sync = now

    def _apply_state(self, data):
        self.board = np.array(data["board"], dtype=int)
        self.territory = np.array(data["territory"], dtype=int)
        self.current_player = data["currentPlayer"]
        self.total_moves = data["totalMoves"]
        self.max_moves = data["maxMoves"]
        self.game_over = data["gameOver"]
        self.winner = data["winner"]
        last_move = data.get("lastMove")
        self.last_move_pos = tuple(last_move) if last_move else None
        names = data.get("playerNames", {})
        self.player_names = {int(k): v for k, v in names.items()}
        self.available_slots = data.get("availableSlots", 0)

    def make_move(self, row, col):
        if self.available_slots > 0:
            self.status_message = "等待第二位玩家加入..."
            return False
        if not self.is_my_turn():
            self.status_message = "暂未轮到你"
            return False
        payload = {"playerToken": self.player_token, "row": row, "col": col}
        try:
            resp = self.session.post(
                f"{self.server_url}/matches/{self.match_id}/move",
                json=payload,
                timeout=5
            )
        except requests.RequestException as exc:
            self.status_message = f"落子失败: {exc}"
            return False
        if resp.status_code != 200:
            self.status_message = resp.json().get("message", "落子被拒绝")
            return False
        self._apply_state(resp.json())
        self.status_message = "等待对手回合"
        return True

    def reset(self):
        if not self.player_token:
            return False
        try:
            resp = self.session.post(
                f"{self.server_url}/matches/{self.match_id}/reset",
                json={"playerToken": self.player_token},
                timeout=5
            )
        except requests.RequestException as exc:
            self.status_message = f"重开失败: {exc}"
            return False
        if resp.status_code != 200:
            self.status_message = resp.json().get("message", "重开被拒绝")
            return False
        self._apply_state(resp.json())
        self.status_message = "对局已重置"
        return True

    def get_score(self):
        return int(np.sum(self.territory == 1)), int(np.sum(self.territory == 2))

    def is_my_turn(self):
        return (
            not self.game_over
            and self.player_number == self.current_player
            and self.player_number is not None
            and self.available_slots == 0
        )


def draw_board(game):
    screen.fill(BACKGROUND)
    for r in range(BOARD_SIZE):
        for c in range(BOARD_SIZE):
            rect = pygame.Rect(MARGIN + c * CELL_SIZE, MARGIN + r * CELL_SIZE, CELL_SIZE, CELL_SIZE)
            if game.territory[r][c] == 1:
                pygame.draw.rect(screen, PLAYER1_TERRITORY, rect)
            elif game.territory[r][c] == 2:
                pygame.draw.rect(screen, PLAYER2_TERRITORY, rect)
    for i in range(BOARD_SIZE + 1):
        pygame.draw.line(screen, GRID_COLOR,
                         (MARGIN, MARGIN + i * CELL_SIZE),
                         (MARGIN + BOARD_SIZE * CELL_SIZE, MARGIN + i * CELL_SIZE), 2)
        pygame.draw.line(screen, GRID_COLOR,
                         (MARGIN + i * CELL_SIZE, MARGIN),
                         (MARGIN + i * CELL_SIZE, MARGIN + BOARD_SIZE * CELL_SIZE), 2)
    for row in range(BOARD_SIZE):
        for col in range(BOARD_SIZE):
            center_x = MARGIN + col * CELL_SIZE + CELL_SIZE // 2
            center_y = MARGIN + row * CELL_SIZE + CELL_SIZE // 2
            if game.board[row][col] == 1:
                pygame.draw.circle(screen, PLAYER1_COLOR, (center_x, center_y), CELL_SIZE // 2 - 5)
            elif game.board[row][col] == 2:
                pygame.draw.circle(screen, PLAYER2_COLOR, (center_x, center_y), CELL_SIZE // 2 - 5)
    if game.last_move_pos:
        row, col = game.last_move_pos
        center_x = MARGIN + col * CELL_SIZE + CELL_SIZE // 2
        center_y = MARGIN + row * CELL_SIZE + CELL_SIZE // 2
        pygame.draw.circle(screen, HIGHLIGHT_COLOR, (center_x, center_y), CELL_SIZE // 2 - 2, 2)
    return draw_status(game)


def draw_status(game):
    player_names = getattr(game, "player_names", {})
    player1_label = player_names.get(1, "玩家1")
    player2_label = player_names.get(2, "玩家2")
    player1_score, player2_score = game.get_score()
    player1_surface = font.render(f"{player1_label}: {player1_score}", True, PLAYER1_COLOR)
    player2_surface = font.render(f"{player2_label}: {player2_score}", True, PLAYER2_COLOR)
    screen.blit(player1_surface, (MARGIN, WINDOW_SIZE - 30))
    screen.blit(player2_surface, (WINDOW_SIZE - MARGIN - player2_surface.get_width(), WINDOW_SIZE - 30))

    moves_surface = font.render(f"剩余步数: {game.max_moves - game.total_moves}", True, TEXT_COLOR)
    screen.blit(moves_surface, (WINDOW_SIZE // 2 - moves_surface.get_width() // 2, WINDOW_SIZE - 30))

    if not game.game_over:
        current_label = player_names.get(game.current_player, f"玩家{game.current_player}")
        player_color = PLAYER1_COLOR if game.current_player == 1 else PLAYER2_COLOR
        turn_surface = font.render(f"当前回合: {current_label}", True, player_color)
        screen.blit(turn_surface, (WINDOW_SIZE // 2 - turn_surface.get_width() // 2, 15))

    if hasattr(game, "match_id"):
        role_text = "观战"
        if getattr(game, "player_number", None) in (1, 2):
            role_text = f"你是玩家{game.player_number}"
        match_surface = small_font.render(f"房间: {game.match_id} | {role_text}", True, TEXT_COLOR)
        screen.blit(match_surface, (WINDOW_SIZE // 2 - match_surface.get_width() // 2, 45))

    status_text = getattr(game, "status_message", "")
    if status_text:
        status_surface = small_font.render(status_text, True, TEXT_COLOR)
        screen.blit(status_surface, (WINDOW_SIZE // 2 - status_surface.get_width() // 2, WINDOW_SIZE - 60))

    if game.game_over:
        overlay = pygame.Surface((WINDOW_SIZE, WINDOW_SIZE))
        overlay.set_alpha(180)
        overlay.fill((0, 0, 0))
        screen.blit(overlay, (0, 0))
        if game.winner == 0:
            result_text = "游戏结束: 平局!"
            color = TEXT_COLOR
        else:
            winner_label = player_names.get(game.winner, f"玩家{game.winner}")
            result_text = f"游戏结束: {winner_label} 获胜!"
            color = PLAYER1_COLOR if game.winner == 1 else PLAYER2_COLOR
        result_surface = font.render(result_text, True, color)
        screen.blit(result_surface, (WINDOW_SIZE // 2 - result_surface.get_width() // 2, WINDOW_SIZE // 2 - 30))
        score_surface = small_font.render(
            f"{player1_label}: {player1_score} | {player2_label}: {player2_score}", True, TEXT_COLOR)
        screen.blit(score_surface, (WINDOW_SIZE // 2 - score_surface.get_width() // 2, WINDOW_SIZE // 2 + 10))
        button_rect = pygame.Rect(WINDOW_SIZE // 2 - 80, WINDOW_SIZE // 2 + 50, 160, 40)
        pygame.draw.rect(screen, BUTTON_COLOR, button_rect, border_radius=10)
        pygame.draw.rect(screen, HIGHLIGHT_COLOR, button_rect, 2, border_radius=10)
        restart_text = small_font.render("重新开始", True, TEXT_COLOR)
        screen.blit(restart_text, (button_rect.centerx - restart_text.get_width() // 2,
                                   button_rect.centery - restart_text.get_height() // 2))
        return button_rect
    return None


def prompt_mode():
    while True:
        choice = input("选择模式: 1=本地双人, 2=在线对战 >>> ").strip()
        if choice in ("1", "2"):
            return choice


def prompt_online_config():
    server_url = input("服务器地址(默认 http://127.0.0.1:5000): ").strip() or "http://127.0.0.1:5000"
    player_name = input("玩家昵称: ").strip() or "玩家"
    while True:
        match_id = input("请输入四位数字对局ID: ").strip()
        if match_id.isdigit() and len(match_id) == 4:
            break
        print("对局ID必须为4位数字")
    return server_url, player_name, match_id


def init_game():
    mode = prompt_mode()
    if mode == "1":
        return LocalGame()
    server_url, player_name, match_id = prompt_online_config()
    return RemoteGame(server_url, player_name, match_id)


def main():
    try:
        game = init_game()
    except Exception as exc:
        print(f"初始化失败: {exc}")
        pygame.quit()
        sys.exit(1)

    restart_button = None

    while True:
        if isinstance(game, RemoteGame):
            game.sync_state()

        mouse_pos = pygame.mouse.get_pos()
        for event in pygame.event.get():
            if event.type == QUIT:
                pygame.quit()
                sys.exit()
            if event.type == MOUSEBUTTONDOWN:
                if game.game_over and restart_button and restart_button.collidepoint(mouse_pos):
                    game.reset()
                    continue
                if not game.game_over:
                    if MARGIN <= mouse_pos[0] < MARGIN + BOARD_SIZE * CELL_SIZE and \
                            MARGIN <= mouse_pos[1] < MARGIN + BOARD_SIZE * CELL_SIZE:
                        col = (mouse_pos[0] - MARGIN) // CELL_SIZE
                        row = (mouse_pos[1] - MARGIN) // CELL_SIZE
                        if hasattr(game, "is_my_turn") and not game.is_my_turn():
                            continue
                        game.make_move(row, col)

        restart_button = draw_board(game)
        if game.game_over and restart_button and restart_button.collidepoint(mouse_pos):
            pygame.draw.rect(screen, BUTTON_HOVER_COLOR, restart_button, border_radius=10)
            pygame.draw.rect(screen, HIGHLIGHT_COLOR, restart_button, 2, border_radius=10)
            restart_text = small_font.render("重新开始", True, TEXT_COLOR)
            screen.blit(restart_text, (restart_button.centerx - restart_text.get_width() // 2,
                                       restart_button.centery - restart_text.get_height() // 2))

        pygame.display.flip()
        clock.tick(FPS)


if __name__ == "__main__":
    main()
