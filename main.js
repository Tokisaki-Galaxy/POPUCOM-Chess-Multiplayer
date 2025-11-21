const APP_ROOT_ID = 'app';
const BOARD_SIZE = 9;
const MAX_MOVES = 50;
const GAME_API_BASE = '/api/game';
const POLL_INTERVAL_MS = 2000;

const templates = {
    mainMenu: `
        <div id="main-menu" class="screen-overlay">
            <div class="menu-card">
                <button class="menu-btn" onclick="ui.showLocalGame()">单人练习 / 本地对战</button>
                <button class="menu-btn" onclick="ui.showLobby()">多人在线联机</button>
                <div class="rules">
                    <p>断线不会导致数据清空，输入相同的房间号就回来了。</p>
                    <p>由于服务器大小限制，48小时内不活跃的房间将在每天北京时间(UTC+8) 4:00清空！</p>
                    <h2>规则速览</h2>
                    <ul>
                        <li>棋盘大小：9 × 9。</li>
                        <li>己方三颗棋子连成直线（横 / 竖 / 两种对角线）后，该三颗棋子消除。</li>
                        <li>形成的那条线以及向两端延伸，直至被敌方棋子阻挡的同方向格子，标记为己方领地。</li>
                        <li>领地可以被后续对方再次覆盖。</li>
                        <li>落子只能放在未被敌方占领的格子（即中立格或己方领地）。</li>
                        <li>若延伸方向遇到敌方棋子，领地延伸立即停止。</li>
                        <li>双方总共走满 50 步后比较领地格数，多者胜；相同则平局。</li>
                    </ul>
                </div>
            </div>
        </div>
    `,
    lobby: `
        <div id="online-lobby" class="screen-overlay hidden">
            <div class="menu-card">
                <h2>在线大厅</h2>
                <input type="text" id="room-id" class="room-input" placeholder="输入房间号 (例: 666ABC)" maxlength="10">
                <button class="menu-btn" onclick="ui.joinOnlineGame(1)">我是玩家 1 (红 - 先手)</button>
                <button class="menu-btn" onclick="ui.joinOnlineGame(2)">我是玩家 2 (蓝 - 后手)</button>
                <button class="menu-btn secondary" onclick="ui.showMainMenu()">返回主菜单</button>
            </div>
        </div>
    `,
    game: `
        <div id="game-container" class="hidden">
            <button class="back-btn" onclick="location.reload()">退出</button>
            <h1>泡姆三消棋</h1>
            <div class="status-bar">
                <div class="player-indicator" id="p1-indicator">
                    <span class="dot p1"></span>
                    <span class="p1-text">玩家1: <span id="score-p1">0</span></span>
                </div>
                <div class="player-indicator" id="p2-indicator">
                    <span class="dot p2"></span>
                    <span class="p2-text">玩家2: <span id="score-p2">0</span></span>
                </div>
            </div>
            <div class="board-container">
                <div class="board" id="game-board"></div>
            </div>
            <div class="info-panel">
                <div id="turn-text">准备就绪</div>
                <div class="moves-left">剩余步数: <span id="moves-count">50</span></div>
            </div>
        </div>
    `
};

const rootElement = document.getElementById(APP_ROOT_ID);

(async function bootstrap() {
    try {
        injectRemoteMarkup();
        attachExportButton();
    } catch (error) {
        console.error('UI 加载失败:', error);
        if (rootElement) {
            rootElement.innerHTML = '<div class="loading-error">界面加载失败，请刷新重试</div>';
        }
    }
})();

function injectRemoteMarkup() {
    if (!rootElement) throw new Error('找不到挂载节点');
    rootElement.innerHTML = `${templates.mainMenu}${templates.lobby}${templates.game}`;
}

function attachExportButton() {
    if (!document.querySelector('.github-btn')) {
        const githubBtn = document.createElement('button');
        githubBtn.className = 'floating-btn github-btn';
        githubBtn.innerHTML = '🌟 GitHub 项目';
        githubBtn.onclick = () => {
            window.open('https://github.com/Tokisaki-Galaxy/POPUCOM-Chess-Multiplayer', '_blank', 'noopener');
        };
        document.body.appendChild(githubBtn);
    }

    if (!document.querySelector('.export-btn')) {
        const exportBtn = document.createElement('button');
        exportBtn.className = 'floating-btn export-btn';
        exportBtn.innerHTML = '📷 截图';
        exportBtn.onclick = exportMatchImage;
        document.body.appendChild(exportBtn);
    }
}

async function requestJson(url, options = {}, { allow404 = false } = {}) {
    const response = await fetch(url, options);
    if (allow404 && response.status === 404) {
        return null;
    }
    const hasBody = response.status !== 204;
    const payload = hasBody ? await response.json().catch(() => null) : null;
    if (!response.ok) {
        const message = payload?.error || payload?.message || '请求失败';
        throw new Error(message);
    }
    return payload;
}

function buildRequestOptions(method, body) {
    return {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
}

async function fetchGameState(roomId) {
    if (!roomId) throw new Error('缺少房间号');
    const url = `${GAME_API_BASE}?roomId=${encodeURIComponent(roomId)}`;
    return requestJson(url, {}, { allow404: true });
}

async function ensureRoom(roomId) {
    if (!roomId) throw new Error('缺少房间号');
    return requestJson(GAME_API_BASE, buildRequestOptions('POST', { roomId }));
}

async function updateGameState(roomId, state) {
    if (!roomId) throw new Error('缺少房间号');
    return requestJson(GAME_API_BASE, buildRequestOptions('PUT', { roomId, state }));
}

class BaseGame {
    constructor() {
        this.boardElement = document.getElementById('game-board');
        this.scoreP1El = document.getElementById('score-p1');
        this.scoreP2El = document.getElementById('score-p2');
        this.movesEl = document.getElementById('moves-count');
        this.turnTextEl = document.getElementById('turn-text');
        this.p1Indicator = document.getElementById('p1-indicator');
        this.p2Indicator = document.getElementById('p2-indicator');
        this.resetState();
    }

    resetState() {
        this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        this.territory = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        this.currentPlayer = 1;
        this.totalMoves = 0;
        this.gameOver = false;
        this.winner = 0;
        this.lastMovePos = null;
    }

    init() {
        this.renderBoard();
        this.updateUI();
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.onclick = () => this.handleClick(r, c);
                this.boardElement.appendChild(cell);
            }
        }
        this.updateBoardVisuals();
    }

    updateBoardVisuals() {
        const cells = this.boardElement.children;
        for (let i = 0; i < cells.length; i++) {
            const r = parseInt(cells[i].dataset.row, 10);
            const c = parseInt(cells[i].dataset.col, 10);
            cells[i].className = 'cell';
            if (this.board[r][c] === 1) cells[i].classList.add('p1', 'has-piece');
            if (this.board[r][c] === 2) cells[i].classList.add('p2', 'has-piece');
            if (this.territory[r][c] === 1) cells[i].classList.add('territory-p1');
            if (this.territory[r][c] === 2) cells[i].classList.add('territory-p2');
            if (this.lastMovePos && this.lastMovePos.row === r && this.lastMovePos.col === c) {
                cells[i].classList.add('last-move');
            }
        }
    }

    calculateNextState(row, col, player) {
        const newBoard = JSON.parse(JSON.stringify(this.board));
        const newTerritory = JSON.parse(JSON.stringify(this.territory));
        newBoard[row][col] = player;

        const tempBoard = this.board;
        const tempTerritory = this.territory;
        this.board = newBoard;
        this.territory = newTerritory;

        const eliminations = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (c <= BOARD_SIZE - 3 && this.board[r][c] === player && this.board[r][c + 1] === player && this.board[r][c + 2] === player)
                    eliminations.push({ type: 'h', start: [r, c], end: [r, c + 2] });
                if (r <= BOARD_SIZE - 3 && this.board[r][c] === player && this.board[r + 1][c] === player && this.board[r + 2][c] === player)
                    eliminations.push({ type: 'v', start: [r, c], end: [r + 2, c] });
                if (r <= BOARD_SIZE - 3 && c <= BOARD_SIZE - 3 && this.board[r][c] === player && this.board[r + 1][c + 1] === player && this.board[r + 2][c + 2] === player)
                    eliminations.push({ type: 'd1', start: [r, c], end: [r + 2, c + 2] });
                if (r <= BOARD_SIZE - 3 && c >= 2 && this.board[r][c] === player && this.board[r + 1][c - 1] === player && this.board[r + 2][c - 2] === player)
                    eliminations.push({ type: 'd2', start: [r, c], end: [r + 2, c - 2] });
            }
        }

        eliminations.forEach(e => {
            const [r1, c1] = e.start; const [r2, c2] = e.end;
            if (e.type === 'h') for (let c = c1; c <= c2; c++) this.board[r1][c] = 0;
            if (e.type === 'v') for (let r = r1; r <= r2; r++) this.board[r][c1] = 0;
            if (e.type === 'd1') for (let i = 0; i <= r2 - r1; i++) this.board[r1 + i][c1 + i] = 0;
            if (e.type === 'd2') for (let i = 0; i <= r2 - r1; i++) this.board[r1 + i][c1 - i] = 0;

            const opp = 3 - player;
            const setT = (r, c) => this.territory[r][c] = player;
            const checkBlock = (r, c) => this.board[r][c] === opp;

            if (e.type === 'h') {
                for (let c = c1; c <= c2; c++) setT(r1, c);
                for (let c = c1 - 1; c >= 0; c--) { if (checkBlock(r1, c)) break; setT(r1, c); if (c > 0 && checkBlock(r1, c - 1)) break; }
                for (let c = c2 + 1; c < BOARD_SIZE; c++) { if (checkBlock(r1, c)) break; setT(r1, c); if (c < BOARD_SIZE - 1 && checkBlock(r1, c + 1)) break; }
            } else if (e.type === 'v') {
                for (let r = r1; r <= r2; r++) setT(r, c1);
                for (let r = r1 - 1; r >= 0; r--) { if (checkBlock(r, c1)) break; setT(r, c1); if (r > 0 && checkBlock(r - 1, c1)) break; }
                for (let r = r2 + 1; r < BOARD_SIZE; r++) { if (checkBlock(r, c1)) break; setT(r, c1); if (r < BOARD_SIZE - 1 && checkBlock(r + 1, c1)) break; }
            } else if (e.type === 'd1') {
                for (let i = 0; i <= r2 - r1; i++) setT(r1 + i, c1 + i);
                let r = r1 - 1, c = c1 - 1;
                while (r >= 0 && c >= 0) { if (checkBlock(r, c)) break; setT(r, c); if (r > 0 && c > 0 && checkBlock(r - 1, c - 1)) break; r--; c--; }
                r = r2 + 1; c = c2 + 1;
                while (r < BOARD_SIZE && c < BOARD_SIZE) { if (checkBlock(r, c)) break; setT(r, c); if (r < BOARD_SIZE - 1 && c < BOARD_SIZE - 1 && checkBlock(r + 1, c + 1)) break; r++; c++; }
            } else if (e.type === 'd2') {
                for (let i = 0; i <= r2 - r1; i++) setT(r1 + i, c1 - i);
                let r = r1 - 1, c = c1 + 1;
                while (r >= 0 && c < BOARD_SIZE) { if (checkBlock(r, c)) break; setT(r, c); if (r > 0 && c < BOARD_SIZE - 1 && checkBlock(r - 1, c + 1)) break; r--; c++; }
                r = r2 + 1; c = c2 - 1;
                while (r < BOARD_SIZE && c >= 0) { if (checkBlock(r, c)) break; setT(r, c); if (r < BOARD_SIZE - 1 && c > 0 && checkBlock(r + 1, c - 1)) break; r++; c--; }
            }
        });

        const finalBoard = this.board;
        const finalTerritory = this.territory;
        this.board = tempBoard;
        this.territory = tempTerritory;

        return { board: finalBoard, territory: finalTerritory };
    }

    checkWinner() {
        const [s1, s2] = this.getScores();
        if (s1 > s2) return 1;
        if (s2 > s1) return 2;
        return 0;
    }

    getScores() {
        let s1 = 0, s2 = 0;
        for (let r = 0; r < BOARD_SIZE; r++)
            for (let c = 0; c < BOARD_SIZE; c++)
                if (this.territory[r][c] === 1) s1++;
                else if (this.territory[r][c] === 2) s2++;
        return [s1, s2];
    }

    updateUI() {
        const [s1, s2] = this.getScores();
        this.scoreP1El.textContent = s1;
        this.scoreP2El.textContent = s2;
        this.movesEl.textContent = MAX_MOVES - this.totalMoves;

        let statusMsg = '';
        if (this.gameOver) {
            statusMsg = this.winner === 0 ? '游戏结束: 平局' : `游戏结束: 玩家${this.winner} 获胜!`;
        } else {
            statusMsg = `当前回合: 玩家${this.currentPlayer} (${this.currentPlayer === 1 ? '红' : '蓝'})`;
        }

        let statusColor;
        if (this.gameOver) {
            if (this.winner === 1) statusColor = 'var(--p1-color)';
            else if (this.winner === 2) statusColor = 'var(--p2-color)';
            else statusColor = '#ccc';
        } else {
            statusColor = this.currentPlayer === 1 ? 'var(--p1-color)' : 'var(--p2-color)';
        }

        this.turnTextEl.textContent = statusMsg;
        this.turnTextEl.style.color = statusColor;

        this.p1Indicator.classList.toggle('active', this.currentPlayer === 1);
        this.p2Indicator.classList.toggle('active', this.currentPlayer === 2);
    }
}

class LocalGame extends BaseGame {
    handleClick(row, col) {
        if (this.gameOver) return;
        if (this.board[row][col] !== 0) return;
        if (this.territory[row][col] === 3 - this.currentPlayer) return;
        const nextState = this.calculateNextState(row, col, this.currentPlayer);
        this.board = nextState.board;
        this.territory = nextState.territory;
        this.lastMovePos = { row, col };
        this.totalMoves++;
        if (this.totalMoves >= MAX_MOVES) {
            this.gameOver = true;
            this.winner = this.checkWinner();
        } else {
            this.currentPlayer = 3 - this.currentPlayer;
        }
        this.updateBoardVisuals();
        this.updateUI();
    }
}

class OnlineGame extends BaseGame {
    constructor(roomId, role) {
        super();
        this.roomId = roomId;
        this.myRole = role;
        this.pollTimer = null;
        this.initOnline();
    }

    async initOnline() {
        this.turnTextEl.textContent = '正在连接服务器...';
        try {
            let state;
            if (this.myRole === 1) {
                state = await ensureRoom(this.roomId);
            } else {
                state = await fetchGameState(this.roomId);
                if (!state) throw new Error('房间不存在，请让玩家1先创建');
            }
            if (state) {
                this.syncState(state);
            }
            this.init();
            this.startPolling();
        } catch (error) {
            console.error('在线模式初始化失败:', error);
            alert(error.message || '在线模式初始化失败');
            location.reload();
        }
    }

    startPolling() {
        this.stopPolling();
        this.pollTimer = setInterval(async () => {
            try {
                const latest = await fetchGameState(this.roomId);
                if (latest) {
                    this.syncState(latest);
                }
            } catch (error) {
                console.error('轮询失败:', error);
            }
        }, POLL_INTERVAL_MS);
    }

    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    syncState(data) {
        if (!data) return;
        this.board = data.board;
        this.territory = data.territory;
        this.currentPlayer = data.current_player;
        this.lastMovePos = data.last_move_pos;
        if (typeof data?.last_move_pos?.move_number === 'number') {
            this.totalMoves = data.last_move_pos.move_number;
        }
        if (data.winner === null || data.winner === undefined) {
            this.gameOver = false;
            this.winner = 0;
        } else {
            this.gameOver = true;
            this.winner = data.winner;
        }
        this.updateBoardVisuals();
        this.updateUI();
        if (this.gameOver) {
            this.stopPolling();
        }
    }

    async handleClick(row, col) {
        if (this.gameOver) return;
        if (this.currentPlayer !== this.myRole) {
            alert('还没轮到你！');
            return;
        }
        if (this.board[row][col] !== 0) return;
        if (this.territory[row][col] === 3 - this.currentPlayer) return;

        const nextState = this.calculateNextState(row, col, this.currentPlayer);
        const nextPlayer = 3 - this.currentPlayer;

        this.board = nextState.board;
        this.territory = nextState.territory;
        this.lastMovePos = { row, col };
        this.totalMoves++;

        if (this.totalMoves >= MAX_MOVES) {
            this.gameOver = true;
            this.winner = this.checkWinner();
        } else {
            this.currentPlayer = nextPlayer;
        }

        this.updateBoardVisuals();
        this.updateUI();

        const serverPayload = {
            board: this.board,
            territory: this.territory,
            currentPlayer: this.currentPlayer,
            winner: this.gameOver ? this.winner : null,
            lastMovePos: { ...this.lastMovePos, move_number: this.totalMoves }
        };

        try {
            await updateGameState(this.roomId, serverPayload);
            if (this.gameOver) {
                this.stopPolling();
            }
        } catch (error) {
            console.error('同步服务器失败:', error);
            alert('同步服务器失败，请稍后再试');
        }
    }
}

function resetCurrentGame() {
    if (window.currentGame?.stopPolling) {
        window.currentGame.stopPolling();
    }
    window.currentGame = null;
}

const ui = {
    showMainMenu: () => {
        resetCurrentGame();
        document.getElementById('main-menu')?.classList.remove('hidden');
        document.getElementById('online-lobby')?.classList.add('hidden');
        document.getElementById('game-container')?.classList.add('hidden');
    },
    showLocalGame: () => {
        resetCurrentGame();
        document.getElementById('main-menu')?.classList.add('hidden');
        document.getElementById('game-container')?.classList.remove('hidden');
        window.currentGame = new LocalGame();
        window.currentGame.init();
    },
    showLobby: () => {
        document.getElementById('main-menu')?.classList.add('hidden');
        document.getElementById('online-lobby')?.classList.remove('hidden');
    },
    joinOnlineGame: role => {
        const roomId = document.getElementById('room-id')?.value.trim();
        if (!roomId) return alert('请输入房间号！');
        resetCurrentGame();
        document.getElementById('online-lobby')?.classList.add('hidden');
        document.getElementById('game-container')?.classList.remove('hidden');
        window.currentGame = new OnlineGame(roomId, role);
    }
};

window.ui = ui;
window.currentGame = null;

function exportMatchImage() {
    const btn = document.querySelector('.export-btn');
    if (!btn) return;
    btn.style.display = 'none';
    document.body.style.cursor = 'wait';
    html2canvas(document.body, {
        backgroundColor: '#1c232b',
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        const date = new Date();
        const timeStr = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}_${date.getHours()}${date.getMinutes()}`;
        link.download = `泡姆三消棋_战绩_${timeStr}.png`;
        link.href = canvas.toDataURL();
        link.click();
        btn.style.display = 'flex';
        document.body.style.cursor = 'default';
    }).catch(err => {
        console.error('截图失败:', err);
        alert('截图失败，请重试');
        btn.style.display = 'flex';
        document.body.style.cursor = 'default';
    });
}
