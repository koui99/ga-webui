# GA WebUI + WebAPI Adapter

一个给 GenericAgent 使用的前端发布仓库，包含：
- frontend：Next.js Web UI
- webapi：Python / FastAPI 适配层
- deploy：systemd 与 Caddy 示例配置
- scripts：安装与自检脚本

这个仓库不是 GenericAgent 本体，也不会替代 GenericAgent。
它的定位是：作为一个可单独开源、可单独维护的前端项目，外挂到你自己准备好的 GenericAgent 后端上使用。

不包含：
- GenericAgent 后端核心源码
- 运行时缓存、构建产物、虚拟环境、日志
- 真实密钥、真实域名、真实服务器路径

## 目录

- `frontend/`：前端源码
- `webapi/`：HTTP 适配层源码
- `deploy/`：部署示例
- `scripts/`：安装与检查脚本

## 与 GenericAgent 的关系

这个仓库依赖你单独准备一个 GenericAgent 工作目录。

推荐部署关系：
- GenericAgent：单独放在一个目录
- 本仓库：单独放在另一个目录
- 本仓库中的 `webapi/` 通过 `GA_REPO_ROOT` 指向 GenericAgent 根目录
- 本仓库中的 `frontend/` 通过 `GENERIC_AGENT_API_URL` 指向 webapi 服务

适配层当前通过以下方式连接 GenericAgent：
- 查找 `agentmain.py`
- 调用 `GeneraticAgent`
- 使用 `mykey.py` / `mykey.json` 管理自定义模型配置

## 推荐目录结构

`/opt/GenericAgent`
- 上游 GenericAgent 仓库

`/opt/ga-webui`
- 本仓库
- `frontend/`
- `webapi/`
- `deploy/`
- `scripts/`

## 前置条件

你需要自己准备：
- 一个可用的 GenericAgent 目录
- Python 3
- Node.js
- pnpm

同时确保 GenericAgent 本身已经具备它自己的运行前提。

## 快速开始

### 1. 准备 GenericAgent

先单独获取并配置 GenericAgent，例如：

`/opt/GenericAgent`

并确认下面这个文件存在：
- `/opt/GenericAgent/agentmain.py`

### 2. 启动 webapi 适配层

在本仓库根目录执行：

`cp .env.webapi.example .env.webapi`

按需修改里面的 `GA_REPO_ROOT` 等变量，然后执行：

`bash scripts/install-webapi.sh`

启动方式示例：

`set -a && . ./.env.webapi && set +a`
`./.venv/bin/python -m webapi.server`

默认监听：
- `127.0.0.1:8765`

### 3. 启动前端

在本仓库根目录执行：

`bash scripts/install-frontend.sh`

默认会：
- 为 `frontend/.env.local` 生成示例配置
- 安装依赖
- 构建前端

开发启动：

`cd frontend && pnpm dev`

生产启动：

`cd frontend && pnpm start`

## 环境变量

### frontend

见：
- `frontend/.env.example`

最关键的是：
- `GENERIC_AGENT_API_URL=http://127.0.0.1:8765`

### webapi

见：
- `.env.webapi.example`

常用变量：
- `GA_REPO_ROOT=/opt/GenericAgent`
- `GA_HOST=127.0.0.1`
- `GA_PORT=8765`
- `GA_IMAGE_PROVIDER=mock`
- `GA_VISION_PROVIDER=glm`

按需可选：
- `OPENAI_API_KEY`
- `AI_GATEWAY_API_KEY`
- `FAL_KEY`
- `GEMINI_API_KEY`
- `GEMINI_BASE_URL`
- `GEMINI_MODEL`
- `GLM_API_KEY`
- `GLM_BASE_URL`
- `GLM_MODEL`

## 自检

本仓库提供：

`bash scripts/doctor.sh`

会检查：
- `GA_REPO_ROOT` 是否存在
- `agentmain.py` 是否存在
- Python 虚拟环境与 webapi 依赖是否就绪
- Node / pnpm 是否存在
- frontend 配置文件是否存在

## deploy 示例

`deploy/` 目录下提供了：
- `ga-backend.service.example`
- `ga-frontend.service.example`
- `Caddyfile.example`

这些示例使用的是“外挂 GenericAgent”布局：
- webapi 从本仓库启动
- 通过 `GA_REPO_ROOT` 指向单独的 GenericAgent 目录
- 前端再通过 `GENERIC_AGENT_API_URL` 指向 webapi

## 常见问题

### 1. Could not locate GenericAgent repo

说明 `GA_REPO_ROOT` 没有正确指向 GenericAgent 根目录。

请检查：
- 该目录是否存在
- 该目录下是否有 `agentmain.py`

### 2. frontend 能启动，但没有模型或无法聊天

通常不是前端问题，而是：
- webapi 没启动
- `GENERIC_AGENT_API_URL` 填错
- GenericAgent 本身没有配置好模型

### 3. 为什么这个仓库不包含 GenericAgent？

因为这个仓库的目标就是：
- 只开源前端与 webapi 适配层
- 与上游 GenericAgent 解耦维护
- 让使用者自己决定用哪份 GenericAgent、怎么更新 GenericAgent

## 发布前已做的清理

已排除：
- `.git/`
- `frontend/node_modules/`
- `frontend/.next/`
- `.venv/`
- `__pycache__/`
- `mykey.py`
- 各类本地 `.env`
- 真实域名与服务器绝对路径

## 许可

本目录携带 MIT License。

建议你在公开发布时继续明确说明：
- frontend / webapi / deploy / scripts 为你的发布包
- GenericAgent 后端核心来自上游 `lsdefine/GenericAgent`
- 本项目用于配套 GenericAgent 的 Web UI 与 WebAPI 适配层部署
