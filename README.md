# GA WebUI + WebAPI Adapter

一个面向 GenericAgent 的可独立发布源码包，包含：
- frontend：Next.js Web UI
- webapi：Python/FastAPI 适配层
- deploy：systemd 与 Caddy 示例配置

不包含：
- GenericAgent 后端核心源码
- 运行时缓存、构建产物、虚拟环境、日志
- 真实密钥、真实域名、真实服务器路径

## 目录

- `frontend/`：前端源码
- `webapi/`：HTTP 适配层源码
- `deploy/`：部署示例

## 与 GenericAgent 的关系

这个仓库不是 GenericAgent 本体。

推荐部署方式：
1. 单独获取上游 `lsdefine/GenericAgent`
2. 将本仓库中的 `webapi/` 放到 GenericAgent 仓库根目录旁边使用，或按 `GA_REPO_ROOT` 指向 GenericAgent 根目录
3. 部署 `frontend/`，并设置 `GENERIC_AGENT_API_URL`

当前适配层会通过以下方式连接 GenericAgent：
- 查找 `agentmain.py`
- 调用 GA 的 `GeneraticAgent`
- 通过 `mykey.py` 管理自定义模型配置

## Frontend quick start

cd frontend
pnpm install
cp .env.example .env.local
pnpm dev

## WebAPI quick start

cd webapi
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
export GA_REPO_ROOT=/path/to/GenericAgent
python -m webapi.server --port 8765

## 必要环境变量

前端：
- `GENERIC_AGENT_API_URL=http://127.0.0.1:8765`

适配层常用：
- `GA_REPO_ROOT=/path/to/GenericAgent`
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

## 发布前已做的清理

已排除：
- `.git/`
- `node_modules/`
- `.next/`
- `.venv/`
- `__pycache__/`
- `temp/`
- `memory/`
- `mykey.py`
- 真实域名与服务器绝对路径

## 许可

本目录携带 MIT License。若你后续继续分拆或改名发布，建议在 README 中明确说明：
- frontend / webapi 为你的发布包
- GenericAgent 后端核心来自上游 `lsdefine/GenericAgent`
