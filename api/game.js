const BOARD_SIZE = 9;
const MAX_ROOM_ID_LENGTH = 20;
const ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const tableEndpoint = supabaseUrl ? `${supabaseUrl}/rest/v1/games` : '';

const defaultError = '服务器内部错误，请稍后重试';

// Validation functions
function validateRoomId(roomId) {
  if (typeof roomId !== 'string') {
    return { valid: false, error: 'roomId 必须是字符串' };
  }
  if (roomId.length === 0 || roomId.length > MAX_ROOM_ID_LENGTH) {
    return { valid: false, error: `roomId 长度必须在 1-${MAX_ROOM_ID_LENGTH} 之间` };
  }
  if (!ROOM_ID_PATTERN.test(roomId)) {
    return { valid: false, error: 'roomId 只能包含字母、数字、下划线和连字符' };
  }
  return { valid: true };
}

function validateGrid(grid, fieldName) {
  if (!Array.isArray(grid) || grid.length !== BOARD_SIZE) {
    return { valid: false, error: `${fieldName} 必须是 ${BOARD_SIZE}x${BOARD_SIZE} 的数组` };
  }
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (!Array.isArray(grid[r]) || grid[r].length !== BOARD_SIZE) {
      return { valid: false, error: `${fieldName}[${r}] 必须是长度为 ${BOARD_SIZE} 的数组` };
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      const val = grid[r][c];
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 0 || val > 2) {
        return { valid: false, error: `${fieldName}[${r}][${c}] 必须是 0、1 或 2` };
      }
    }
  }
  return { valid: true };
}

function validateCurrentPlayer(currentPlayer) {
  if (typeof currentPlayer !== 'number' || (currentPlayer !== 1 && currentPlayer !== 2)) {
    return { valid: false, error: 'currentPlayer 必须是 1 或 2' };
  }
  return { valid: true };
}

function validateWinner(winner) {
  if (winner !== null && winner !== undefined) {
    if (typeof winner !== 'number' || (winner !== 0 && winner !== 1 && winner !== 2)) {
      return { valid: false, error: 'winner 必须是 null、0、1 或 2' };
    }
  }
  return { valid: true };
}

function validateLastMovePos(lastMovePos) {
  if (lastMovePos === null || lastMovePos === undefined) {
    return { valid: true };
  }
  if (typeof lastMovePos !== 'object') {
    return { valid: false, error: 'lastMovePos 必须是对象或 null' };
  }
  const { row, col, move_number } = lastMovePos;
  if (typeof row !== 'number' || !Number.isInteger(row) || row < 0 || row >= BOARD_SIZE) {
    return { valid: false, error: `lastMovePos.row 必须是 0-${BOARD_SIZE - 1} 之间的整数` };
  }
  if (typeof col !== 'number' || !Number.isInteger(col) || col < 0 || col >= BOARD_SIZE) {
    return { valid: false, error: `lastMovePos.col 必须是 0-${BOARD_SIZE - 1} 之间的整数` };
  }
  if (move_number !== undefined) {
    if (typeof move_number !== 'number' || !Number.isInteger(move_number) || move_number < 0 || move_number > 50) {
      return { valid: false, error: 'lastMovePos.move_number 必须是 0-50 之间的整数' };
    }
  }
  return { valid: true };
}

function validateState(state) {
  if (!state || typeof state !== 'object') {
    return { valid: false, error: 'state 必须是对象' };
  }

  const boardValidation = validateGrid(state.board, 'board');
  if (!boardValidation.valid) return boardValidation;

  const territoryValidation = validateGrid(state.territory, 'territory');
  if (!territoryValidation.valid) return territoryValidation;

  const currentPlayerValidation = validateCurrentPlayer(state.currentPlayer);
  if (!currentPlayerValidation.valid) return currentPlayerValidation;

  const winnerValidation = validateWinner(state.winner);
  if (!winnerValidation.valid) return winnerValidation;

  const lastMovePosValidation = validateLastMovePos(state.lastMovePos);
  if (!lastMovePosValidation.valid) return lastMovePosValidation;

  return { valid: true };
}

export default async function handler(request, response) {
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

  // Validate roomId format
  const roomIdValidation = validateRoomId(roomId);
  if (!roomIdValidation.valid) {
    response.status(400).json({ error: roomIdValidation.error });
    return;
  }

  try {
    if (request.method === 'GET') {
      const room = await getRoom(roomId);
      if (!room) {
        response.status(404).json({ error: '房间不存在' });
        return;
      }
      response.status(200).json(room);
      return;
    }

    if (request.method === 'POST') {
      const room = await ensureRoom(roomId);
      response.status(200).json(room);
      return;
    }

    if (request.method === 'PUT') {
      const state = request.body?.state;
      if (!state) {
        response.status(400).json({ error: '缺少 state 数据' });
        return;
      }
      // Validate state data
      const stateValidation = validateState(state);
      if (!stateValidation.valid) {
        response.status(400).json({ error: stateValidation.error });
        return;
      }
      const updated = await updateRoom(roomId, state);
      response.status(200).json(updated);
      return;
    }

    if (request.method === 'DELETE') {
      const reset = await resetRoom(roomId);
      response.status(200).json(reset);
      return;
    }

    response.setHeader('Allow', 'GET,POST,PUT,DELETE');
    response.status(405).json({ error: '不支持的请求方法' });
  } catch (error) {
    console.error('Game API error:', error);
    response.status(500).json({ error: defaultError });
  }
}

function buildHeaders(extra = {}) {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function getRoom(roomId) {
  const url = `${tableEndpoint}?room_id=eq.${encodeURIComponent(roomId)}&select=*`;
  const result = await fetch(url, { headers: buildHeaders() });
  if (!result.ok) {
    throw new Error('查询房间失败');
  }
  const data = await result.json();
  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }
  if (!Array.isArray(data)) {
    return data;
  }
  return null;
}

async function ensureRoom(roomId) {
  const existing = await getRoom(roomId);
  if (existing) {
    return existing;
  }
  const payload = [{ room_id: roomId, ...buildInitialState() }];
  const result = await fetch(tableEndpoint, {
    method: 'POST',
    headers: buildHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(payload)
  });
  if (!result.ok) {
    throw new Error('创建房间失败');
  }
  const data = await result.json();
  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }
  return getRoom(roomId);
}

async function updateRoom(roomId, state) {
  const payload = {
    board: state.board,
    territory: state.territory,
    current_player: state.currentPlayer,
    winner: state.winner ?? null,
    last_move_pos: state.lastMovePos ?? null,
    updated_at: new Date().toISOString()
  };

  const result = await fetch(`${tableEndpoint}?room_id=eq.${encodeURIComponent(roomId)}`, {
    method: 'PATCH',
    headers: buildHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    throw new Error('更新房间失败');
  }

  const data = await result.json();
  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }
  return data;
}

async function resetRoom(roomId) {
  const existing = await getRoom(roomId);
  if (!existing) {
    throw new Error('房间不存在');
  }
  
  const payload = {
    ...buildInitialState(),
    updated_at: new Date().toISOString()
  };

  const result = await fetch(`${tableEndpoint}?room_id=eq.${encodeURIComponent(roomId)}`, {
    method: 'PATCH',
    headers: buildHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    throw new Error('重置房间失败');
  }

  const data = await result.json();
  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }
  return data;
}

function buildInitialState() {
  const board = buildEmptyGrid();
  return {
    board,
    territory: buildEmptyGrid(),
    current_player: 1,
    winner: null,
    last_move_pos: null
  };
}

function buildEmptyGrid() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}
