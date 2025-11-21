create table games (
  room_id text primary key,
  board jsonb,
  territory jsonb,
  current_player int,
  winner int,
  last_move_pos jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
-- 开启 Realtime 功能（必须！）
alter publication supabase_realtime add table games;