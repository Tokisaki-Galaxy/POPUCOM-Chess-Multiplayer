/**
 * i18n (Internationalization) Module
 * Supports: Chinese (zh-CN), English (en), Japanese (ja)
 */

const translations = {
    'zh-CN': {
        // Page Title
        'page.title': '泡姆三消棋 - 多人联机版',
        'page.loading': '界面加载中...',
        'page.loadError': '界面加载失败，请刷新重试',
        
        // Main Menu
        'menu.title': '泡姆三消棋',
        'menu.localGame': '单人练习 / 本地对战',
        'menu.onlineGame': '多人在线联机',
        'menu.disconnectInfo': '断线不会导致数据清空，输入相同的房间号就回来了。',
        'menu.cleanupInfo': '由于服务器大小限制，48小时内不活跃的房间将在每天北京时间(UTC+8) 4:00清空！',
        'menu.rulesTitle': '规则速览',
        'menu.rule1': '棋盘大小：9 × 9。',
        'menu.rule2': '己方三颗棋子连成直线（横 / 竖 / 两种对角线）后，该三颗棋子消除。',
        'menu.rule3': '形成的那条线以及向两端延伸，直至被敌方棋子阻挡的同方向格子，标记为己方领地。',
        'menu.rule4': '领地可以被后续对方再次覆盖。',
        'menu.rule5': '落子只能放在未被敌方占领的格子（即中立格或己方领地）。',
        'menu.rule6': '若延伸方向遇到敌方棋子，领地延伸立即停止。',
        'menu.rule7': '双方总共走满 50 步后比较领地格数，多者胜；相同则平局。',
        
        // Online Lobby
        'lobby.title': '在线大厅',
        'lobby.roomPlaceholder': '输入房间号 (例: 666ABC)',
        'lobby.joinAsP1': '我是玩家 1 (红 - 先手)',
        'lobby.joinAsP2': '我是玩家 2 (蓝 - 后手)',
        'lobby.backToMenu': '返回主菜单',
        
        // Game UI
        'game.exit': '退出',
        'game.title': '泡姆三消棋',
        'game.player1': '玩家1',
        'game.player2': '玩家2',
        'game.ready': '准备就绪',
        'game.movesLeft': '剩余步数',
        'game.resetRoom': '🔄 重置房间 (再来一局)',
        
        // Game Status
        'status.connecting': '正在连接服务器...',
        'status.resetting': '正在重置房间...',
        'status.gameOver': '游戏结束',
        'status.draw': '平局',
        'status.playerWins': '玩家{player} 获胜!',
        'status.currentTurn': '当前回合: 玩家{player} ({color})',
        'status.red': '红',
        'status.blue': '蓝',
        
        // Buttons
        'btn.github': '🌟 GitHub 项目',
        'btn.screenshot': '📷 截图',
        
        // Alerts & Errors
        'alert.roomRequired': '请输入房间号！',
        'alert.notYourTurn': '还没轮到你！',
        'alert.roomNotExist': '房间不存在，请让玩家1先创建',
        'alert.onlineInitFailed': '在线模式初始化失败',
        'alert.syncFailed': '同步服务器失败，请稍后再试',
        'alert.resetFailed': '重置房间失败，请稍后重试',
        'alert.screenshotFailed': '截图失败，请重试',
        
        // Screenshot filename
        'screenshot.filename': '泡姆三消棋_战绩',
        
        // Language Selector
        'lang.selector': '🌐 语言',
        'lang.zhCN': '简体中文',
        'lang.en': 'English',
        'lang.ja': '日本語'
    },
    
    'en': {
        // Page Title
        'page.title': 'POPUCOM Chess - Multiplayer',
        'page.loading': 'Loading interface...',
        'page.loadError': 'Failed to load interface, please refresh',
        
        // Main Menu
        'menu.title': 'POPUCOM Chess',
        'menu.localGame': 'Practice / Local Game',
        'menu.onlineGame': 'Online Multiplayer',
        'menu.disconnectInfo': 'Disconnection won\'t clear data. Simply enter the same room ID to rejoin.',
        'menu.cleanupInfo': 'Due to server limitations, inactive rooms will be cleaned at 4:00 AM (UTC+8) daily!',
        'menu.rulesTitle': 'Rules Overview',
        'menu.rule1': 'Board size: 9 × 9.',
        'menu.rule2': 'When three of your pieces form a line (horizontal / vertical / diagonal), they are eliminated.',
        'menu.rule3': 'The formed line and its extensions in the same direction (until blocked by opponent\'s pieces) are marked as your territory.',
        'menu.rule4': 'Territory can be recaptured by the opponent later.',
        'menu.rule5': 'You can only place pieces on neutral cells or your own territory (not on opponent\'s territory).',
        'menu.rule6': 'If an extension encounters an opponent\'s piece, the territory expansion stops immediately.',
        'menu.rule7': 'After 50 total moves, the player with more territory wins; if equal, it\'s a draw.',
        
        // Online Lobby
        'lobby.title': 'Online Lobby',
        'lobby.roomPlaceholder': 'Enter Room ID (e.g., 666ABC)',
        'lobby.joinAsP1': 'Join as Player 1 (Red - First)',
        'lobby.joinAsP2': 'Join as Player 2 (Blue - Second)',
        'lobby.backToMenu': 'Back to Menu',
        
        // Game UI
        'game.exit': 'Exit',
        'game.title': 'POPUCOM Chess',
        'game.player1': 'Player 1',
        'game.player2': 'Player 2',
        'game.ready': 'Ready',
        'game.movesLeft': 'Moves Left',
        'game.resetRoom': '🔄 Reset Room (Play Again)',
        
        // Game Status
        'status.connecting': 'Connecting to server...',
        'status.resetting': 'Resetting room...',
        'status.gameOver': 'Game Over',
        'status.draw': 'Draw',
        'status.playerWins': 'Player {player} Wins!',
        'status.currentTurn': 'Current Turn: Player {player} ({color})',
        'status.red': 'Red',
        'status.blue': 'Blue',
        
        // Buttons
        'btn.github': '🌟 GitHub Project',
        'btn.screenshot': '📷 Screenshot',
        
        // Alerts & Errors
        'alert.roomRequired': 'Please enter a room ID!',
        'alert.notYourTurn': 'Not your turn yet!',
        'alert.roomNotExist': 'Room does not exist. Player 1 must create it first.',
        'alert.onlineInitFailed': 'Failed to initialize online mode',
        'alert.syncFailed': 'Failed to sync with server, please try again',
        'alert.resetFailed': 'Failed to reset room, please try again',
        'alert.screenshotFailed': 'Screenshot failed, please retry',
        
        // Screenshot filename
        'screenshot.filename': 'POPUCOM_Chess_Score',
        
        // Language Selector
        'lang.selector': '🌐 Language',
        'lang.zhCN': '简体中文',
        'lang.en': 'English',
        'lang.ja': '日本語'
    },
    
    'ja': {
        // Page Title
        'page.title': 'ポプコム三消しチェス - マルチプレイヤー',
        'page.loading': 'インターフェースを読み込み中...',
        'page.loadError': 'インターフェースの読み込みに失敗しました。更新してください',
        
        // Main Menu
        'menu.title': 'ポプコム三消しチェス',
        'menu.localGame': '練習 / ローカルゲーム',
        'menu.onlineGame': 'オンライン対戦',
        'menu.disconnectInfo': '切断してもデータは消去されません。同じルームIDを入力すれば戻れます。',
        'menu.cleanupInfo': 'サーバー容量の制限により、非アクティブなルームは毎日午前4時(UTC+8)にクリーンアップされます！',
        'menu.rulesTitle': 'ルール概要',
        'menu.rule1': 'ボードサイズ：9 × 9。',
        'menu.rule2': '自分の駒が3つ一直線（横・縦・斜め）に並ぶと、それらが消去されます。',
        'menu.rule3': '形成されたラインとその延長線上（相手の駒でブロックされるまで）が自分の領地としてマークされます。',
        'menu.rule4': '領地は後で相手に再占領される可能性があります。',
        'menu.rule5': '駒は中立マスまたは自分の領地にのみ配置できます（相手の領地には配置できません）。',
        'menu.rule6': '延長線上で相手の駒に遭遇すると、領地の拡大が即座に停止します。',
        'menu.rule7': '合計50手後、より多くの領地を持つプレイヤーが勝利します。同じ場合は引き分けです。',
        
        // Online Lobby
        'lobby.title': 'オンラインロビー',
        'lobby.roomPlaceholder': 'ルームIDを入力 (例: 666ABC)',
        'lobby.joinAsP1': 'プレイヤー1として参加 (赤 - 先手)',
        'lobby.joinAsP2': 'プレイヤー2として参加 (青 - 後手)',
        'lobby.backToMenu': 'メニューに戻る',
        
        // Game UI
        'game.exit': '終了',
        'game.title': 'ポプコム三消しチェス',
        'game.player1': 'プレイヤー1',
        'game.player2': 'プレイヤー2',
        'game.ready': '準備完了',
        'game.movesLeft': '残り手数',
        'game.resetRoom': '🔄 ルームをリセット (もう一度プレイ)',
        
        // Game Status
        'status.connecting': 'サーバーに接続中...',
        'status.resetting': 'ルームをリセット中...',
        'status.gameOver': 'ゲーム終了',
        'status.draw': '引き分け',
        'status.playerWins': 'プレイヤー{player}の勝利！',
        'status.currentTurn': '現在のターン: プレイヤー{player} ({color})',
        'status.red': '赤',
        'status.blue': '青',
        
        // Buttons
        'btn.github': '🌟 GitHubプロジェクト',
        'btn.screenshot': '📷 スクリーンショット',
        
        // Alerts & Errors
        'alert.roomRequired': 'ルームIDを入力してください！',
        'alert.notYourTurn': 'まだあなたのターンではありません！',
        'alert.roomNotExist': 'ルームが存在しません。プレイヤー1が先に作成する必要があります。',
        'alert.onlineInitFailed': 'オンラインモードの初期化に失敗しました',
        'alert.syncFailed': 'サーバーとの同期に失敗しました。もう一度お試しください',
        'alert.resetFailed': 'ルームのリセットに失敗しました。もう一度お試しください',
        'alert.screenshotFailed': 'スクリーンショットに失敗しました。再試行してください',
        
        // Screenshot filename
        'screenshot.filename': 'ポプコムチェス_スコア',
        
        // Language Selector
        'lang.selector': '🌐 言語',
        'lang.zhCN': '简体中文',
        'lang.en': 'English',
        'lang.ja': '日本語'
    }
};

class I18n {
    constructor() {
        this.currentLang = this.getSavedLanguage() || this.detectLanguage();
        this.translations = translations;
    }
    
    /**
     * Detect browser language
     */
    detectLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('zh')) return 'zh-CN';
        if (browserLang.startsWith('ja')) return 'ja';
        if (browserLang.startsWith('en')) return 'en';
        return 'zh-CN'; // Default to Chinese
    }
    
    /**
     * Get saved language from localStorage
     */
    getSavedLanguage() {
        return localStorage.getItem('popucom-lang');
    }
    
    /**
     * Save language preference to localStorage
     */
    saveLanguage(lang) {
        localStorage.setItem('popucom-lang', lang);
    }
    
    /**
     * Set current language
     */
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            this.saveLanguage(lang);
            this.updatePageLanguage();
            return true;
        }
        return false;
    }
    
    /**
     * Get current language
     */
    getLanguage() {
        return this.currentLang;
    }
    
    /**
     * Translate a key with optional parameters
     * @param {string} key - Translation key
     * @param {object} params - Parameters to replace in translation
     * @returns {string} - Translated text
     */
    t(key, params = {}) {
        const translation = this.translations[this.currentLang]?.[key] || this.translations['zh-CN'][key] || key;
        
        // Replace parameters like {player}, {color}
        return translation.replace(/\{(\w+)\}/g, (match, param) => {
            return params[param] !== undefined ? params[param] : match;
        });
    }
    
    /**
     * Update page language attribute
     */
    updatePageLanguage() {
        document.documentElement.lang = this.currentLang;
        document.title = this.t('page.title');
    }
    
    /**
     * Get all available languages
     */
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
}

// Create global i18n instance
const i18n = new I18n();

export { i18n, I18n };
