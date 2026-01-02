create table games (
  room_id text primary key,
  board jsonb,
  territory jsonb,
  current_player int,
  winner int,
  last_move_pos jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 开启 Row Level Security (RLS)
-- 由于所有数据库操作都通过服务端 API (api/game.js) 进行，
-- 使用 service_role key 会自动绕过 RLS，无需单独的客户端鉴权
-- 启用 RLS 可防止 anon key 泄露时的数据风险
alter table games enable row level security;

-- 开启 Realtime 功能（必须！）
alter publication supabase_realtime add table games;
