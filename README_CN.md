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

1. **零成本部署**: Vercel + Neon 免费额度完全够个人使用，无需购买服务器
2. **一键部署**: 几分钟内打造个人收藏系统，部署简单，几乎零配置
3. **多端支持**: Web + Mobile + Browser Extension 三端覆盖
4. **AI 增强**: RAG 和 AI Agent 集成，智能标签和内容总结
5. **开源免费**: 完全开源，数据完全属于你自己

## 🎨 VIBE CODING

这是一个纯 **VIBE CODING** 的项目：

- 我只实现了一个核心功能，其余功能基本全部由 Claude Code 实现
- 纯代码 **26,256 行**，详细见 [代码洞察](./docs/codeinsight.md)
- VIBE Coding 经验总结见 [开发经验](./docs/experience.md)
- VIBE Coding 实战复盘见 [我如何用 AI 把项目从 0 做到可用](./docs/vibe-coding.md)
- 欢迎 VIBE Coding PR！！！

欢迎交流 VIBE Coding 经验！

## 🚀 快速部署

### 前置要求

- [Vercel 账号](https://vercel.com)（免费）
- [Neon 账号](https://neon.tech)（免费 PostgreSQL 数据库）
- 大模型 和 嵌入模型 的 API Key

### 部署步骤

1. **[Fork 本仓库](../../fork)**
2. **Vercel 链接**
   - 在 Vercel 仪表盘点击 "New Project" → "Import Git Repository"
   - 选择你 Fork 的 MindPocket 仓库
   - 点击 "Deploy"
   - 在 "Integrations" 选项卡中，添加 Neon 集成，创建一个新的免费数据库实例，并连接到你的项目（Upstash 免费 Redis 也可以添加）
   - 连接 Vercel Blob 存储
   - 在 "Settings" → "Environment Variables" 中，添加环境变量（参考 [`apps/web/.env.example`](./apps/web/.env.example)）

3. **初始化数据库**
   - 部署完成后，数据库表会自动创建

4. **创建管理员账号**
   - 访问你的部署地址
   - 注册第一个账号即可开始使用(第一个账号默认管理员账户，注册后关闭注册功能，尽快注册)

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

# 配置环境变量
cd apps/web
# 模板文件：apps/web/.env.example
cp .env.example .env.local
# 编辑 .env.local 填入你的配置

# 初始化数据库
pnpm db:push

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
pnpm format       # 格式化代码
pnpm check        # 代码检查

# Web 应用 (apps/web)
pnpm dev          # 启动 Next.js
pnpm db:studio    # 数据库管理界面
pnpm db:generate  # 生成数据库迁移
pnpm db:migrate   # 运行迁移

# Native 应用 (apps/native)
pnpm dev          # 启动 Expo
pnpm android      # Android 运行
pnpm ios          # iOS 运行
```

## 🛠 技术栈

### Web 应用
- **框架**: Next.js 16 (App Router)
- **UI**: Radix UI + Tailwind CSS 4
- **认证**: Better Auth
- **数据库**: PostgreSQL (Neon) + Drizzle ORM
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
