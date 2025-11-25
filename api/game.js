const BOARD_SIZE = 9;
const MAX_ROOM_ID_LENGTH = 20;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const tableEndpoint = supabaseUrl ? `${supabaseUrl}/rest/v1/games` : '';

const defaultError = '服务器内部错误，请稍后重试';

function isValidRoomId(roomId) {
  if (typeof roomId !== 'string') return false;
  if (roomId.length === 0 || roomId.length > MAX_ROOM_ID_LENGTH) return false;
  // Only allow alphanumeric characters, dashes, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(roomId);
}

function isValidBoard(board) {
  if (!Array.isArray(board) || board.length !== BOARD_SIZE) return false;
  for (const row of board) {
    if (!Array.isArray(row) || row.length !== BOARD_SIZE) return false;
    for (const cell of row) {
      if (!Number.isInteger(cell) || cell < 0 || cell > 2) return false;
    }
  }
  return true;
}

function isValidTerritory(territory) {
  if (!Array.isArray(territory) || territory.length !== BOARD_SIZE) return false;
  for (const row of territory) {
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
  // move_number is optional but must be a non-negative integer if present
  if (pos.move_number !== undefined) {
    if (!Number.isInteger(pos.move_number) || pos.move_number < 0) return false;
  }
  return true;
}

function validateState(state) {
  if (!state || typeof state !== 'object') {
    return { valid: false, error: 'state 必须是对象' };
  }
  if (!isValidBoard(state.board)) {
    return { valid: false, error: 'board 格式无效' };
  }
  if (!isValidTerritory(state.territory)) {
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

  if (!isValidRoomId(roomId)) {
    response.status(400).json({ error: 'roomId 格式无效' });
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
      const validation = validateState(state);
      if (!validation.valid) {
        response.status(400).json({ error: validation.error });
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
