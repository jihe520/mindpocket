import {
  getInjectionPlatformSettings,
  SUPPORTED_INJECTION_PLATFORMS,
  type SupportedInjectionPlatform,
} from "../lib/auth-client"
import { injectButtonsIntoTweets } from "../lib/content/platforms/x"
import { injectButtonsIntoXiaohongshuNotes } from "../lib/content/platforms/xiaohongshu"
import { injectButtonsIntoZhihuAnswers } from "../lib/content/platforms/zhihu"
import { buildFallbackPayload } from "../lib/content/shared"

const PLATFORM_INJECTORS: Record<SupportedInjectionPlatform, () => void> = {
  twitter: injectButtonsIntoTweets,
  zhihu: injectButtonsIntoZhihuAnswers,
  xiaohongshu: injectButtonsIntoXiaohongshuNotes,
}

async function injectButtons() {
  const settings = await getInjectionPlatformSettings()

  for (const platform of SUPPORTED_INJECTION_PLATFORMS) {
    if (!settings[platform]) {
      continue
    }

    PLATFORM_INJECTORS[platform]()
  }
}

function scheduleButtonInjection() {
  injectButtons().catch((error) => {
    console.error("[MindPocket] injectButtons error:", error)
  })
}

// 页面内 toast 通知
function showPageToast(title: string, message: string, type: "success" | "error") {
  // 移除已有的 toast
  const existing = document.querySelector("mindpocket-toast-host")
  if (existing) {
    existing.remove()
  }

  const host = document.createElement("mindpocket-toast-host")
  const shadow = host.attachShadow({ mode: "open" })

  const isSuccess = type === "success"

  const style = document.createElement("style")
  style.textContent = `
    .toast {
      position: fixed;
      top: 40px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      border-radius: 12px;
      background: ${isSuccess ? "#f0fdf4" : "#fef2f2"};
      border: 1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"};
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      color: #1a1a1a;
      z-index: 2147483647;
      opacity: 0;
      animation: mindpocket-toast-in 0.3s ease forwards;
      max-width: 400px;
    }
    .toast.hiding {
      animation: mindpocket-toast-out 0.3s ease forwards;
    }
    .icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .title {
      font-weight: 600;
      font-size: 14px;
    }
    .message {
      font-size: 13px;
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    @keyframes mindpocket-toast-in {
      from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes mindpocket-toast-out {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
  `

  const toast = document.createElement("div")
  toast.className = "toast"

  // 图标
  const iconSvg = isSuccess
    ? `<svg class="icon" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="#22c55e"/>
        <path d="M6 10.5l2.5 2.5L14 7.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    : `<svg class="icon" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="#ef4444"/>
        <path d="M7 7l6 6M13 7l-6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>`

  toast.innerHTML = `
    ${iconSvg}
    <div class="content">
      <div class="title">${title}</div>
      ${message ? `<div class="message">${message}</div>` : ""}
    </div>
  `

  shadow.appendChild(style)
  shadow.appendChild(toast)
  document.body.appendChild(host)

  // 2.5 秒后自动消失
  setTimeout(() => {
    toast.classList.add("hiding")
    setTimeout(() => host.remove(), 300)
  }, 2500)
}

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "GET_PAGE_CONTENT") {
        sendResponse(buildFallbackPayload())
      }
      if (message.type === "SHOW_TOAST") {
        showPageToast(message.title, message.message, message.toastType)
      }
      return true
    })

    const observer = new MutationObserver(() => {
      scheduleButtonInjection()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    scheduleButtonInjection()
  },
})
