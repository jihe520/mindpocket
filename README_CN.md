<p align="center">
  <img src="./docs/icon.svg" width="80" height="80" alt="MindPocket Logo" />
</p>

<h1 align="center">MindPocket</h1>

<p align="center">
  完全开源、免费、多端、一键部署、AI Agent 集成的个人收藏夹系统
</p>

<p align="center">
  <a href="./README.md">English</a>
</p>

<p align="center">
  <img src="./docs/all.png" alt="MindPocket Preview" />
</p>

<details>
<summary>📸 更多截图</summary>

| Web 界面 | AI 对话 | 移动端 |
|:---:|:---:|:---:|
| ![Web](./docs/pic/web1.png) | ![AI Chat](./docs/pic/web2.png) | ![Mobile](./docs/pic/phone.png) |
| ![Web Detail](./docs/pic/web3.png) | ![Extension](./docs/pic/extension.png) | |

</details>

MindPocket 将你的收藏内容进行分类存储，并通过 AI Agent 进行 RAG 内容总结和标签生成，方便你快速找到和管理收藏内容。

## ✨ 特性

1. **自托管**: Docker 一键部署，完全掌控自己的数据
2. **零成本**: 内置 PostgreSQL，个人使用完全免费
3. **多端支持**: Web + Mobile + Browser Extension 三端覆盖
4. **AI 增强**: RAG 和 AI Agent 集成，智能标签和内容总结
5. **CLI 友好**: 官方 CLI 方便与 OpenClaw 等外部 Agent 集成
6. **开源免费**: 完全开源，数据完全属于你自己

## 🎨 VIBE CODING

这是一个纯 **VIBE CODING** 的项目：

- 我只实现了一个核心功能，其余功能基本全部由 Claude Code 实现
- 纯代码 **26,256 行**，详细见 [代码洞察](./docs/codeinsight.md)
- VIBE Coding 经验总结见 [开发经验](./docs/experience.md)
- VIBE Coding 实战复盘见 [我如何用 AI 把项目从 0 做到可用](./docs/vibe-coding.md)
- 欢迎 VIBE Coding PR！！！

欢迎交流 VIBE Coding 经验！

## 🚀 部署

> Docker 部署目前仅包含 **Web 应用**（`apps/web`），不包含移动端和浏览器插件。

Docker 部署分为两种模式：

| 模式 | 命令 | 适用场景 |
|------|------|----------|
| **全栈模式** | `docker compose up -d` | 自托管 / 生产环境 — 应用 + PostgreSQL 全部容器化 |
| **仅数据库** | `docker compose up -d postgres minio` | 本地开发 — 启动 PostgreSQL + MinIO，应用用 `pnpm dev` 本地运行 |

### 前置要求

- [Docker](https://docs.docker.com/get-docker/) 和 [Docker Compose](https://docs.docker.com/compose/install/)

---

### 模式一 — 全栈部署（应用 + 数据库）

同时启动 Next.js Web 应用和 pgvector/PostgreSQL 17 数据库，适合自托管部署。

```bash
# 复制并编辑环境变量
cp .env.example .env

# 构建并启动所有服务
docker compose up -d
```

启动后访问 http://localhost:3000 即可使用。

**启动的服务：**

| 服务 | 说明 | 默认端口 |
|------|------|----------|
| `mindpocket` | Next.js Web 应用 | 3000 |
| `postgres` | pgvector/PostgreSQL 17 数据库 | 5432（仅容器内部） |
| `minio` | MinIO 对象存储（S3 兼容） | 9000 / 9001（控制台） |

**环境变量**（完整列表见 `.env.example`）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | Web 服务映射到宿主机的端口 |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | 应用公开访问地址 |
| `BETTER_AUTH_SECRET` | `mindpocket-local-dev-secret` | 认证密钥，**生产环境务必替换** |
| `POSTGRES_USER` | `mindpocket` | 内置 PostgreSQL 用户名 |
| `POSTGRES_PASSWORD` | `mindpocket` | 内置 PostgreSQL 密码 |
| `POSTGRES_DB` | `mindpocket` | 内置 PostgreSQL 数据库名 |
| `DATABASE_URL` | 自动拼接 | 外部数据库连接串，设置后将跳过内置 PostgreSQL 配置 |
| `MINIO_ENDPOINT` | `http://minio:9000` | MinIO 端点（容器内部地址） |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO 访问密钥 |
| `MINIO_SECRET_KEY` | `minioadmin` | MinIO 密钥 |
| `MINIO_BUCKET` | `mindpocket` | MinIO 存储桶名称 |
| `MINIO_PUBLIC_URL` | `http://localhost:9000` | 文件公开访问地址（宿主机地址） |

**使用外部数据库：**

```bash
DATABASE_URL=postgresql://user:password@db.example.com:5432/mindpocket?sslmode=require
```

也可以通过 `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME` 分别配置。

**常用命令：**

```bash
docker compose up -d                   # 后台启动
docker compose logs -f                 # 查看日志
docker compose logs -f mindpocket      # 仅查看 Web 服务日志
docker compose down                    # 停止服务
docker compose down -v                 # 停止服务并清除数据卷
docker compose up -d --build           # 重新构建镜像
```

> **端口冲突？** 如果宿主机的 `3000` 端口已被占用，在 `.env` 中改用其他端口：
> ```env
> PORT=3001
> NEXT_PUBLIC_APP_URL=http://localhost:3001
> ```

**容器启动流程**（见 `docker-entrypoint.sh`）：

1. 根据环境变量拼接 `DATABASE_URL`（如未直接提供）
2. 确保 PostgreSQL 扩展已安装（`pgvector` 等）
3. 通过 Drizzle ORM 自动推送数据库 schema
4. 启动 Next.js standalone 服务

---

### 模式二 — 仅数据库（本地开发）

启动 PostgreSQL 和 MinIO 容器，应用通过 `pnpm dev` 本地运行，适合开发调试。

```bash
docker compose up -d postgres minio
```

默认本地连接串：

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/mindpocket
```

如果容器启动失败，优先检查：

- `5432` / `9000` 端口是否被占用
- `DATABASE_URL` 是否指向本地容器
- 当前镜像是否包含 `pgvector`

## 💻 本地开发

### 环境要求

- Node.js 18+
- pnpm 10.9.0

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/jihe520/mindpocket
cd mindpocket

# 安装依赖
pnpm install

# 启动本地 PostgreSQL + MinIO（Docker 模式二）
docker compose up -d postgres minio

# 配置环境变量
cd apps/web
cp .env.example .env.local
# 如有需要再编辑 .env.local

# 初始化数据库
pnpm db:bootstrap

# 启动开发服务器
cd ../..
pnpm dev
```

访问 http://127.0.0.1:3000 开始使用。

### 开发命令

```bash
# 根目录
pnpm dev          # 启动所有应用
pnpm build        # 构建所有应用
pnpm cli:build    # 构建 CLI 包
pnpm cli:pack     # 预览 CLI 的 npm 发包内容
pnpm format       # 格式化代码
pnpm check        # 代码检查

# Web 应用 (apps/web)
pnpm dev          # 启动 Next.js
pnpm db:studio    # 数据库管理界面
pnpm db:generate  # 生成数据库迁移
pnpm db:migrate   # 运行迁移
pnpm db:push      # 直接同步 schema

# Native 应用 (apps/native)
pnpm dev          # 启动 Expo
pnpm android      # Android 运行
pnpm ios          # iOS 运行
```

## CLI

MindPocket CLI 是官方命令行客户端，适合 Agent、脚本和开发者在终端中与 MindPocket 服务交互。

### 安装

```bash
npm install -g mindpocket
```

或者使用 pnpm：

```bash
pnpm add -g mindpocket
```

### 快速开始

```bash
mindpocket --help
mindpocket config set server https://your-domain.com
mindpocket auth login
mindpocket user me
mindpocket bookmarks list
```

## 🛠 技术栈

### Web 应用
- **框架**: Next.js 16 (App Router)
- **UI**: Radix UI + Tailwind CSS 4
- **认证**: Better Auth
- **数据库**: PostgreSQL + Drizzle ORM
- **AI**: Vercel AI SDK + OpenAI
- **状态管理**: Zustand
- **动画**: Motion (Framer Motion)

### Mobile 应用
- **框架**: Expo + React Native
- **路由**: Expo Router

### Browser Extension
- **框架**: WXT
- **构建**: Vite

### 工程化
- **Monorepo**: Turborepo
- **包管理**: pnpm
- **代码质量**: Biome + Ultracite

## 📱 支持平台

- ✅ Web 应用
- ✅ iOS / Android 移动应用
- ✅ 浏览器插件（Chrome / Firefox / Edge）

## 🚧 项目状态 & ROADMAP

- [ ] 添加更多设置配置选项在 UI 界面，更加友好用户体验
- [ ] 支持更多收藏解析平台
- [ ] 优化 AI Agent 交互体验
- [ ] 优化 RAG
- ...

[todolist](./docs/todo.md) 查看详细 ROADMAP

为了方便部署和保持免费，尽量减少外部服务依赖
欢迎提 Issue 讨论功能建议和实现方案

## 🤝 贡献

欢迎各种形式的贡献：

1. 🐛 提交 Bug 报告和功能建议
2. 💡 分享 VIBE Coding 经验
3. 🔧 提交 Pull Request（欢迎 VIBE Coding PR）
4. 📖 完善文档

### 加入社区

**QQ 群**: 682827415

[点击加入群聊【MindPocket】](https://qm.qq.com/q/EOwlK8AiJM)

## 📄 License

MIT License - 详见 [LICENSE](./LICENSE)

## 🙏 致谢

感谢 Claude Code 在本项目开发中的巨大贡献！
