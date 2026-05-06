<p align="center">
  <img src="./docs/icon.svg" width="80" height="80" alt="MindPocket Logo" />
</p>

<h1 align="center">MindPocket</h1>

<p align="center">
  A fully open-source, free, multi-platform, one-click deployable personal bookmark system with AI Agent integration.
</p>

<p align="center">
  <a href="./README_CN.md">中文文档</a>
</p>

<p align="center">
  <img src="./docs/all.png" alt="MindPocket Preview" />
</p>

<details>
<summary>📸 More Screenshots</summary>

| Web | AI Chat | Mobile |
|:---:|:---:|:---:|
| ![Web](./docs/pic/web1.png) | ![AI Chat](./docs/pic/web2.png) | ![Mobile](./docs/pic/phone.png) |
| ![Web Detail](./docs/pic/web3.png) | ![Extension](./docs/pic/extension.png) | |

</details>

MindPocket organizes your bookmarks with AI-powered RAG content summarization and automatic tag generation, making it easy to find and manage your saved content.

## ✨ Features

1. **Self-Hosted**: Docker one-click deploy, fully control your own data
2. **Zero Cost**: Free for personal use with built-in PostgreSQL
3. **Multi-Platform**: Web + Mobile + Browser Extension
4. **AI Enhanced**: RAG and AI Agent for smart tagging and summarization
5. **CLI Ready**: Official CLI makes it easy to integrate with external agents like OpenClaw
6. **Open Source**: Fully open source, your data belongs to you

## 🎨 VIBE CODING

This is a pure **VIBE CODING** project:

- I only implemented one core feature, the rest was built by Claude Code
- **26,256 lines** of pure code, see [Code Insight](./docs/codeinsight.md)
- VIBE Coding experience summary: [Development Experience](./docs/experience.md)
- VIBE Coding write-up (CN): [How I VIBE CODED this project](./docs/vibe-coding.md)
- VIBE Coding PRs are welcome!!!

## 🚀 Deploy

> Docker deployment covers only the **Web application** (`apps/web`). Mobile app and browser extension are not included.

There are two Docker-based deployment modes:

| Mode | Command | Use case |
|------|---------|----------|
| **Full stack** | `docker compose up -d` | Self-hosting / production — runs the app + PostgreSQL together |
| **DB only** | `docker compose up -d postgres minio` | Local development — run PostgreSQL + MinIO, start the app with `pnpm dev` |

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

---

### Mode 1 — Full Stack (App + Database)

Starts both the Next.js web app and a pgvector/PostgreSQL 17 database in containers. Best for self-hosting.

```bash
# Copy and edit environment variables
cp .env.example .env

# Build and start all services
docker compose up -d
```

Visit http://localhost:3000 to start using.

**Services started:**

| Service | Description | Default Port |
|---------|-------------|--------------|
| `mindpocket` | Next.js Web App | 3000 |
| `postgres` | pgvector/PostgreSQL 17 | 5432 (internal only) |
| `minio` | MinIO Object Storage (S3-compatible) | 9000 / 9001 (console) |

**Environment Variables** (see `.env.example` for full list):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Host port for the web service |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public URL of the app |
| `BETTER_AUTH_SECRET` | `mindpocket-local-dev-secret` | Auth secret, **must replace in production** |
| `POSTGRES_USER` | `mindpocket` | Built-in PostgreSQL username |
| `POSTGRES_PASSWORD` | `mindpocket` | Built-in PostgreSQL password |
| `POSTGRES_DB` | `mindpocket` | Built-in PostgreSQL database name |
| `DATABASE_URL` | auto-generated | External DB connection string; overrides built-in PostgreSQL |
| `MINIO_ENDPOINT` | `http://minio:9000` | MinIO endpoint (container-internal address) |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | `minioadmin` | MinIO secret key |
| `MINIO_BUCKET` | `mindpocket` | MinIO bucket name |
| `MINIO_PUBLIC_URL` | `http://localhost:9000` | Public URL for file access (host address) |

**Using an External Database:**

```bash
DATABASE_URL=postgresql://user:password@db.example.com:5432/mindpocket?sslmode=require
```

Or configure individual parts: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

**Common Commands:**

```bash
docker compose up -d                   # Start in background
docker compose logs -f                 # View logs
docker compose logs -f mindpocket      # Web service logs only
docker compose down                    # Stop services
docker compose down -v                 # Stop and remove data volumes
docker compose up -d --build           # Rebuild image
```

> **Port conflict?** If port `3000` is already in use on your machine, set a different port in `.env`:
> ```env
> PORT=3001
> NEXT_PUBLIC_APP_URL=http://localhost:3001
> ```

**Container Startup Flow** (see `docker-entrypoint.sh`):

1. Assembles `DATABASE_URL` from env vars (if not provided directly)
2. Ensures PostgreSQL extensions are installed (`pgvector`, etc.)
3. Pushes database schema via Drizzle ORM
4. Starts the Next.js standalone server

---

### Mode 2 — DB Only (Local Development)

Starts PostgreSQL and MinIO containers. The app runs locally with `pnpm dev`. Best for development.

```bash
docker compose up -d postgres minio
```

Default local connection string:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/mindpocket
```

If the container fails to start, check:

- Port `5432` / `9000` is free
- `DATABASE_URL` points to the local container
- The container image includes `pgvector`

## 💻 Local Development

### Requirements

- Node.js 18+
- pnpm 10.9.0

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/mindpocket.git
cd mindpocket

# Install dependencies
pnpm install

# Start local PostgreSQL + MinIO (Docker Mode 2)
docker compose up -d postgres minio

# Configure environment
cd apps/web
cp .env.example .env.local
# Edit .env.local with your configuration if needed

# Initialize database
pnpm db:bootstrap

# Start development server
cd ../..
pnpm dev
```

Visit http://127.0.0.1:3000 to start using.

### Commands

```bash
# Root
pnpm dev          # Start all apps
pnpm build        # Build all apps
pnpm cli:build    # Build the CLI package
pnpm cli:pack     # Preview the npm package contents for the CLI
pnpm format       # Format code
pnpm check        # Code check

# Web (apps/web)
pnpm dev          # Start Next.js
pnpm db:studio    # Database UI
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema directly

# Native (apps/native)
pnpm dev          # Start Expo
pnpm android      # Run on Android
pnpm ios          # Run on iOS
```

## CLI

MindPocket CLI is the official command line client for agents, scripts, and developers who want to interact with a MindPocket server from the terminal.

### Install

```bash
npm install -g mindpocket
```

Or with pnpm:

```bash
pnpm add -g mindpocket
```

### Quick Start

```bash
mindpocket version
mindpocket schema
mindpocket doctor
mindpocket --help
mindpocket config set server https://your-domain.com
mindpocket auth login
mindpocket user me
mindpocket bookmarks list
```

Recommended agent flow:

```bash
mindpocket version
mindpocket schema
mindpocket doctor
mindpocket auth login --no-open
```

### Agent Skill

MindPocket also ships a repository-scoped agent skill named `mindpocket`. The skill teaches compatible agents to discover commands with `schema`, verify readiness with `doctor`, configure the server, handle auth safely, and operate bookmark and folder workflows through the published CLI.

Install it with `skills.sh` from this repository:

```bash
npx skills add https://github.com/jihe520/mindpocket --skill mindpocket
```

For local testing from a checkout:

```bash
npx skills add ./skills/mindpocket
```

The skill is procedural guidance layered on top of the npm CLI, so users still need the `mindpocket` command available locally.

Example prompts:

```text
Use the `mindpocket` skill to list my latest 10 bookmarks.
Use the `mindpocket` skill to help me configure my server and log in.
```

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Web** | Next.js 16, Radix UI, Tailwind CSS 4, Better Auth, Drizzle ORM, Vercel AI SDK, Zustand |
| **Mobile** | Expo, React Native, Expo Router |
| **Extension** | WXT, Vite |
| **Tooling** | Turborepo, pnpm, Biome, Ultracite |

## 📱 Supported Platforms

- ✅ Web Application
- ✅ iOS / Android Mobile App
- ✅ Browser Extension (Chrome / Firefox / Edge)

## 🚧 Roadmap

- [ ] More UI settings options
- [ ] Support more bookmark platforms
- [ ] Improve AI Agent experience
- [ ] Optimize RAG

See [todolist](./docs/todo.md) for detailed roadmap.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues, share VIBE Coding experiences, or open pull requests.

**QQ Group**: 682827415 | [Join](https://qm.qq.com/q/EOwlK8AiJM)

## 📄 License

MIT License - see [LICENSE](./LICENSE)

## 🙏 Acknowledgments

Thanks to Claude Code for its significant contribution to this project!
