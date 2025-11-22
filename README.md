# POPUCOM 三消棋 (本地 & 在线)

![Serverless](https://img.shields.io/badge/Serverless-Live-FF4F00?logo=serverless&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-DB-3FCF8E?logo=supabase&logoColor=white)

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white) ![Pygame](https://img.shields.io/badge/Pygame-2.x-FFCD00?logo=pygame&logoColor=black) ![Flask](https://img.shields.io/badge/Flask-REST-000000?logo=flask&logoColor=white)

泡姆泡姆三消棋的重制版，**现推荐使用无服务器（Serverless）部署**，开箱即用。传统 Python 服务器 + 客户端链路仍可使用，但不再推荐普通玩家自行搭建。棋逻辑仍由 [`server.GameEngine`](server.py) 统一复用，Python 客户端 UI 由 [`client.RemoteGame`](client.py) 驱动。

## 功能亮点
- ✅ 9×9 棋盘、原汁原味规则与三消占领机制
- ✅ 本地双人热座 + 在线房间对战
- ✅ 多房间并发、玩家昵称与令牌校验
- ✅ 直观的棋盘、落子高亮与比分面板

## 快速开始

### Serverless 云端体验（推荐）
打开 <https://pop.tokisaki.top/> 即可直接游玩。
若希望自定义域名或私有部署，可使用 [Vercel](https://vercel.com/) 一键导入本仓库并部署。
1. Fork 本仓库至个人账号。
2. 登录 [Vercel](https://vercel.com/)，选择“Import Project”，导入刚 Fork 的仓库。
3. 设置 supabase ,保存`SUPABASE_URL`，`SUPABASE_KEY`的vercel env。`SUPABASE_KEY`是Legacy API Key，可以在Supabase项目设置的API页面找到。开头是eyxxxxx
4. 在supabase中运行`database-inits.sql`脚本，初始化所需表结构。运行`cron-cleandata.sql`脚本以定期清理过期房间。
5. 访问生成的域名游玩。
6. （可选）设置upstash完成IP访问限速。

> Serverless 版本包含 UI、房间与规则逻辑，默认配置更易于分享；若仅想体验对战，这是首选方式。

### Python （Legacy，暂不推荐）
1. 安装依赖：
  ```sh
  pip install -r requirements.txt  # 或手动安装 flask pygame numpy requests waitress
  ```
2. 启动服务器（默认 `0.0.0.0:5000`）：
  ```sh
  # 开发模式（Flask 自带调试服务器，可追加 --debug）
  python server.py

  # 生产模式（Waitress WSGI，更稳定）
  python server.py --prod
  ```
3. 运行客户端并选择模式：
  ```sh
  python client.py
  ```
  - 选择“本地双人”即可原地对战。
  - 选择“在线”，输入服务器 IP、玩家昵称与四位房号即可与远端玩家同步对局。

#### Python REST 接口速览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/matches/{id}/join` | 加入/创建房间，返回玩家槽位与令牌 |
| `GET` | `/matches/{id}` | 轮询房间状态（棋盘、领地、计分、可用槽位等） |
| `POST` | `/matches/{id}/move` | 持令牌落子，验证轮次与坐标 |
| `POST` | `/matches/{id}/reset` | 由任一持牌玩家重置整局 |

所有请求/响应均为 JSON，失败时返回 `{ "message": "<错误原因>" }` 与对应 HTTP 状态码。

## 文件结构

```
POPUCOM-Chess/
├─ python/requirements.txt  ← 依赖列表
├─ python/server.py         ← Python 版本 Flask REST 服务、对局调度
├─ python/client.py         ← Python 版本 Pygame UI、本地 & 远程模式
├─ index.html               ← Serverless 版本前端页面
├─ api/game.js              ← Serverless 版本 API 逻辑
├─ main.js                  ← Serverless 版本前端逻辑
├─ style.css                ← Serverless 版本样式表
├─ database-inits.sql       ← Serverless 版本Supabase 初始化脚本，创建所需表结构
├─ cron-cleandata.sql       ← Serverless 版本定期清理过期房间的 Supabase SQL 脚本
└─ package.json             ← Serverless 版本依赖列表
```

## 常见问题

- **延迟/不同步**：客户端会以 ~0.8s 轮询 [`server.MatchState`](server.py)，可根据部署情况调整 `RemoteGame.poll_interval`。
- **端口占用**：运行 `python server.py --host 0.0.0.0 --port 8080 [--prod]` 指定端口/模式，客户端输入对应地址即可。
- **字符显示异常**：`client.py` 内 `load_font` 已尝试多款中文字体，可自行替换或加入本地字库路径。

祝玩得开心，记得支持泡姆泡姆！
