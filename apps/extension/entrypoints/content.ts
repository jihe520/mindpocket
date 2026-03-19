interface SavePayload {
  url: string
  html: string
  title?: string
}

const CANONICAL_STATUS_PATH_REGEX = /^\/[^/]+\/status\/\d+$/
const WEB_STATUS_PATH_REGEX = /^\/i\/web\/status\/\d+$/

function findTweetRoot(bookmarkBtn: Element): HTMLElement | null {
  const tweet =
    bookmarkBtn.closest('article[data-testid="tweet"]') ??
    bookmarkBtn.closest('article[role="article"]')

  return tweet instanceof HTMLElement ? tweet : null
}

function toAbsoluteUrl(href: string | null): string | null {
  if (!href) {
    return null
  }

  try {
    return new URL(href, window.location.origin).toString()
  } catch {
    return null
  }
}

function isCanonicalStatusPath(pathname: string): boolean {
  return CANONICAL_STATUS_PATH_REGEX.test(pathname) || WEB_STATUS_PATH_REGEX.test(pathname)
}

function findCanonicalStatusLink(tweetRoot: HTMLElement): string | null {
  const timeHref = tweetRoot
    .querySelector("time")
    ?.closest('a[href*="/status/"]')
    ?.getAttribute("href")

  const absoluteTimeHref = toAbsoluteUrl(timeHref ?? null)
  if (absoluteTimeHref) {
    return absoluteTimeHref
  }

  const links = tweetRoot.querySelectorAll('a[href*="/status/"]')
  for (const link of links) {
    if (!(link instanceof HTMLAnchorElement)) {
      continue
    }

    const href = toAbsoluteUrl(link.getAttribute("href"))
    if (!href) {
      continue
    }

    const url = new URL(href)
    if (isCanonicalStatusPath(url.pathname)) {
      return url.toString()
    }
  }

  return null
}

function extractTweetPermalink(tweetRoot: HTMLElement): string {
  return findCanonicalStatusLink(tweetRoot) ?? window.location.href
}

function extractTweetTitle(tweetRoot: HTMLElement): string {
  const author =
    tweetRoot.querySelector('[data-testid="User-Name"] a[href^="/"]')?.textContent?.trim() ?? ""
  const text =
    tweetRoot
      .querySelector('[data-testid="tweetText"]')
      ?.textContent?.replace(/\s+/g, " ")
      .trim() ?? ""

  if (author && text) {
    return `${author}: ${text.slice(0, 80)}`
  }

  if (text) {
    return text.slice(0, 80)
  }

  return document.title
}

function extractTweetHtml(tweetRoot: HTMLElement): string {
  const clone = tweetRoot.cloneNode(true)
  if (!(clone instanceof HTMLElement)) {
    return tweetRoot.outerHTML
  }

  for (const node of clone.querySelectorAll(".mindpocket-host")) {
    node.remove()
  }

  return clone.outerHTML
}

function buildSavePayload(bookmarkBtn: Element): SavePayload {
  const tweetRoot = findTweetRoot(bookmarkBtn)
  if (!tweetRoot) {
    return {
      url: window.location.href,
      title: document.title,
      html: document.documentElement.outerHTML,
    }
  }

  return {
    url: extractTweetPermalink(tweetRoot),
    title: extractTweetTitle(tweetRoot),
    html: extractTweetHtml(tweetRoot),
  }
}

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    // 监听消息
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "GET_PAGE_CONTENT") {
        sendResponse({
          url: window.location.href,
          title: document.title,
          html: document.documentElement.outerHTML,
        })
      }
      return true
    })

    // 创建 MindPocket 按钮
    function createMindPocketButton(bookmarkBtn: Element) {
      const host = document.createElement("div")
      host.style.display = "inline-flex"
      host.style.alignItems = "center"
      host.style.verticalAlign = "middle"

      const shadow = host.attachShadow({ mode: "open" })

      // 创建按钮
      const btn = document.createElement("button")
      btn.className = "mindpocket-btn"
      btn.setAttribute("aria-label", "收藏到 MindPocket")
      btn.title = "收藏到 MindPocket"

      // MindPocket 图标
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M14 2a3 3 0 0 1 .054 6l-.218.653A4.507 4.507 0 0 1 15.89 11.5h1.319a2.5 2.5 0 1 1 0 2h-1.32a4.487 4.487 0 0 1-1.006 1.968l.704.704a2.5 2.5 0 1 1-1.414 1.414l-.934-.934A4.485 4.485 0 0 1 11.5 17a4.481 4.481 0 0 1-1.982-.46l-.871 1.046a3 3 0 1 1-1.478-1.35l.794-.954A4.48 4.48 0 0 1 7 12.5c0-.735.176-1.428.488-2.041l-.868-.724A2.5 2.5 0 1 1 7.9 8.2l.87.724a4.48 4.48 0 0 1 3.169-.902l.218-.654A3 3 0 0 1 14 2M6 18a1 1 0 1 0 0 2 1 1 0 0 0 0-2m10.5 0a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1m-5-8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5m8 2a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1m-14-5a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1M14 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
        </svg>
      `

      // 样式
      const style = document.createElement("style")
      style.textContent = `
        .mindpocket-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          padding: 0;
          margin-left: 4px;
          background: transparent;
          border: none;
          border-radius: 9999px;
          cursor: pointer;
          color: rgb(113, 118, 123);
          transition: color 0.2s, background-color 0.2s;
        }
        .mindpocket-btn:hover {
          color: rgb(29, 161, 242);
          background-color: rgba(29, 161, 242, 0.1);
        }
        .mindpocket-btn.saved {
          color: rgb(29, 161, 242);
        }
        .mindpocket-btn.saving {
          opacity: 0.5;
          cursor: wait;
        }
      `

      shadow.appendChild(style)
      shadow.appendChild(btn)

      // 点击事件
      btn.addEventListener("click", async (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (btn.classList.contains("saving")) {
          return
        }

        btn.classList.add("saving")

        try {
          const payload = buildSavePayload(bookmarkBtn)
          const res = await browser.runtime.sendMessage({ type: "SAVE_PAGE", payload })
          if (res?.success) {
            btn.classList.add("saved")
            btn.title = "已收藏到 MindPocket"
          } else {
            console.error("[MindPocket] Save failed:", res?.error)
          }
        } catch (err) {
          console.error("[MindPocket] Save error:", err)
        } finally {
          btn.classList.remove("saving")
        }
      })

      return host
    }

    // 查找并添加按钮到 Twitter 推文
    function injectButtons() {
      // 找到所有书签按钮
      const bookmarkButtons = document.querySelectorAll('[data-testid="bookmark"]')

      for (const bookmarkBtn of bookmarkButtons) {
        // 检查是否已经添加过 MindPocket 按钮
        const parent = bookmarkBtn.parentElement
        if (!parent) {
          continue
        }

        // 检查是否已经添加过按钮
        const existingBtn = parent.querySelector(".mindpocket-host")
        if (existingBtn) {
          continue
        }

        // 创建 MindPocket 按钮
        const mpBtn = createMindPocketButton(bookmarkBtn)
        mpBtn.className = "mindpocket-host"

        // 插入到书签按钮前面
        parent.insertBefore(mpBtn, bookmarkBtn)
      }
    }

    // 使用 MutationObserver 监听页面变化（Twitter 是 SPA）
    const observer = new MutationObserver(() => {
      // 每次 DOM 变化都尝试注入
      injectButtons()
    })

    // 开始观察
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // 初始注入
    injectButtons()
  },
})
