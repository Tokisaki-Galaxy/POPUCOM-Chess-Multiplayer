# POPUCOM 三消棋 (本地 & 在线)

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white) ![Pygame](https://img.shields.io/badge/Pygame-2.x-FFCD00?logo=pygame&logoColor=black) ![Flask](https://img.shields.io/badge/Flask-REST-000000?logo=flask&logoColor=white)

泡姆泡姆三消棋的 Python 重制版，现支持本地对战与 RESTful 在线联机。棋逻辑由 [`server.GameEngine`](server.py) 统一复用，客户端 UI 由 [`client.RemoteGame`](client.py) 驱动。

## 功能亮点
- ✅ 9×9 棋盘、原汁原味规则与三消占领机制
- ✅ 本地双人热座 + 在线房间对战（四位房号）
- ✅ 多房间并发、玩家昵称与令牌校验
- ✅ 直观的 Pygame 棋盘、落子高亮与比分面板

## 架构示意
<svg viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg" width="100%">
  <style>
    .node { fill:#1c232b; stroke:#64a0d2; stroke-width:2; rx:12; ry:12; }
    .text { fill:#f0f0f0; font-family:'Segoe UI', 'Microsoft YaHei', sans-serif; font-size:14px; }
    .arrow { stroke:#ffd700; stroke-width:2; marker-end:url(#arrowhead); }
    .label { fill:#ffd700; font-size:12px; }
  </style>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#ffd700"/>
    </marker>
  </defs>
  <rect class="node" x="30" y="60" width="150" height="100"/>
  <text class="text" x="105" y="110" text-anchor="middle">客户端</text>
  <text class="text" x="105" y="130" text-anchor="middle">Pygame UI</text>

  <rect class="node" x="420" y="60" width="150" height="100"/>
  <text class="text" x="495" y="102" text-anchor="middle">Flask 服务器</text>
  <text class="text" x="495" y="122" text-anchor="middle">MatchState / GameEngine</text>

  <rect class="node" x="220" y="20" width="160" height="70"/>
  <text class="text" x="300" y="55" text-anchor="middle">REST API</text>

  <rect class="node" x="220" y="130" width="160" height="70"/>
  <text class="text" x="300" y="165" text-anchor="middle">房间存储</text>

  <line class="arrow" x1="180" y1="110" x2="420" y2="110"/>
  <text class="label" x="300" y="95" text-anchor="middle">/join · /move · /reset · /matches</text>
  <line class="arrow" x1="220" y1="60" x2="220" y2="130"/>
  <line class="arrow" x1="380" y1="60" x2="380" y2="130"/>
</svg>

## 快速开始

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

## REST 接口速览

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
├─ client.py   ← Pygame UI、本地 & 远程模式
├─ server.py   ← Flask REST 服务、对局调度
├─ HTML/三消棋.html ← 纯前端示例
└─ README.md
```

## 常见问题

- **延迟/不同步**：客户端会以 ~0.8s 轮询 [`server.MatchState`](server.py)，可根据部署情况调整 `RemoteGame.poll_interval`。
- **端口占用**：运行 `python server.py --host 0.0.0.0 --port 8080 [--prod]` 指定端口/模式，客户端输入对应地址即可。
- **字符显示异常**：`client.py` 内 `load_font` 已尝试多款中文字体，可自行替换或加入本地字库路径。

祝玩得开心，记得支持泡姆泡姆！
