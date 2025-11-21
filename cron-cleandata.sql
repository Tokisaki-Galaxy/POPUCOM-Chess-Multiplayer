-- 1. 启用定时任务扩展
create extension if not exists pg_cron;

-- 2. 创建定时任务
-- 注意：服务器时间通常是 UTC 时间。
-- 北京时间凌晨 4:00 等于 UTC 时间的前一天 20:00。
-- Cron 表达式格式: '分 时 日 月 周'
select cron.schedule(
  'clean-games-daily', -- 任务名称
  '0 20 * * *',        -- 每天 UTC 20:00 执行 (即北京时间 04:00)
  'truncate table games;' -- 执行的命令：清空 games 表
);

-- (可选) 查看已创建的任务
-- select * from cron.job;
