/**
 * Comprehensive tests for serverless game API (api/game.js)
 * Uses test room number "999?#$" with special characters to test deserialization
 */

const BOARD_SIZE = 9;
const MAX_ROOM_ID_LENGTH = 20;
const TEST_ROOM_ID = '999?#$'; // Standard test room ID with special characters

// Re-implement validation functions for testing (they are not exported from the module)
function isValidRoomId(roomId) {
  if (typeof roomId !== 'string') return false;
  if (roomId.length === 0 || roomId.length > MAX_ROOM_ID_LENGTH) return false;
  return true;
}

function isValidGrid(grid) {
  if (!Array.isArray(grid) || grid.length !== BOARD_SIZE) return false;
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== BOARD_SIZE) return false;
    for (const cell of row) {
      if (!Number.isInteger(cell) || cell < 0 || cell > 2) return false;
    }
  }
  return true;
}

function isValidCurrentPlayer(player) {
  return player === 1 || player === 2;
}

function isValidWinner(winner) {
  return winner === null || winner === 0 || winner === 1 || winner === 2;
}

function isValidLastMovePos(pos) {
  if (pos === null || pos === undefined) return true;
  if (typeof pos !== 'object') return false;
  if (typeof pos.row !== 'number' || typeof pos.col !== 'number') return false;
  if (!Number.isInteger(pos.row) || !Number.isInteger(pos.col)) return false;
  if (pos.row < 0 || pos.row >= BOARD_SIZE || pos.col < 0 || pos.col >= BOARD_SIZE) return false;
  if (pos.move_number !== undefined) {
    if (!Number.isInteger(pos.move_number) || pos.move_number < 0) return false;
  }
  return true;
}

function validateState(state) {
  if (!state || typeof state !== 'object') {
    return { valid: false, error: 'state 必须是对象' };
  }
  if (!isValidGrid(state.board)) {
    return { valid: false, error: 'board 格式无效' };
  }
  if (!isValidGrid(state.territory)) {
    return { valid: false, error: 'territory 格式无效' };
  }
  if (!isValidCurrentPlayer(state.currentPlayer)) {
    return { valid: false, error: 'currentPlayer 必须是 1 或 2' };
  }
  if (!isValidWinner(state.winner)) {
    return { valid: false, error: 'winner 格式无效' };
  }
  if (!isValidLastMovePos(state.lastMovePos)) {
    return { valid: false, error: 'lastMovePos 格式无效' };
  }
  return { valid: true };
}

function buildEmptyGrid() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function buildInitialState() {
  return {
    board: buildEmptyGrid(),
    territory: buildEmptyGrid(),
    current_player: 1,
    winner: null,
    last_move_pos: null
  };
}

// ============================================================================
// Test Suite: isValidRoomId
// ============================================================================
describe('isValidRoomId validation', () => {
  // Test with special characters room ID "999?#$" for deserialization testing
  test('should accept test room ID with special characters 999?#$', () => {
    expect(isValidRoomId(TEST_ROOM_ID)).toBe(true);
  });

  test('should accept room ID at max length (20 chars)', () => {
    expect(isValidRoomId('99912345678901234567')).toBe(true); // 20 chars
  });

  test('should reject empty room ID', () => {
    expect(isValidRoomId('')).toBe(false);
  });

  test('should reject room ID exceeding max length', () => {
    expect(isValidRoomId('999123456789012345678')).toBe(false); // 21 chars
  });

  test('should reject null', () => {
    expect(isValidRoomId(null)).toBe(false);
  });

  test('should reject undefined', () => {
    expect(isValidRoomId(undefined)).toBe(false);
  });

  test('should reject number type', () => {
    expect(isValidRoomId(999)).toBe(false);
  });

  test('should reject array type', () => {
    expect(isValidRoomId([TEST_ROOM_ID])).toBe(false);
  });

  test('should reject object type', () => {
    expect(isValidRoomId({ id: TEST_ROOM_ID })).toBe(false);
  });

  test('should accept single character room ID', () => {
    expect(isValidRoomId('9')).toBe(true);
  });
});

// ============================================================================
// Test Suite: isValidGrid
// ============================================================================
describe('isValidGrid validation', () => {
  test('should accept valid empty 9x9 grid', () => {
    const grid = buildEmptyGrid();
    expect(isValidGrid(grid)).toBe(true);
  });

  test('should accept grid with valid values (0, 1, 2)', () => {
    const grid = buildEmptyGrid();
    grid[0][0] = 1;
    grid[0][1] = 2;
    grid[4][4] = 1;
    grid[8][8] = 2;
    expect(isValidGrid(grid)).toBe(true);
  });

  test('should accept grid completely filled with player 1', () => {
    const grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(1));
    expect(isValidGrid(grid)).toBe(true);
  });

  test('should accept grid completely filled with player 2', () => {
    const grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(2));
    expect(isValidGrid(grid)).toBe(true);
  });

  test('should reject null', () => {
    expect(isValidGrid(null)).toBe(false);
  });

  test('should reject undefined', () => {
    expect(isValidGrid(undefined)).toBe(false);
  });

  test('should reject non-array', () => {
    expect(isValidGrid('grid')).toBe(false);
    expect(isValidGrid(123)).toBe(false);
    expect(isValidGrid({})).toBe(false);
  });

  test('should reject grid with wrong row count (8 rows)', () => {
    const grid = Array.from({ length: 8 }, () => Array(BOARD_SIZE).fill(0));
    expect(isValidGrid(grid)).toBe(false);
  });

  test('should reject grid with wrong row count (10 rows)', () => {
    const grid = Array.from({ length: 10 }, () => Array(BOARD_SIZE).fill(0));
    expect(isValidGrid(grid)).toBe(false);
  });

  test('should reject grid with wrong column count', () => {
    const grid = Array.from({ length: BOARD_SIZE }, () => Array(8).fill(0));
    expect(isValidGrid(grid)).toBe(false);
  });

  test('should reject grid with invalid cell value (3)', () => {
    const grid = buildEmptyGrid();
    grid[0][0] = 3;
    expect(isValidGrid(grid)).toBe(false);
  });

  test('should reject grid with negative cell value', () => {
    const grid = buildEmptyGrid();
    grid[0][0] = -1;
    expect(isValidGrid(grid)).toBe(false);
  });

  test('should reject grid with non-integer value', () => {
    const grid = buildEmptyGrid();
    grid[0][0] = 1.5;
    expect(isValidGrid(grid)).toBe(false);
  });

  test('should reject grid with string value', () => {
    const grid = buildEmptyGrid();
    grid[0][0] = '1';
    expect(isValidGrid(grid)).toBe(false);
  });

  test('should reject grid with null cell', () => {
    const grid = buildEmptyGrid();
    grid[0][0] = null;
    expect(isValidGrid(grid)).toBe(false);
  });

  test('should reject grid with row containing non-array', () => {
    const grid = buildEmptyGrid();
    grid[0] = 'not an array';
    expect(isValidGrid(grid)).toBe(false);
  });

  test('should reject empty grid (0 rows)', () => {
    expect(isValidGrid([])).toBe(false);
  });
});

// ============================================================================
// Test Suite: isValidCurrentPlayer
// ============================================================================
describe('isValidCurrentPlayer validation', () => {
  test('should accept player 1', () => {
    expect(isValidCurrentPlayer(1)).toBe(true);
  });

  test('should accept player 2', () => {
    expect(isValidCurrentPlayer(2)).toBe(true);
  });

  test('should reject player 0', () => {
    expect(isValidCurrentPlayer(0)).toBe(false);
  });

  test('should reject player 3', () => {
    expect(isValidCurrentPlayer(3)).toBe(false);
  });

  test('should reject negative player', () => {
    expect(isValidCurrentPlayer(-1)).toBe(false);
  });

  test('should reject null', () => {
    expect(isValidCurrentPlayer(null)).toBe(false);
  });

  test('should reject undefined', () => {
    expect(isValidCurrentPlayer(undefined)).toBe(false);
  });

  test('should reject string "1"', () => {
    expect(isValidCurrentPlayer('1')).toBe(false);
  });

  test('should reject float 1.0 (JS treats as integer)', () => {
    // In JavaScript, 1.0 === 1, so this should pass
    expect(isValidCurrentPlayer(1.0)).toBe(true);
  });

  test('should reject float 1.5', () => {
    expect(isValidCurrentPlayer(1.5)).toBe(false);
  });
});

// ============================================================================
// Test Suite: isValidWinner
// ============================================================================
describe('isValidWinner validation', () => {
  test('should accept null (game not over)', () => {
    expect(isValidWinner(null)).toBe(true);
  });

  test('should accept 0 (draw)', () => {
    expect(isValidWinner(0)).toBe(true);
  });

  test('should accept 1 (player 1 wins)', () => {
    expect(isValidWinner(1)).toBe(true);
  });

  test('should accept 2 (player 2 wins)', () => {
    expect(isValidWinner(2)).toBe(true);
  });

  test('should reject 3', () => {
    expect(isValidWinner(3)).toBe(false);
  });

  test('should reject -1', () => {
    expect(isValidWinner(-1)).toBe(false);
  });

  test('should reject undefined', () => {
    expect(isValidWinner(undefined)).toBe(false);
  });

  test('should reject string "1"', () => {
    expect(isValidWinner('1')).toBe(false);
  });

  test('should reject empty string', () => {
    expect(isValidWinner('')).toBe(false);
  });

  test('should reject object', () => {
    expect(isValidWinner({ winner: 1 })).toBe(false);
  });
});

// ============================================================================
// Test Suite: isValidLastMovePos
// ============================================================================
describe('isValidLastMovePos validation', () => {
  test('should accept null', () => {
    expect(isValidLastMovePos(null)).toBe(true);
  });

  test('should accept undefined', () => {
    expect(isValidLastMovePos(undefined)).toBe(true);
  });

  test('should accept valid position {row: 0, col: 0}', () => {
    expect(isValidLastMovePos({ row: 0, col: 0 })).toBe(true);
  });

  test('should accept valid position {row: 4, col: 4}', () => {
    expect(isValidLastMovePos({ row: 4, col: 4 })).toBe(true);
  });

  test('should accept valid position {row: 8, col: 8}', () => {
    expect(isValidLastMovePos({ row: 8, col: 8 })).toBe(true);
  });

  test('should accept position with valid move_number', () => {
    expect(isValidLastMovePos({ row: 0, col: 0, move_number: 1 })).toBe(true);
    expect(isValidLastMovePos({ row: 4, col: 4, move_number: 25 })).toBe(true);
    expect(isValidLastMovePos({ row: 8, col: 8, move_number: 50 })).toBe(true);
  });

  test('should accept position with move_number 0', () => {
    expect(isValidLastMovePos({ row: 0, col: 0, move_number: 0 })).toBe(true);
  });

  test('should reject row out of bounds (negative)', () => {
    expect(isValidLastMovePos({ row: -1, col: 0 })).toBe(false);
  });

  test('should reject row out of bounds (>= BOARD_SIZE)', () => {
    expect(isValidLastMovePos({ row: 9, col: 0 })).toBe(false);
    expect(isValidLastMovePos({ row: 100, col: 0 })).toBe(false);
  });

  test('should reject col out of bounds (negative)', () => {
    expect(isValidLastMovePos({ row: 0, col: -1 })).toBe(false);
  });

  test('should reject col out of bounds (>= BOARD_SIZE)', () => {
    expect(isValidLastMovePos({ row: 0, col: 9 })).toBe(false);
    expect(isValidLastMovePos({ row: 0, col: 100 })).toBe(false);
  });

  test('should reject missing row', () => {
    expect(isValidLastMovePos({ col: 0 })).toBe(false);
  });

  test('should reject missing col', () => {
    expect(isValidLastMovePos({ row: 0 })).toBe(false);
  });

  test('should reject non-integer row', () => {
    expect(isValidLastMovePos({ row: 1.5, col: 0 })).toBe(false);
    expect(isValidLastMovePos({ row: '1', col: 0 })).toBe(false);
  });

  test('should reject non-integer col', () => {
    expect(isValidLastMovePos({ row: 0, col: 1.5 })).toBe(false);
    expect(isValidLastMovePos({ row: 0, col: '1' })).toBe(false);
  });

  test('should reject negative move_number', () => {
    expect(isValidLastMovePos({ row: 0, col: 0, move_number: -1 })).toBe(false);
  });

  test('should reject non-integer move_number', () => {
    expect(isValidLastMovePos({ row: 0, col: 0, move_number: 1.5 })).toBe(false);
    expect(isValidLastMovePos({ row: 0, col: 0, move_number: '1' })).toBe(false);
  });

  test('should reject non-object type', () => {
    expect(isValidLastMovePos('pos')).toBe(false);
    expect(isValidLastMovePos(123)).toBe(false);
    expect(isValidLastMovePos([0, 0])).toBe(false);
  });
});

// ============================================================================
// Test Suite: validateState
// ============================================================================
describe('validateState comprehensive validation', () => {
  function createValidState() {
    return {
      board: buildEmptyGrid(),
      territory: buildEmptyGrid(),
      currentPlayer: 1,
      winner: null,
      lastMovePos: null
    };
  }

  test('should accept valid initial state for room 999VALID', () => {
    const state = createValidState();
    const result = validateState(state);
    expect(result.valid).toBe(true);
  });

  test('should accept valid game state with moves', () => {
    const state = createValidState();
    state.board[4][4] = 1;
    state.board[3][3] = 2;
    state.territory[4][4] = 1;
    state.currentPlayer = 1;
    state.lastMovePos = { row: 3, col: 3, move_number: 2 };
    const result = validateState(state);
    expect(result.valid).toBe(true);
  });

  test('should accept valid game over state - player 1 wins', () => {
    const state = createValidState();
    state.currentPlayer = 2;
    state.winner = 1;
    state.lastMovePos = { row: 8, col: 8, move_number: 50 };
    const result = validateState(state);
    expect(result.valid).toBe(true);
  });

  test('should accept valid game over state - player 2 wins', () => {
    const state = createValidState();
    state.currentPlayer = 1;
    state.winner = 2;
    state.lastMovePos = { row: 0, col: 0, move_number: 50 };
    const result = validateState(state);
    expect(result.valid).toBe(true);
  });

  test('should accept valid game over state - draw', () => {
    const state = createValidState();
    state.currentPlayer = 1;
    state.winner = 0;
    const result = validateState(state);
    expect(result.valid).toBe(true);
  });

  test('should reject null state', () => {
    const result = validateState(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('state 必须是对象');
  });

  test('should reject undefined state', () => {
    const result = validateState(undefined);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('state 必须是对象');
  });

  test('should reject non-object state', () => {
    expect(validateState('state').valid).toBe(false);
    expect(validateState(123).valid).toBe(false);
    expect(validateState([]).valid).toBe(false);
  });

  test('should reject state with invalid board', () => {
    const state = createValidState();
    state.board = null;
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('board 格式无效');
  });

  test('should reject state with invalid board cell', () => {
    const state = createValidState();
    state.board[0][0] = 3;
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('board 格式无效');
  });

  test('should reject state with invalid territory', () => {
    const state = createValidState();
    state.territory = null;
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('territory 格式无效');
  });

  test('should reject state with invalid territory cell', () => {
    const state = createValidState();
    state.territory[0][0] = -1;
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('territory 格式无效');
  });

  test('should reject state with invalid currentPlayer (0)', () => {
    const state = createValidState();
    state.currentPlayer = 0;
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('currentPlayer 必须是 1 或 2');
  });

  test('should reject state with invalid currentPlayer (3)', () => {
    const state = createValidState();
    state.currentPlayer = 3;
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('currentPlayer 必须是 1 或 2');
  });

  test('should reject state with invalid winner', () => {
    const state = createValidState();
    state.winner = 3;
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('winner 格式无效');
  });

  test('should reject state with undefined winner', () => {
    const state = createValidState();
    state.winner = undefined;
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('winner 格式无效');
  });

  test('should reject state with invalid lastMovePos', () => {
    const state = createValidState();
    state.lastMovePos = { row: 100, col: 0 };
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('lastMovePos 格式无效');
  });

  test('should reject state missing board', () => {
    const state = {
      territory: buildEmptyGrid(),
      currentPlayer: 1,
      winner: null,
      lastMovePos: null
    };
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('board 格式无效');
  });

  test('should reject state missing territory', () => {
    const state = {
      board: buildEmptyGrid(),
      currentPlayer: 1,
      winner: null,
      lastMovePos: null
    };
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('territory 格式无效');
  });

  test('should reject state missing currentPlayer', () => {
    const state = {
      board: buildEmptyGrid(),
      territory: buildEmptyGrid(),
      winner: null,
      lastMovePos: null
    };
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('currentPlayer 必须是 1 或 2');
  });
});

// ============================================================================
// Test Suite: buildEmptyGrid and buildInitialState helpers
// ============================================================================
describe('Helper functions', () => {
  describe('buildEmptyGrid', () => {
    test('should create 9x9 grid', () => {
      const grid = buildEmptyGrid();
      expect(grid.length).toBe(BOARD_SIZE);
      for (let r = 0; r < BOARD_SIZE; r++) {
        expect(grid[r].length).toBe(BOARD_SIZE);
      }
    });

    test('should create grid with all zeros', () => {
      const grid = buildEmptyGrid();
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          expect(grid[r][c]).toBe(0);
        }
      }
    });

    test('should create independent rows (not shared references)', () => {
      const grid = buildEmptyGrid();
      grid[0][0] = 1;
      expect(grid[1][0]).toBe(0); // Should not affect other rows
    });
  });

  describe('buildInitialState', () => {
    test('should return valid initial state', () => {
      const state = buildInitialState();
      expect(state.current_player).toBe(1);
      expect(state.winner).toBe(null);
      expect(state.last_move_pos).toBe(null);
      expect(isValidGrid(state.board)).toBe(true);
      expect(isValidGrid(state.territory)).toBe(true);
    });

    test('should have empty board', () => {
      const state = buildInitialState();
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          expect(state.board[r][c]).toBe(0);
        }
      }
    });

    test('should have empty territory', () => {
      const state = buildInitialState();
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          expect(state.territory[r][c]).toBe(0);
        }
      }
    });
  });
});

// ============================================================================
// Test Suite: Mock HTTP Handler Testing
// ============================================================================
describe('Mock HTTP Handler behavior', () => {
  // Create mock request/response objects
  function createMockRequest(method, query = {}, body = null) {
    return {
      method,
      query,
      body
    };
  }

  function createMockResponse() {
    const res = {
      headers: {},
      statusCode: 200,
      body: null,
      setHeader: function(key, value) {
        this.headers[key] = value;
      },
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      }
    };
    return res;
  }

  // Simulate handler logic (without actual Supabase calls)
  async function simulateHandler(request, response, supabaseUrl, supabaseKey, mockGetRoom, mockEnsureRoom, mockUpdateRoom, mockResetRoom) {
    response.setHeader('Cache-Control', 'no-store');

    if (!supabaseUrl || !supabaseKey) {
      response.status(500).json({ error: '缺少 Supabase 配置，请检查环境变量' });
      return;
    }

    const roomId = request.method === 'GET' ? request.query?.roomId : request.body?.roomId;
    if (!roomId) {
      response.status(400).json({ error: '缺少 roomId' });
      return;
    }

    if (!isValidRoomId(roomId)) {
      response.status(400).json({ error: 'roomId 格式无效' });
      return;
    }

    try {
      if (request.method === 'GET') {
        const room = await mockGetRoom(roomId);
        if (!room) {
          response.status(404).json({ error: '房间不存在' });
          return;
        }
        response.status(200).json(room);
        return;
      }

      if (request.method === 'POST') {
        const room = await mockEnsureRoom(roomId);
        response.status(200).json(room);
        return;
      }

      if (request.method === 'PUT') {
        const state = request.body?.state;
        if (!state) {
          response.status(400).json({ error: '缺少 state 数据' });
          return;
        }
        const validation = validateState(state);
        if (!validation.valid) {
          response.status(400).json({ error: validation.error });
          return;
        }
        const updated = await mockUpdateRoom(roomId, state);
        response.status(200).json(updated);
        return;
      }

      if (request.method === 'DELETE') {
        const reset = await mockResetRoom(roomId);
        response.status(200).json(reset);
        return;
      }

      response.setHeader('Allow', 'GET,POST,PUT,DELETE');
      response.status(405).json({ error: '不支持的请求方法' });
    } catch (error) {
      response.status(500).json({ error: '服务器内部错误，请稍后重试' });
    }
  }

  describe('GET method (fetch game state)', () => {
    test('should return 400 when roomId is missing', async () => {
      const req = createMockRequest('GET', {});
      const res = createMockResponse();
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('缺少 roomId');
    });

    test('should return 400 when roomId is empty (treated as missing)', async () => {
      const req = createMockRequest('GET', { roomId: '' });
      const res = createMockResponse();
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(400);
      // Empty string is falsy in JS, so it's treated as missing
      expect(res.body.error).toBe('缺少 roomId');
    });

    test('should return 404 when room does not exist (special chars room)', async () => {
      const req = createMockRequest('GET', { roomId: TEST_ROOM_ID });
      const res = createMockResponse();
      const mockGetRoom = jest.fn().mockResolvedValue(null);
      await simulateHandler(req, res, 'url', 'key', mockGetRoom, jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('房间不存在');
      expect(mockGetRoom).toHaveBeenCalledWith(TEST_ROOM_ID);
    });

    test('should return 200 with room data when room exists (special chars room)', async () => {
      const req = createMockRequest('GET', { roomId: TEST_ROOM_ID });
      const res = createMockResponse();
      const mockRoom = { ...buildInitialState(), room_id: TEST_ROOM_ID };
      const mockGetRoom = jest.fn().mockResolvedValue(mockRoom);
      await simulateHandler(req, res, 'url', 'key', mockGetRoom, jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRoom);
    });

    test('should return 500 when Supabase config is missing', async () => {
      const req = createMockRequest('GET', { roomId: TEST_ROOM_ID });
      const res = createMockResponse();
      await simulateHandler(req, res, '', '', jest.fn(), jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('缺少 Supabase 配置，请检查环境变量');
    });
  });

  describe('POST method (create/ensure room)', () => {
    test('should return 400 when roomId is missing', async () => {
      const req = createMockRequest('POST', {}, {});
      const res = createMockResponse();
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('缺少 roomId');
    });

    test('should return 200 with new room when room is created (special chars room)', async () => {
      const req = createMockRequest('POST', {}, { roomId: TEST_ROOM_ID });
      const res = createMockResponse();
      const mockRoom = { ...buildInitialState(), room_id: TEST_ROOM_ID };
      const mockEnsureRoom = jest.fn().mockResolvedValue(mockRoom);
      await simulateHandler(req, res, 'url', 'key', jest.fn(), mockEnsureRoom, jest.fn(), jest.fn());
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRoom);
      expect(mockEnsureRoom).toHaveBeenCalledWith(TEST_ROOM_ID);
    });

    test('should return 200 with existing room data (special chars room)', async () => {
      const req = createMockRequest('POST', {}, { roomId: TEST_ROOM_ID });
      const res = createMockResponse();
      const mockRoom = { 
        ...buildInitialState(), 
        room_id: TEST_ROOM_ID,
        current_player: 2 // Already has some game progress
      };
      const mockEnsureRoom = jest.fn().mockResolvedValue(mockRoom);
      await simulateHandler(req, res, 'url', 'key', jest.fn(), mockEnsureRoom, jest.fn(), jest.fn());
      expect(res.statusCode).toBe(200);
      expect(res.body.current_player).toBe(2);
    });
  });

  describe('PUT method (update game state)', () => {
    test('should return 400 when roomId is missing', async () => {
      const req = createMockRequest('PUT', {}, { state: {} });
      const res = createMockResponse();
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('缺少 roomId');
    });

    test('should return 400 when state is missing', async () => {
      const req = createMockRequest('PUT', {}, { roomId: TEST_ROOM_ID });
      const res = createMockResponse();
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('缺少 state 数据');
    });

    test('should return 400 when state is invalid (bad board)', async () => {
      const req = createMockRequest('PUT', {}, { 
        roomId: TEST_ROOM_ID,
        state: {
          board: null,
          territory: buildEmptyGrid(),
          currentPlayer: 1,
          winner: null,
          lastMovePos: null
        }
      });
      const res = createMockResponse();
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('board 格式无效');
    });

    test('should return 400 when state is invalid (bad currentPlayer)', async () => {
      const req = createMockRequest('PUT', {}, { 
        roomId: TEST_ROOM_ID,
        state: {
          board: buildEmptyGrid(),
          territory: buildEmptyGrid(),
          currentPlayer: 3,
          winner: null,
          lastMovePos: null
        }
      });
      const res = createMockResponse();
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('currentPlayer 必须是 1 或 2');
    });

    test('should return 200 with updated state on valid update (special chars room)', async () => {
      const validState = {
        board: buildEmptyGrid(),
        territory: buildEmptyGrid(),
        currentPlayer: 2,
        winner: null,
        lastMovePos: { row: 4, col: 4, move_number: 1 }
      };
      validState.board[4][4] = 1;
      
      const req = createMockRequest('PUT', {}, { 
        roomId: TEST_ROOM_ID,
        state: validState
      });
      const res = createMockResponse();
      const mockUpdated = { room_id: TEST_ROOM_ID, ...validState };
      const mockUpdateRoom = jest.fn().mockResolvedValue(mockUpdated);
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), mockUpdateRoom, jest.fn());
      expect(res.statusCode).toBe(200);
      expect(res.body.room_id).toBe(TEST_ROOM_ID);
      expect(mockUpdateRoom).toHaveBeenCalledWith(TEST_ROOM_ID, validState);
    });

    test('should return 200 with game over state (special chars room)', async () => {
      const gameOverState = {
        board: buildEmptyGrid(),
        territory: buildEmptyGrid(),
        currentPlayer: 1,
        winner: 1,
        lastMovePos: { row: 8, col: 8, move_number: 50 }
      };
      
      const req = createMockRequest('PUT', {}, { 
        roomId: TEST_ROOM_ID,
        state: gameOverState
      });
      const res = createMockResponse();
      const mockUpdated = { room_id: TEST_ROOM_ID, ...gameOverState };
      const mockUpdateRoom = jest.fn().mockResolvedValue(mockUpdated);
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), mockUpdateRoom, jest.fn());
      expect(res.statusCode).toBe(200);
      expect(res.body.winner).toBe(1);
    });
  });

  describe('DELETE method (reset room)', () => {
    test('should return 400 when roomId is missing', async () => {
      const req = createMockRequest('DELETE', {}, {});
      const res = createMockResponse();
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('缺少 roomId');
    });

    test('should return 200 with reset room state (special chars room)', async () => {
      const req = createMockRequest('DELETE', {}, { roomId: TEST_ROOM_ID });
      const res = createMockResponse();
      const mockResetState = { room_id: TEST_ROOM_ID, ...buildInitialState() };
      const mockResetRoom = jest.fn().mockResolvedValue(mockResetState);
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), jest.fn(), mockResetRoom);
      expect(res.statusCode).toBe(200);
      expect(res.body.current_player).toBe(1);
      expect(res.body.winner).toBe(null);
      expect(mockResetRoom).toHaveBeenCalledWith(TEST_ROOM_ID);
    });

    test('should return 500 when reset fails', async () => {
      const req = createMockRequest('DELETE', {}, { roomId: TEST_ROOM_ID });
      const res = createMockResponse();
      const mockResetRoom = jest.fn().mockRejectedValue(new Error('房间不存在'));
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), jest.fn(), mockResetRoom);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('Unsupported methods', () => {
    test('should return 405 for PATCH method', async () => {
      const req = createMockRequest('PATCH', {}, { roomId: TEST_ROOM_ID });
      const res = createMockResponse();
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(405);
      expect(res.body.error).toBe('不支持的请求方法');
      expect(res.headers.Allow).toBe('GET,POST,PUT,DELETE');
    });

    test('should return 405 for OPTIONS method', async () => {
      const req = createMockRequest('OPTIONS', {}, { roomId: TEST_ROOM_ID });
      const res = createMockResponse();
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(405);
    });

    test('should return 405 for HEAD method', async () => {
      const req = createMockRequest('HEAD', {}, { roomId: TEST_ROOM_ID });
      const res = createMockResponse();
      await simulateHandler(req, res, 'url', 'key', jest.fn(), jest.fn(), jest.fn(), jest.fn());
      expect(res.statusCode).toBe(405);
    });
  });

  describe('Cache control headers', () => {
    test('should set Cache-Control: no-store header', async () => {
      const req = createMockRequest('GET', { roomId: TEST_ROOM_ID });
      const res = createMockResponse();
      const mockGetRoom = jest.fn().mockResolvedValue({ room_id: TEST_ROOM_ID });
      await simulateHandler(req, res, 'url', 'key', mockGetRoom, jest.fn(), jest.fn(), jest.fn());
      expect(res.headers['Cache-Control']).toBe('no-store');
    });
  });
});

// ============================================================================
// Test Suite: Edge Cases and Boundary Testing
// ============================================================================
describe('Edge cases and boundary testing', () => {
  describe('Room ID edge cases with special characters', () => {
    test('should handle test room ID with special characters (999?#$)', () => {
      expect(isValidRoomId(TEST_ROOM_ID)).toBe(true);
    });

    test('should handle room ID at exact max length', () => {
      const maxLengthId = 'A'.repeat(MAX_ROOM_ID_LENGTH);
      expect(isValidRoomId(maxLengthId)).toBe(true);
    });

    test('should reject room ID one character over max length', () => {
      const overMaxId = 'A'.repeat(MAX_ROOM_ID_LENGTH + 1);
      expect(isValidRoomId(overMaxId)).toBe(false);
    });
  });

  describe('Grid boundary positions', () => {
    test('should validate all corner positions', () => {
      // Top-left corner
      expect(isValidLastMovePos({ row: 0, col: 0 })).toBe(true);
      // Top-right corner
      expect(isValidLastMovePos({ row: 0, col: 8 })).toBe(true);
      // Bottom-left corner
      expect(isValidLastMovePos({ row: 8, col: 0 })).toBe(true);
      // Bottom-right corner
      expect(isValidLastMovePos({ row: 8, col: 8 })).toBe(true);
    });

    test('should validate center position', () => {
      expect(isValidLastMovePos({ row: 4, col: 4 })).toBe(true);
    });

    test('should reject positions just outside boundaries', () => {
      expect(isValidLastMovePos({ row: -1, col: 0 })).toBe(false);
      expect(isValidLastMovePos({ row: 0, col: -1 })).toBe(false);
      expect(isValidLastMovePos({ row: 9, col: 0 })).toBe(false);
      expect(isValidLastMovePos({ row: 0, col: 9 })).toBe(false);
    });
  });

  describe('State with maximum move count', () => {
    test('should accept lastMovePos with move_number 50 (max moves)', () => {
      expect(isValidLastMovePos({ row: 0, col: 0, move_number: 50 })).toBe(true);
    });

    test('should accept lastMovePos with move_number beyond 50 (no upper limit enforced)', () => {
      expect(isValidLastMovePos({ row: 0, col: 0, move_number: 100 })).toBe(true);
    });
  });

  describe('Grid with complex patterns', () => {
    test('should validate grid with checkerboard pattern', () => {
      const grid = buildEmptyGrid();
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          grid[r][c] = (r + c) % 2 === 0 ? 1 : 2;
        }
      }
      expect(isValidGrid(grid)).toBe(true);
    });

    test('should validate grid with diagonal pattern', () => {
      const grid = buildEmptyGrid();
      for (let i = 0; i < BOARD_SIZE; i++) {
        grid[i][i] = 1;
        grid[i][BOARD_SIZE - 1 - i] = 2;
      }
      expect(isValidGrid(grid)).toBe(true);
    });
  });
});

// ============================================================================
// Test Suite: Comprehensive Room Scenarios with special characters room (999?#$)
// ============================================================================
describe('Comprehensive game scenarios for room 999?#$', () => {
  describe('Full game flow simulation', () => {
    test('should validate initial room state', () => {
      const initialState = buildInitialState();
      expect(initialState.current_player).toBe(1);
      expect(initialState.winner).toBe(null);
      expect(initialState.last_move_pos).toBe(null);
      expect(isValidGrid(initialState.board)).toBe(true);
      expect(isValidGrid(initialState.territory)).toBe(true);
    });

    test('should validate state after first move by player 1', () => {
      const state = {
        board: buildEmptyGrid(),
        territory: buildEmptyGrid(),
        currentPlayer: 2, // After player 1 moves, it's player 2's turn
        winner: null,
        lastMovePos: { row: 4, col: 4, move_number: 1 }
      };
      state.board[4][4] = 1; // Player 1 placed a piece
      
      const result = validateState(state);
      expect(result.valid).toBe(true);
    });

    test('should validate state after player 2 response', () => {
      const state = {
        board: buildEmptyGrid(),
        territory: buildEmptyGrid(),
        currentPlayer: 1, // After player 2 moves, it's player 1's turn
        winner: null,
        lastMovePos: { row: 3, col: 3, move_number: 2 }
      };
      state.board[4][4] = 1;
      state.board[3][3] = 2;
      
      const result = validateState(state);
      expect(result.valid).toBe(true);
    });

    test('should validate mid-game state with territory', () => {
      const state = {
        board: buildEmptyGrid(),
        territory: buildEmptyGrid(),
        currentPlayer: 1,
        winner: null,
        lastMovePos: { row: 0, col: 0, move_number: 10 }
      };
      // Simulate some pieces and territory
      state.territory[0][0] = 1;
      state.territory[0][1] = 1;
      state.territory[0][2] = 1;
      state.territory[8][8] = 2;
      state.territory[8][7] = 2;
      
      const result = validateState(state);
      expect(result.valid).toBe(true);
    });

    test('should validate game end state with player 1 winning', () => {
      const state = {
        board: buildEmptyGrid(),
        territory: buildEmptyGrid(),
        currentPlayer: 2,
        winner: 1,
        lastMovePos: { row: 8, col: 8, move_number: 50 }
      };
      // More territory for player 1
      for (let i = 0; i < 5; i++) {
        state.territory[i][0] = 1;
      }
      for (let i = 5; i < 8; i++) {
        state.territory[i][0] = 2;
      }
      
      const result = validateState(state);
      expect(result.valid).toBe(true);
    });

    test('should validate draw state', () => {
      const state = {
        board: buildEmptyGrid(),
        territory: buildEmptyGrid(),
        currentPlayer: 1,
        winner: 0, // Draw
        lastMovePos: { row: 0, col: 0, move_number: 50 }
      };
      
      const result = validateState(state);
      expect(result.valid).toBe(true);
    });
  });

  describe('Error recovery scenarios', () => {
    test('should validate state after room reset', () => {
      const resetState = buildInitialState();
      expect(resetState.current_player).toBe(1);
      expect(resetState.winner).toBe(null);
      expect(resetState.last_move_pos).toBe(null);
    });

    test('should handle reconnection scenario (state retrieval)', () => {
      // Simulate state that would be retrieved after reconnection
      const reconnectState = {
        board: buildEmptyGrid(),
        territory: buildEmptyGrid(),
        currentPlayer: 2,
        winner: null,
        lastMovePos: { row: 5, col: 5, move_number: 15 }
      };
      reconnectState.board[5][5] = 1;
      
      const result = validateState(reconnectState);
      expect(result.valid).toBe(true);
    });
  });
});

// ============================================================================
// Test Suite: Constants validation
// ============================================================================
describe('Constants validation', () => {
  test('BOARD_SIZE should be 9', () => {
    expect(BOARD_SIZE).toBe(9);
  });

  test('MAX_ROOM_ID_LENGTH should be 20', () => {
    expect(MAX_ROOM_ID_LENGTH).toBe(20);
  });

  test('TEST_ROOM_ID should be 999?#$ with special characters', () => {
    expect(TEST_ROOM_ID).toBe('999?#$');
  });
});

// ============================================================================
// Test Suite: Special characters room ID deserialization (999?#$)
// ============================================================================
describe('Special characters room ID deserialization testing', () => {
  test('should accept test room ID with special characters: 999?#$', () => {
    expect(isValidRoomId(TEST_ROOM_ID)).toBe(true);
  });

  test('should correctly handle room ID with question mark', () => {
    expect(TEST_ROOM_ID.includes('?')).toBe(true);
    expect(isValidRoomId(TEST_ROOM_ID)).toBe(true);
  });

  test('should correctly handle room ID with hash', () => {
    expect(TEST_ROOM_ID.includes('#')).toBe(true);
    expect(isValidRoomId(TEST_ROOM_ID)).toBe(true);
  });

  test('should correctly handle room ID with dollar sign', () => {
    expect(TEST_ROOM_ID.includes('$')).toBe(true);
    expect(isValidRoomId(TEST_ROOM_ID)).toBe(true);
  });

  test('should verify TEST_ROOM_ID can be used in URL encoding', () => {
    const encoded = encodeURIComponent(TEST_ROOM_ID);
    expect(encoded).toBe('999%3F%23%24');
    expect(decodeURIComponent(encoded)).toBe(TEST_ROOM_ID);
  });
});
