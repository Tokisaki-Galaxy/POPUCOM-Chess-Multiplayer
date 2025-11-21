-- 1. 启用定时任务扩展
create extension if not exists pg_cron;

-- 2. 创建定时任务（每天 UTC 20:00）
select cron.schedule(
  'clean-games-daily',
  '0 20 * * *',
  'delete from games where updated_at < now() - interval ''48 hours'';'
);

-- 为筛选效率添加索引
create index if not exists idx_games_updated_at on games(updated_at);

-- (可选) 查看已创建的任务
-- select * from cron.job;
