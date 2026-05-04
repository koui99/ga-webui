# GA WebUI + WebAPI 适配层

一个面向 GenericAgent 的前端开源发布仓库，包含可直接复用的 Web UI、WebAPI 适配层、部署示例和辅助脚本。

本仓库包含：
- frontend：Next.js 前端界面
- webapi：Python / FastAPI 适配层
- deploy：systemd 与 Caddy 示例配置
- scripts：安装与自检脚本

注意：
- 本仓库不是 GenericAgent 后端主体
- 本仓库用于与单独获取的 GenericAgent 配套部署
- 本仓库不包含运行时缓存、虚拟环境、本地密钥和机器相关配置

## 项目定位

适合下面这种场景：
- 想把 GenericAgent 的前端界面单独整理为可开源仓库
- 想把 frontend / webapi / deploy 这层与上游 GenericAgent 后端解耦维护
- 想让别人更方便地部署一套可用的 Web UI

不包含的内容：
- GenericAgent 核心源码
- 上游后端运行时状态
- 本地 `.env`、`mykey.py`、日志、构建缓存

## 目录结构

- `frontend/`：Next.js 前端
- `webapi/`：连接 GenericAgent 的 FastAPI 适配层
- `deploy/`：部署示例文件
- `scripts/`：安装与检查脚本

推荐部署目录：

`/opt/GenericAgent`
- 单独获取的 GenericAgent 后端目录

`/opt/ga-webui`
- 本仓库

请求链路：
- 浏览器 -> frontend
- frontend -> webapi
- webapi -> GenericAgent

其中：
- `webapi` 通过 `GA_REPO_ROOT` 找到 GenericAgent 目录
- `frontend` 通过 `GENERIC_AGENT_API_URL` 访问 WebAPI

## 依赖要求

部署前请准备：
- 已可正常运行的 GenericAgent 目录
- Python 3
- Node.js
- pnpm

另外请确认：
- GenericAgent 本身已经按其上游方式完成安装和配置
- 目标目录内存在 `agentmain.py`

## 快速开始

### 1. 准备 GenericAgent

示例路径：

`/opt/GenericAgent`

至少确认下面文件存在：

`/opt/GenericAgent/agentmain.py`

### 2. 安装 WebAPI 适配层

在本仓库根目录执行：

`bash scripts/install-webapi.sh`

脚本会自动：
- 在缺失时从 `.env.webapi.example` 生成 `.env.webapi`
- 创建根目录 `.venv/`
- 安装 `webapi/requirements.txt`

然后编辑 `.env.webapi`，至少设置：

`GA_REPO_ROOT=/opt/GenericAgent`

启动 WebAPI：

`set -a && . ./.env.webapi && set +a`
`./.venv/bin/python -m webapi.server`

默认监听：
- `127.0.0.1:8765`

### 3. 安装前端

在本仓库根目录执行：

`bash scripts/install-frontend.sh`

脚本会自动：
- 在缺失时从 `frontend/.env.example` 生成 `frontend/.env.local`
- 安装前端依赖
- 执行一次生产构建检查

前端开发模式：

`cd frontend && pnpm dev`

前端生产模式：

`cd frontend && pnpm start`

## 配置说明

### 前端配置

参考：
- `frontend/.env.example`

核心变量：
- `GENERIC_AGENT_API_URL=http://127.0.0.1:8765`

### WebAPI 配置

参考：
- `.env.webapi.example`

核心变量：
- `GA_REPO_ROOT=/opt/GenericAgent`
- `GA_HOST=127.0.0.1`
- `GA_PORT=8765`
- `GA_IMAGE_PROVIDER=mock`
- `GA_VISION_PROVIDER=glm`

可选变量：
- `OPENAI_API_KEY`
- `AI_GATEWAY_API_KEY`
- `FAL_KEY`
- `GEMINI_API_KEY`
- `GEMINI_BASE_URL`
- `GEMINI_MODEL`
- `GLM_API_KEY`
- `GLM_BASE_URL`
- `GLM_MODEL`

## 辅助脚本

### `scripts/install-webapi.sh`
用于初始化 `.env.webapi`、创建 `.venv` 并安装 Python 依赖。

### `scripts/install-frontend.sh`
用于初始化 `frontend/.env.local`、安装前端依赖并执行构建检查。

### `scripts/doctor.sh`
用于快速检查部署前提，当前会检查：
- Python / Node / pnpm 是否存在
- `frontend/.env.local` 是否存在
- 根目录 `.venv` 是否存在
- `GA_REPO_ROOT` 是否已配置
- `GA_REPO_ROOT` 下是否存在 `agentmain.py`
- `webapi/requirements.txt` 是否存在

执行方式：

`bash scripts/doctor.sh`

## deploy 示例

`deploy/` 目录当前包含：
- `ga-backend.service.example`
- `ga-frontend.service.example`
- `Caddyfile.example`

这些示例按“外挂 GenericAgent”布局编写：
- WebAPI 从本仓库运行
- `GA_REPO_ROOT` 指向独立的 GenericAgent 目录
- 前端通过 `GENERIC_AGENT_API_URL` 访问 WebAPI

## 常见问题

### Could not locate GenericAgent repo

通常表示 `GA_REPO_ROOT` 配错了，或者指向的目录不完整。

请检查：
- 目录是否真实存在
- 目录下是否有 `agentmain.py`

### 前端能打开，但模型列表或聊天不可用

通常优先检查：
- WebAPI 是否已经启动
- `GENERIC_AGENT_API_URL` 是否正确
- GenericAgent 本身是否已正确安装和配置

### 为什么这里不直接包含 GenericAgent？

因为本仓库的目标就是：
- 只开源前端、WebAPI、部署样板和辅助脚本
- 不把上游后端主体一起打包进来
- 让使用者自己决定如何获取与更新 GenericAgent

## 发布说明

本仓库已经排除了以下不应提交的内容：
- `.venv/`
- `frontend/node_modules/`
- `frontend/.next/`
- `__pycache__/`
- `mykey.py`
- 本地 `.env` 文件
- 机器相关运行时产物

## 上游关系说明

本仓库是面向 GenericAgent 的前端与适配层打包项目。

建议在仓库首页或发布说明中明确：
- 本仓库提供 frontend / webapi / deploy / scripts
- GenericAgent 后端核心需从上游单独获取
- 本仓库用于配套 GenericAgent 的 Web UI 部署

上游后端项目：
- `lsdefine/GenericAgent`

## License

MIT
