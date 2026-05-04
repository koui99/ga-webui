# GenericAgent WebAPI Adapter

这是一个 FastAPI 适配层，不包含 GenericAgent 核心本体。

它负责：
- 暴露 `/health` `/llms` `/chat` `/abort` `/reinject` `/custom_llms`
- 把前端请求转发到 GenericAgent 运行实例
- 处理图片输入、视觉描述注入、`/image` 指令
- 通过 `mykey.py` / `mykey.json` 管理 UI 添加的模型配置

## 运行

python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
export GA_REPO_ROOT=/path/to/GenericAgent
python -m webapi.server --port 8765
