import { i18n } from './i18n.js';

const APP_ROOT_ID = 'app';
const BOARD_SIZE = 9;
const MAX_MOVES = 50;
let GAME_API_BASE = '/api/game';
const FALLBACK_API_BASE = 'https://pop.tokisaki.top/api/game';
const POLL_INTERVAL_MS = 2000;

async function detectBackend() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const response = await fetch(GAME_API_BASE + '?action=ping', { 
            method: 'GET',
            signal: controller.signal 
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error('Local API not responding');
        }
    } catch (e) {
        console.warn('Local API unavailable, falling back to remote:', FALLBACK_API_BASE);
        GAME_API_BASE = FALLBACK_API_BASE;
    }
}

const templates = {
    mainMenu: () => `
        <div id="main-menu" class="screen-overlay">
            <div class="menu-card">
                <h2 data-i18n="menu.title">${i18n.t('menu.title')}</h2>
                <button class="menu-btn" onclick="ui.showLocalGame()" data-i18n="menu.localGame">${i18n.t('menu.localGame')}</button>
                <button class="menu-btn" onclick="ui.showLobby()" data-i18n="menu.onlineGame">${i18n.t('menu.onlineGame')}</button>
                <div class="rules">
                    <p data-i18n="menu.disconnectInfo">${i18n.t('menu.disconnectInfo')}</p>
                    <p data-i18n="menu.cleanupInfo">${i18n.t('menu.cleanupInfo')}</p>
                    <h2 data-i18n="menu.rulesTitle">${i18n.t('menu.rulesTitle')}</h2>
                    <ul>
                        <li data-i18n="menu.rule1">${i18n.t('menu.rule1')}</li>
                        <li data-i18n="menu.rule2">${i18n.t('menu.rule2')}</li>
                        <li data-i18n="menu.rule3">${i18n.t('menu.rule3')}</li>
                        <li data-i18n="menu.rule4">${i18n.t('menu.rule4')}</li>
                        <li data-i18n="menu.rule5">${i18n.t('menu.rule5')}</li>
                        <li data-i18n="menu.rule6">${i18n.t('menu.rule6')}</li>
                        <li data-i18n="menu.rule7">${i18n.t('menu.rule7')}</li>
                    </ul>
                </div>
            </div>
        </div>
    `,
    lobby: () => `
        <div id="online-lobby" class="screen-overlay hidden">
            <div class="menu-card">
                <h2 data-i18n="lobby.title">${i18n.t('lobby.title')}</h2>
                <input type="text" id="room-id" class="room-input" placeholder="${i18n.t('lobby.roomPlaceholder')}" maxlength="10" data-i18n-placeholder="lobby.roomPlaceholder">
                <button class="menu-btn" onclick="ui.joinOnlineGame(1)" data-i18n="lobby.joinAsP1">${i18n.t('lobby.joinAsP1')}</button>
                <button class="menu-btn" onclick="ui.joinOnlineGame(2)" data-i18n="lobby.joinAsP2">${i18n.t('lobby.joinAsP2')}</button>
                <button class="menu-btn secondary" onclick="ui.showMainMenu()" data-i18n="lobby.backToMenu">${i18n.t('lobby.backToMenu')}</button>
            </div>
        </div>
    `,
    game: () => `
        <div id="game-container" class="hidden">
            <button class="back-btn" onclick="location.reload()" data-i18n="game.exit">${i18n.t('game.exit')}</button>
            <h1 data-i18n="game.title">${i18n.t('game.title')}</h1>
            <div class="status-bar">
                <div class="player-indicator" id="p1-indicator">
                    <span class="dot p1"></span>
                    <span class="p1-text"><span data-i18n="game.player1">${i18n.t('game.player1')}</span>: <span id="score-p1">0</span></span>
                </div>
                <div class="player-indicator" id="p2-indicator">
                    <span class="dot p2"></span>
                    <span class="p2-text"><span data-i18n="game.player2">${i18n.t('game.player2')}</span>: <span id="score-p2">0</span></span>
                </div>
            </div>
            <div class="board-container">
                <div class="board" id="game-board"></div>
            </div>
            <div class="info-panel">
                <div id="turn-text" data-i18n="game.ready">${i18n.t('game.ready')}</div>
                <div class="moves-left"><span data-i18n="game.movesLeft">${i18n.t('game.movesLeft')}</span>: <span id="moves-count">50</span></div>
                <button class="reset-room-btn hidden" id="reset-room-btn" onclick="ui.resetCurrentRoom()" data-i18n="game.resetRoom">${i18n.t('game.resetRoom')}</button>
            </div>
        </div>
    `
};

const rootElement = document.getElementById(APP_ROOT_ID);

(async function bootstrap() {
    try {
        // Initialize i18n system: detect/load saved language and update page title/lang attribute
        i18n.updatePageLanguage();
        await detectBackend();
        injectRemoteMarkup();
        attachExportButton();
        attachLanguageSelector();
    } catch (error) {
        console.error('UI initialization failed:', error);
        if (rootElement) {
            rootElement.innerHTML = `<div class="loading-error" data-i18n="page.loadError">${i18n.t('page.loadError')}</div>`;
        }
    }
})();

function injectRemoteMarkup() {
    if (!rootElement) throw new Error('Root element not found');
    rootElement.innerHTML = `${templates.mainMenu()}${templates.lobby()}${templates.game()}`;
}

function attachExportButton() {
    if (!document.querySelector('.github-btn')) {
        const githubBtn = document.createElement('button');
        githubBtn.className = 'floating-btn github-btn';
        githubBtn.innerHTML = i18n.t('btn.github');
        githubBtn.setAttribute('data-i18n', 'btn.github');
        githubBtn.onclick = () => {
            window.open('https://github.com/Tokisaki-Galaxy/POPUCOM-Chess-Multiplayer', '_blank', 'noopener');
        };
        document.body.appendChild(githubBtn);
    }

    if (!document.querySelector('.export-btn')) {
        const exportBtn = document.createElement('button');
        exportBtn.className = 'floating-btn export-btn';
        exportBtn.innerHTML = i18n.t('btn.screenshot');
        exportBtn.setAttribute('data-i18n', 'btn.screenshot');
        exportBtn.onclick = exportMatchImage;
        document.body.appendChild(exportBtn);
    }
}

function attachLanguageSelector() {
    if (!document.querySelector('.lang-selector')) {
        const langSelector = document.createElement('div');
        langSelector.className = 'lang-selector';
        
        const langBtn = document.createElement('button');
        langBtn.className = 'floating-btn lang-btn';
        langBtn.innerHTML = i18n.t('lang.selector');
        langBtn.setAttribute('data-i18n', 'lang.selector');
        langBtn.onclick = () => {
            langDropdown.classList.toggle('show');
        };
        
        const langDropdown = document.createElement('div');
        langDropdown.className = 'lang-dropdown';
        
        const languages = [
            { code: 'zh-CN', label: i18n.t('lang.zhCN') },
            { code: 'en', label: i18n.t('lang.en') },
            { code: 'ja', label: i18n.t('lang.ja') }
        ];
        
        languages.forEach(lang => {
            const langOption = document.createElement('button');
            langOption.className = 'lang-option';
            langOption.textContent = lang.label;
            langOption.setAttribute('data-lang', lang.code);
            if (i18n.getLanguage() === lang.code) {
                langOption.classList.add('active');
            }
            langOption.onclick = () => {
                i18n.setLanguage(lang.code);
                updateAllTranslations();
                langDropdown.classList.remove('show');
                // Update active state
                langDropdown.querySelectorAll('.lang-option').forEach(opt => opt.classList.remove('active'));
                langOption.classList.add('active');
            };
            langDropdown.appendChild(langOption);
        });
        
        langSelector.appendChild(langBtn);
        langSelector.appendChild(langDropdown);
        document.body.appendChild(langSelector);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!langSelector.contains(e.target)) {
                langDropdown.classList.remove('show');
            }
        });
    }
}

function updateAllTranslations() {
    // Update document title and lang attribute
    i18n.updatePageLanguage();
    
    // Re-render templates
    injectRemoteMarkup();
    
    // Re-initialize current game if exists
    if (window.currentGame) {
        const gameContainer = document.getElementById('game-container');
        const isGameActive = gameContainer && !gameContainer.classList.contains('hidden');
        
        if (isGameActive) {
            // Preserve game state while updating UI text
            const tempGame = window.currentGame;
            if (tempGame instanceof LocalGame) {
                window.currentGame = new LocalGame();
                window.currentGame.board = tempGame.board;
                window.currentGame.territory = tempGame.territory;
                window.currentGame.currentPlayer = tempGame.currentPlayer;
                window.currentGame.totalMoves = tempGame.totalMoves;
                window.currentGame.gameOver = tempGame.gameOver;
                window.currentGame.winner = tempGame.winner;
                window.currentGame.lastMovePos = tempGame.lastMovePos;
                window.currentGame.init();
            } else if (tempGame instanceof OnlineGame) {
                // For online game, just update the UI
                tempGame.updateUI();
                tempGame.updateBoardVisuals();
            }
        } else {
            // Re-show the appropriate screen
            const mainMenu = document.getElementById('main-menu');
            const lobby = document.getElementById('online-lobby');
            
            if (mainMenu && !mainMenu.classList.contains('hidden')) {
                ui.showMainMenu();
            } else if (lobby && !lobby.classList.contains('hidden')) {
                ui.showLobby();
            }
        }
    }
    
    // Update floating buttons
    const githubBtn = document.querySelector('.github-btn');
    const exportBtn = document.querySelector('.export-btn');
    const langBtn = document.querySelector('.lang-btn');
    
    if (githubBtn) githubBtn.innerHTML = i18n.t('btn.github');
    if (exportBtn) exportBtn.innerHTML = i18n.t('btn.screenshot');
    if (langBtn) langBtn.innerHTML = i18n.t('lang.selector');
}

async function requestJson(url, options = {}, { allow404 = false } = {}) {
    const response = await fetch(url, options);
    if (allow404 && response.status === 404) {
        return null;
    }
    const hasBody = response.status !== 204;
    const payload = hasBody ? await response.json().catch(() => null) : null;
    if (!response.ok) {
        const message = payload?.error || payload?.message || i18n.t('alert.syncFailed');
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

async function resetRoomState(roomId) {
    if (!roomId) throw new Error('缺少房间号');
    return requestJson(GAME_API_BASE, buildRequestOptions('DELETE', { roomId }));
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
        this.resetRoomBtn = document.getElementById('reset-room-btn');
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
            if (this.winner === 0) {
                statusMsg = `${i18n.t('status.gameOver')}: ${i18n.t('status.draw')}`;
            } else {
                statusMsg = `${i18n.t('status.gameOver')}: ${i18n.t('status.playerWins', { player: this.winner })}`;
            }
        } else {
            const color = this.currentPlayer === 1 ? i18n.t('status.red') : i18n.t('status.blue');
            statusMsg = i18n.t('status.currentTurn', { player: this.currentPlayer, color });
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
        this.turnTextEl.textContent = i18n.t('status.connecting');
        try {
            let state;
            if (this.myRole === 1) {
                state = await ensureRoom(this.roomId);
            } else {
                state = await fetchGameState(this.roomId);
                if (!state) throw new Error(i18n.t('alert.roomNotExist'));
            }
            if (state) {
                this.syncState(state);
            }
            this.init();
            this.startPolling();
        } catch (error) {
            console.error('Online mode initialization failed:', error);
            alert(error.message || i18n.t('alert.onlineInitFailed'));
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
                console.error('Polling failed:', error);
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
            this.resetRoomBtn?.classList.add('hidden');
        } else {
            this.gameOver = true;
            this.winner = data.winner;
            this.resetRoomBtn?.classList.remove('hidden');
        }
        this.updateBoardVisuals();
        this.updateUI();
        if (this.gameOver) {
            this.stopPolling();
        }
    }

    async resetRoom() {
        try {
            this.turnTextEl.textContent = i18n.t('status.resetting');
            const state = await resetRoomState(this.roomId);
            if (state) {
                this.syncState(state);
                this.renderBoard();
                this.startPolling();
            }
        } catch (error) {
            console.error('Room reset failed:', error);
            alert(error.message || i18n.t('alert.resetFailed'));
        }
    }

    async handleClick(row, col) {
        if (this.gameOver) return;
        if (this.currentPlayer !== this.myRole) {
            alert(i18n.t('alert.notYourTurn'));
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
            console.error('Server sync failed:', error);
            alert(i18n.t('alert.syncFailed'));
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
        if (!roomId) return alert(i18n.t('alert.roomRequired'));
        resetCurrentGame();
        document.getElementById('online-lobby')?.classList.add('hidden');
        document.getElementById('game-container')?.classList.remove('hidden');
        window.currentGame = new OnlineGame(roomId, role);
    },
    resetCurrentRoom: async () => {
        if (window.currentGame?.resetRoom) {
            await window.currentGame.resetRoom();
        }
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
        link.download = `${i18n.t('screenshot.filename')}_${timeStr}.png`;
        link.href = canvas.toDataURL();
        link.click();
        btn.style.display = 'flex';
        document.body.style.cursor = 'default';
    }).catch(err => {
        console.error('Screenshot failed:', err);
        alert(i18n.t('alert.screenshotFailed'));
        btn.style.display = 'flex';
        document.body.style.cursor = 'default';
    });
}
