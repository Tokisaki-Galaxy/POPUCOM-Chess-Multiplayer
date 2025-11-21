import uuid
from threading import Lock
from flask import Flask, request, jsonify
import numpy as np

BOARD_SIZE = 9
MAX_MOVES = 50


class GameEngine:
    def __init__(self):
        self.reset()

    def reset(self):
        self.board = np.zeros((BOARD_SIZE, BOARD_SIZE), dtype=int)
        self.territory = np.zeros((BOARD_SIZE, BOARD_SIZE), dtype=int)
        self.current_player = 1
        self.total_moves = 0
        self.max_moves = MAX_MOVES
        self.game_over = False
        self.winner = None
        self.last_move_pos = None
        self.player_names = {1: "玩家1", 2: "玩家2"}

    def make_move(self, row, col):
        if self.game_over:
            raise RuntimeError("对局已结束")
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

    def to_dict(self):
        p1, p2 = self.get_score()
        return {
            "board": self.board.tolist(),
            "territory": self.territory.tolist(),
            "currentPlayer": self.current_player,
            "totalMoves": self.total_moves,
            "maxMoves": self.max_moves,
            "gameOver": self.game_over,
            "winner": self.winner,
            "lastMove": list(self.last_move_pos) if self.last_move_pos else None,
            "playerNames": self.player_names,
            "playerScores": {"1": p1, "2": p2},
        }


class MatchState:
    def __init__(self, match_id):
        self.match_id = match_id
        self.game = GameEngine()
        self.players = {}
        self.tokens = {}
        self.lock = Lock()

    def _sync_player_names(self):
        names = {num: info["name"] for num, info in self.players.items()}
        merged = {1: "玩家1", 2: "玩家2"}
        merged.update(names)
        self.game.player_names = merged

    def join(self, player_name):
        with self.lock:
            if len(self.players) >= 2:
                raise ValueError("对局已满")
            slot = 1 if 1 not in self.players else 2
            token = uuid.uuid4().hex
            self.players[slot] = {"name": player_name, "token": token}
            self.tokens[token] = slot
            self._sync_player_names()
            return slot, token

    def play_move(self, token, row, col):
        with self.lock:
            if token not in self.tokens:
                raise PermissionError("无效的玩家令牌")
            player_num = self.tokens[token]
            if self.game.game_over:
                raise RuntimeError("对局已结束")
            if player_num != self.game.current_player:
                raise ValueError("尚未轮到你")
            if not (0 <= row < BOARD_SIZE and 0 <= col < BOARD_SIZE):
                raise ValueError("坐标越界")
            if not self.game.make_move(row, col):
                raise ValueError("该位置无法落子")
            return self.snapshot_unlocked()

    def reset_game(self, token):
        with self.lock:
            if token not in self.tokens:
                raise PermissionError("无效的玩家令牌")
            self.game.reset()
            self._sync_player_names()
            return self.snapshot_unlocked()

    def snapshot(self):
        with self.lock:
            return self.snapshot_unlocked()

    def snapshot_unlocked(self):
        data = self.game.to_dict()
        players = {}
        for num in (1, 2):
            if num in self.players:
                players[str(num)] = {"name": self.players[num]["name"], "joined": True}
            else:
                players[str(num)] = {"name": f"玩家{num}", "joined": False}
        data["players"] = players
        data["matchId"] = self.match_id
        data["availableSlots"] = 2 - len(self.players)
        return data


app = Flask(__name__)
matches = {}
matches_lock = Lock()


def get_or_create_match(match_id):
    with matches_lock:
        if match_id not in matches:
            matches[match_id] = MatchState(match_id)
        return matches[match_id]


@app.route("/matches/<match_id>/join", methods=["POST"])
def join_match(match_id):
    payload = request.get_json(silent=True) or {}
    player_name = payload.get("playerName")
    if not player_name:
        return jsonify({"message": "playerName字段不能为空"}), 400
    match = get_or_create_match(match_id)
    try:
        slot, token = match.join(player_name)
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"matchId": match_id, "playerNumber": slot, "playerToken": token})


@app.route("/matches/<match_id>", methods=["GET"])
def fetch_match(match_id):
    match = get_or_create_match(match_id)
    return jsonify(match.snapshot())


@app.route("/matches/<match_id>/move", methods=["POST"])
def place_move(match_id):
    payload = request.get_json(silent=True) or {}
    token = payload.get("playerToken")
    row = payload.get("row")
    col = payload.get("col")
    if token is None or row is None or col is None:
        return jsonify({"message": "缺少必要字段"}), 400
    try:
        row = int(row)
        col = int(col)
    except ValueError:
        return jsonify({"message": "坐标必须为整数"}), 400
    match = get_or_create_match(match_id)
    try:
        snapshot = match.play_move(token, row, col)
    except PermissionError as exc:
        return jsonify({"message": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    except RuntimeError as exc:
        return jsonify({"message": str(exc)}), 409
    return jsonify(snapshot)


@app.route("/matches/<match_id>/reset", methods=["POST"])
def reset_match(match_id):
    payload = request.get_json(silent=True) or {}
    token = payload.get("playerToken")
    if not token:
        return jsonify({"message": "playerToken字段不能为空"}), 400
    match = get_or_create_match(match_id)
    try:
        snapshot = match.reset_game(token)
    except PermissionError as exc:
        return jsonify({"message": str(exc)}), 403
    return jsonify(snapshot)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
