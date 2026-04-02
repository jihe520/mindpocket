async function seed() {
  const { nanoid } = await import("nanoid")
  const { db } = await import("../db/client")
  const { user } = await import("../db/schema/auth")
  const { bookmark } = await import("../db/schema/bookmark")
  const { chat, message } = await import("../db/schema/chat")
  const { folder } = await import("../db/schema/folder")
  const { bookmarkTag, tag } = await import("../db/schema/tag")
  // 先查找已有用户
  const existingUsers = await db.select().from(user)

  if (existingUsers.length === 0) {
    console.error("❌ 数据库中没有用户，请先创建用户:")
    console.error("   pnpm tsx scripts/create-user.ts xxx@mindpocket.com xxxxx Admin")
    process.exit(1)
  }

  const userId = existingUsers[0].id
  console.log(`📌 使用用户: ${existingUsers[0].email} (${userId})`)

  try {
    // ========== 1. 创建文件夹 ==========
    console.log("\n📁 创建文件夹...")
    const folders = [
      { id: nanoid(), userId, name: "前端开发", emoji: "⚛️", sortOrder: 0 },
      { id: nanoid(), userId, name: "后端技术", emoji: "🖥️", sortOrder: 1 },
      { id: nanoid(), userId, name: "AI & 机器学习", emoji: "🤖", sortOrder: 2 },
      { id: nanoid(), userId, name: "设计灵感", emoji: "🎨", sortOrder: 3 },
      { id: nanoid(), userId, name: "阅读清单", emoji: "📚", sortOrder: 4 },
    ]
    await db.insert(folder).values(folders)
    console.log(`   ✅ 创建了 ${folders.length} 个文件夹`)

    // ========== 2. 创建标签 ==========
    console.log("\n🏷️  创建标签...")
    const tags = [
      { id: nanoid(), userId, name: "React", color: "#61DAFB" },
      { id: nanoid(), userId, name: "Next.js", color: "#000000" },
      { id: nanoid(), userId, name: "TypeScript", color: "#3178C6" },
      { id: nanoid(), userId, name: "Node.js", color: "#339933" },
      { id: nanoid(), userId, name: "Python", color: "#3776AB" },
      { id: nanoid(), userId, name: "AI", color: "#FF6F61" },
      { id: nanoid(), userId, name: "CSS", color: "#1572B6" },
      { id: nanoid(), userId, name: "数据库", color: "#4479A1" },
      { id: nanoid(), userId, name: "DevOps", color: "#FF9900" },
      { id: nanoid(), userId, name: "开源", color: "#24292E" },
    ]
    await db.insert(tag).values(tags)
    console.log(`   ✅ 创建了 ${tags.length} 个标签`)

    // ========== 3. 创建书签 ==========
    console.log("\n🔖 创建书签...")
    const bookmarks = [
      // 前端开发文件夹
      {
        id: nanoid(),
        userId,
        folderId: folders[0].id,
        type: "link",
        title: "React 官方文档",
        description: "React 最新官方文档，包含 Hooks、Server Components 等内容",
        url: "https://react.dev",
        isFavorite: true,
        isArchived: false,
      },
      {
        id: nanoid(),
        userId,
        folderId: folders[0].id,
        type: "link",
        title: "Next.js 文档",
        description: "Next.js App Router 完整指南",
        url: "https://nextjs.org/docs",
        isFavorite: true,
        isArchived: false,
      },
      {
        id: nanoid(),
        userId,
        folderId: folders[0].id,
        type: "link",
        title: "Tailwind CSS",
        description: "实用优先的 CSS 框架",
        url: "https://tailwindcss.com",
        isFavorite: false,
        isArchived: false,
      },
      {
        id: nanoid(),
        userId,
        folderId: folders[0].id,
        type: "link",
        title: "Radix UI Primitives",
        description: "无样式、可访问的 UI 组件库",
        url: "https://www.radix-ui.com",
        isFavorite: false,
        isArchived: false,
      },
      // 后端技术文件夹
      {
        id: nanoid(),
        userId,
        folderId: folders[1].id,
        type: "link",
        title: "Drizzle ORM 文档",
        description: "TypeScript ORM，轻量且类型安全",
        url: "https://orm.drizzle.team",
        isFavorite: true,
        isArchived: false,
      },
      {
        id: nanoid(),
        userId,
        folderId: folders[1].id,
        type: "link",
        title: "Hono - 轻量 Web 框架",
        description: "适用于 Edge 的超快 Web 框架",
        url: "https://hono.dev",
        isFavorite: false,
        isArchived: false,
      },
      {
        id: nanoid(),
        userId,
        folderId: folders[1].id,
        type: "link",
        title: "PostgreSQL 教程",
        description: "PostgreSQL 从入门到精通",
        url: "https://www.postgresql.org/docs/",
        isFavorite: false,
        isArchived: false,
      },
      // AI & 机器学习文件夹
      {
        id: nanoid(),
        userId,
        folderId: folders[2].id,
        type: "link",
        title: "Vercel AI SDK",
        description: "构建 AI 应用的 TypeScript 工具包",
        url: "https://sdk.vercel.ai",
        isFavorite: true,
        isArchived: false,
      },
      {
        id: nanoid(),
        userId,
        folderId: folders[2].id,
        type: "link",
        title: "OpenAI API 文档",
        description: "GPT-4、DALL-E 等模型的 API 参考",
        url: "https://platform.openai.com/docs",
        isFavorite: false,
        isArchived: false,
      },
      {
        id: nanoid(),
        userId,
        folderId: folders[2].id,
        type: "link",
        title: "Hugging Face",
        description: "开源机器学习模型和数据集平台",
        url: "https://huggingface.co",
        isFavorite: false,
        isArchived: false,
      },
      // 设计灵感文件夹
      {
        id: nanoid(),
        userId,
        folderId: folders[3].id,
        type: "link",
        title: "Dribbble",
        description: "设计师作品展示平台",
        url: "https://dribbble.com",
        isFavorite: false,
        isArchived: false,
      },
      {
        id: nanoid(),
        userId,
        folderId: folders[3].id,
        type: "link",
        title: "Figma 社区",
        description: "免费设计资源和模板",
        url: "https://www.figma.com/community",
        isFavorite: true,
        isArchived: false,
      },
      // 阅读清单文件夹
      {
        id: nanoid(),
        userId,
        folderId: folders[4].id,
        type: "link",
        title: "The Pragmatic Engineer",
        description: "软件工程深度分析博客",
        url: "https://blog.pragmaticengineer.com",
        isFavorite: false,
        isArchived: false,
      },
      {
        id: nanoid(),
        userId,
        folderId: folders[4].id,
        type: "link",
        title: "Dan Abramov 的博客",
        description: "React 核心开发者的技术博客",
        url: "https://overreacted.io",
        isFavorite: true,
        isArchived: false,
      },
      // 无文件夹的书签
      {
        id: nanoid(),
        userId,
        folderId: null,
        type: "note",
        title: "项目架构笔记",
        description: "MindPocket 项目的架构设计思路",
        content:
          "## 架构要点\n\n1. 使用 Turborepo monorepo 管理\n2. Next.js App Router 作为 Web 框架\n3. React Native Web 实现跨平台\n4. Drizzle ORM + Neon PostgreSQL",
        isFavorite: false,
        isArchived: false,
      },
      {
        id: nanoid(),
        userId,
        folderId: null,
        type: "link",
        title: "GitHub Copilot",
        description: "AI 编程助手",
        url: "https://github.com/features/copilot",
        isFavorite: false,
        isArchived: true,
      },
    ]
    await db.insert(bookmark).values(bookmarks)
    console.log(`   ✅ 创建了 ${bookmarks.length} 个书签`)

    // ========== 4. 创建书签-标签关联 ==========
    console.log("\n🔗 关联书签和标签...")
    const bookmarkTags = [
      // React 文档 -> React, TypeScript
      { bookmarkId: bookmarks[0].id, tagId: tags[0].id },
      { bookmarkId: bookmarks[0].id, tagId: tags[2].id },
      // Next.js 文档 -> Next.js, React, TypeScript
      { bookmarkId: bookmarks[1].id, tagId: tags[1].id },
      { bookmarkId: bookmarks[1].id, tagId: tags[0].id },
      { bookmarkId: bookmarks[1].id, tagId: tags[2].id },
      // Tailwind -> CSS
      { bookmarkId: bookmarks[2].id, tagId: tags[6].id },
      // Radix UI -> React, CSS
      { bookmarkId: bookmarks[3].id, tagId: tags[0].id },
      { bookmarkId: bookmarks[3].id, tagId: tags[6].id },
      // Drizzle -> TypeScript, 数据库
      { bookmarkId: bookmarks[4].id, tagId: tags[2].id },
      { bookmarkId: bookmarks[4].id, tagId: tags[7].id },
      // Hono -> TypeScript, Node.js
      { bookmarkId: bookmarks[5].id, tagId: tags[2].id },
      { bookmarkId: bookmarks[5].id, tagId: tags[3].id },
      // PostgreSQL -> 数据库
      { bookmarkId: bookmarks[6].id, tagId: tags[7].id },
      // Vercel AI SDK -> AI, TypeScript
      { bookmarkId: bookmarks[7].id, tagId: tags[5].id },
      { bookmarkId: bookmarks[7].id, tagId: tags[2].id },
      // OpenAI -> AI, Python
      { bookmarkId: bookmarks[8].id, tagId: tags[5].id },
      { bookmarkId: bookmarks[8].id, tagId: tags[4].id },
      // Hugging Face -> AI, Python, 开源
      { bookmarkId: bookmarks[9].id, tagId: tags[5].id },
      { bookmarkId: bookmarks[9].id, tagId: tags[4].id },
      { bookmarkId: bookmarks[9].id, tagId: tags[9].id },
      // Dan Abramov -> React, 开源
      { bookmarkId: bookmarks[13].id, tagId: tags[0].id },
      { bookmarkId: bookmarks[13].id, tagId: tags[9].id },
    ]
    await db.insert(bookmarkTag).values(bookmarkTags)
    console.log(`   ✅ 创建了 ${bookmarkTags.length} 个关联`)

    // ========== 5. 创建聊天记录 ==========
    console.log("\n💬 创建聊天记录...")
    const chats = [
      { id: nanoid(), userId, title: "如何优化 React 性能？" },
      { id: nanoid(), userId, title: "Next.js App Router 最佳实践" },
      { id: nanoid(), userId, title: "帮我设计数据库 Schema" },
    ]
    await db.insert(chat).values(chats)
    console.log(`   ✅ 创建了 ${chats.length} 个聊天`)

    // ========== 6. 创建聊天消息 ==========
    console.log("\n📝 创建聊天消息...")
    const messages = [
      // 聊天 1: React 性能优化
      {
        id: nanoid(),
        chatId: chats[0].id,
        role: "user",
        parts: [{ type: "text", text: "React 应用渲染很慢，有什么优化方法？" }],
      },
      {
        id: nanoid(),
        chatId: chats[0].id,
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "React 性能优化有几个关键方向：\n\n1. **使用 React.memo** 避免不必要的重渲染\n2. **useMemo / useCallback** 缓存计算结果和回调\n3. **代码分割** 使用 React.lazy 和 Suspense\n4. **虚拟列表** 处理大量数据渲染\n5. **状态下沉** 将状态放到最近的需要它的组件",
          },
        ],
      },
      {
        id: nanoid(),
        chatId: chats[0].id,
        role: "user",
        parts: [{ type: "text", text: "React.memo 和 useMemo 有什么区别？" }],
      },
      {
        id: nanoid(),
        chatId: chats[0].id,
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "**React.memo** 是一个高阶组件，用于包裹整个组件，当 props 没有变化时跳过重渲染。\n\n**useMemo** 是一个 Hook，用于缓存组件内部的计算结果，避免每次渲染都重新计算。\n\n简单来说：React.memo 优化的是「是否重渲染组件」，useMemo 优化的是「组件内部的计算」。",
          },
        ],
      },
      // 聊天 2: Next.js 最佳实践
      {
        id: nanoid(),
        chatId: chats[1].id,
        role: "user",
        parts: [{ type: "text", text: "Next.js App Router 有哪些最佳实践？" }],
      },
      {
        id: nanoid(),
        chatId: chats[1].id,
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Next.js App Router 最佳实践：\n\n1. **默认使用 Server Components**，只在需要交互时使用 Client Components\n2. **数据获取放在服务端**，利用 RSC 直接访问数据库\n3. **合理使用 loading.tsx 和 error.tsx** 处理加载和错误状态\n4. **使用 Parallel Routes** 实现复杂布局\n5. **利用 Route Groups** 组织代码结构",
          },
        ],
      },
      // 聊天 3: 数据库设计
      {
        id: nanoid(),
        chatId: chats[2].id,
        role: "user",
        parts: [{ type: "text", text: "帮我设计一个书签管理系统的数据库 Schema" }],
      },
      {
        id: nanoid(),
        chatId: chats[2].id,
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "书签管理系统的核心表设计：\n\n- **user**: 用户表\n- **folder**: 文件夹表，支持 emoji 图标\n- **bookmark**: 书签表，支持链接、笔记等类型\n- **tag**: 标签表，支持自定义颜色\n- **bookmark_tag**: 书签-标签多对多关联表\n\n关键设计决策：\n1. 使用 text 类型的 nanoid 作为主键\n2. 级联删除保证数据一致性\n3. 书签支持 metadata JSON 字段扩展",
          },
        ],
      },
    ]
    await db.insert(message).values(messages)
    console.log(`   ✅ 创建了 ${messages.length} 条消息`)

    console.log("\n🎉 种子数据创建完成！")
    console.log(`   📁 ${folders.length} 个文件夹`)
    console.log(`   🔖 ${bookmarks.length} 个书签`)
    console.log(`   🏷️  ${tags.length} 个标签`)
    console.log(`   🔗 ${bookmarkTags.length} 个书签-标签关联`)
    console.log(`   💬 ${chats.length} 个聊天`)
    console.log(`   📝 ${messages.length} 条消息`)
  } catch (error) {
    console.error("❌ 种子数据创建失败:", error)
    process.exit(1)
  }
}

seed()
