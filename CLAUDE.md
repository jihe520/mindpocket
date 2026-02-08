# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

这是一个基于 Turborepo 的 monorepo 项目，包含 Web 和 Native 两个应用，使用 React Native Web 实现跨平台代码共享。

### 项目结构

- **apps/web**: Next.js 16 应用（主要 Web 应用）
- **apps/native**: Expo/React Native 应用
- **packages/typescript-config**: 共享的 TypeScript 配置
- **packages/validators**: 共享的验证逻辑

## Development Commands

### 根目录命令

```bash
# 启动所有应用的开发服务器
pnpm dev

# 构建所有应用
pnpm build

# 代码检查和格式化
pnpm lint          # 使用 Biome 进行 lint
pnpm format        # 使用 Biome 格式化代码
pnpm check         # 使用 Ultracite 检查
pnpm fix           # 使用 Ultracite 修复

# 清理所有构建产物和 node_modules
pnpm clean
```

### Web 应用 (apps/web)

```bash
cd apps/web

# 开发
pnpm dev           # 启动 Next.js 开发服务器 (http://localhost:3000)
pnpm build         # 构建生产版本
pnpm start         # 启动生产服务器

# 数据库操作
pnpm db:generate   # 生成 Drizzle 迁移文件
pnpm db:migrate    # 运行数据库迁移
pnpm db:push       # 直接推送 schema 到数据库（开发环境）
pnpm db:studio     # 启动 Drizzle Studio 数据库管理界面

# 创建用户（需要先配置数据库）
pnpm tsx scripts/create-user.ts <email> <password> [name]
```

### Native 应用 (apps/native)

```bash
cd apps/native

pnpm dev           # 启动 Expo 开发服务器
pnpm android       # 在 Android 上运行
pnpm ios           # 在 iOS 上运行
pnpm web           # 在 Web 上运行
```

## Architecture

### Tech Stack

**Web 应用:**
- **框架**: Next.js 16 (App Router)
- **UI**: Radix UI + Tailwind CSS 4
- **认证**: Better Auth (基于 email/password)
- **数据库**: PostgreSQL + Drizzle ORM (Neon Serverless)
- **AI**: Vercel AI SDK + OpenAI
- **状态管理**: Zustand
- **动画**: Motion (Framer Motion)
- **其他**: React Native Web (跨平台组件共享)

**Native 应用:**
- **框架**: Expo + React Native
- **路由**: Expo Router
- **UI**: HeroUI Native + Tailwind (uniwind)
- **导航**: React Navigation

### 跨平台策略

项目使用 React Native Web 实现代码共享：
- Next.js 配置了 `react-native` 别名指向 `react-native-web`
- 支持 `.web.tsx` 扩展名优先级解析
- 组件可以在 Web 和 Native 之间共享

### 认证架构

使用 Better Auth 实现认证系统：
- **服务端**: `apps/web/lib/auth.ts` - Better Auth 配置
- **客户端**: `apps/web/lib/auth-client.ts` - 客户端 SDK
- **API 路由**: `apps/web/app/api/auth/[...all]/route.ts` - 认证端点
- **数据库 Schema**: `apps/web/db/schema/auth.ts` - 用户和账户表

当前启用的认证方式：
- Email/Password 认证
- 社交登录（Google、GitHub）已配置但未启用

### 数据库架构

- **ORM**: Drizzle ORM
- **数据库**: PostgreSQL (Neon Serverless)
- **配置文件**: `apps/web/drizzle.config.ts`
- **Schema 位置**: `apps/web/db/schema/`
- **迁移文件**: `apps/web/db/migrations/`
- **客户端**: `apps/web/db/client.ts`

环境变量需要在 `apps/web/.env.local` 中配置 `DATABASE_URL`。

### UI 组件

- **组件库**: 使用 shadcn/ui 风格的组件系统
- **配置文件**: `apps/web/components.json`
- **组件位置**: `apps/web/components/ui/`
- **自定义组件**: `apps/web/components/` (如 login-form, sidebar-left 等)

## Important Notes

### 包管理器

- 必须使用 **pnpm** (版本 10.9.0)
- 这是一个 workspace monorepo，使用 `workspace:*` 协议引用内部包

### 代码风格

- 使用 **Biome** 进行 lint 和格式化（不是 ESLint/Prettier）
- 使用 **Ultracite** 进行额外的代码检查

### 数据库工作流

1. 修改 schema 文件 (`apps/web/db/schema/`)
2. 运行 `pnpm db:generate` 生成迁移
3. 运行 `pnpm db:migrate` 应用迁移（生产环境）
4. 或运行 `pnpm db:push` 直接推送（开发环境）

### 创建新用户

由于认证系统需要密码哈希，不能直接在数据库中创建用户。使用提供的脚本：

```bash
cd apps/web
pnpm tsx scripts/create-user.ts your@email.com yourpassword "Your Name"
```

### Turbo 缓存

Turborepo 会缓存构建结果以加速后续构建。如果遇到缓存问题，可以：
- 删除 `.turbo` 目录
- 运行 `pnpm clean` 清理所有缓存

完成一段任务 在项目根目录运行：
```bash
先pnpm format
后pnpm check
``` 
以确保代码质量。


邮箱: admin@mindpocket.com
密码: admin123456



## 参考
./PROJECT.md