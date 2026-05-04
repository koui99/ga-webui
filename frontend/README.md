# Generic Agent Frontend

面向 GenericAgent 的现代化 Next.js Web 前端。

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

## 启动

推荐使用 pnpm：

pnpm install
cp .env.example .env.local
pnpm dev

默认访问：http://localhost:3000

## 后端连接

前端自身只访问同源 `/api/*` 路由；这些路由再转发到 Python adapter。

通过环境变量配置后端地址：

GENERIC_AGENT_API_URL=http://127.0.0.1:8765

## 目录结构

- `app/`：Next.js 路由层与页面入口
- `components/`：聊天 UI 与通用 UI 组件
- `hooks/`：React hooks
- `lib/`：聊天协议、store、客户端适配、配置

## 常用命令

pnpm dev
pnpm lint
pnpm build
