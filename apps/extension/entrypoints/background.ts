interface SavePayload {
  url: string
  html: string
  title?: string
}

function isSavePayload(value: unknown): value is SavePayload {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.url === "string" &&
    typeof candidate.html === "string" &&
    (typeof candidate.title === "string" || typeof candidate.title === "undefined")
  )
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SAVE_PAGE") {
      // 从 sender 获取来源 tab，站内按钮和 popup 都能用
      const senderTabId = sender.tab?.id
      handleSavePage(message.payload, senderTabId).then(sendResponse)
      return true
    }
    if (message.type === "START_DEVICE_POLL") {
      handleDevicePoll(message.deviceCode, message.expiresIn, message.interval).then(sendResponse)
      return true
    }
  })
})

// 通过 content script 在页面内显示 toast 通知
async function showToast(tabId: number, title: string, message: string, type: "success" | "error") {
  try {
    await browser.tabs.sendMessage(tabId, { type: "SHOW_TOAST", title, message, toastType: type })
  } catch (err) {
    console.error("[MindPocket] Toast 发送失败:", err)
  }
}

async function requestPageContent(): Promise<{ payload: SavePayload; tabId: number }> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    throw new Error("No active tab")
  }

  const response = await browser.tabs.sendMessage(tab.id, { type: "GET_PAGE_CONTENT" })
  if (!isSavePayload(response)) {
    throw new Error("Failed to get page content")
  }

  return { payload: response, tabId: tab.id }
}

async function handleSavePage(payload?: unknown, senderTabId?: number) {
  try {
    let savePayload: SavePayload
    let tabId = senderTabId

    if (isSavePayload(payload)) {
      savePayload = payload
    } else {
      const result = await requestPageContent()
      savePayload = result.payload
      // popup 触发时 senderTabId 可能无效，优先用 requestPageContent 获取的 tabId
      tabId = result.tabId
    }

    const { saveBookmark } = await import("../lib/auth-client")
    const result = await saveBookmark({
      url: savePayload.url,
      html: savePayload.html,
      title: savePayload.title,
    })

    if (!result.ok) {
      const error = result.data?.error || "Save failed"
      if (tabId) {
        await showToast(tabId, "保存失败", error, "error")
      }
      return { success: false, error }
    }

    if (tabId) {
      await showToast(
        tabId,
        "已收藏",
        result.data?.title || savePayload.title || "页面已保存",
        "success"
      )
    }
    return { success: true, data: result.data }
  } catch (err) {
    // 异常时尝试获取 tabId 来显示 toast
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        await showToast(tab.id, "保存失败", String(err), "error")
      }
    } catch {
      /* ignore */
    }
    return { success: false, error: String(err) }
  }
}

// 后台轮询设备授权，popup 关闭后仍然继续
async function handleDevicePoll(deviceCode: string, expiresIn: number, interval: number) {
  try {
    const { pollDeviceToken, completeDeviceAuth } = await import("../lib/auth-client")
    const timeoutAt = Date.now() + expiresIn * 1000
    let intervalMs = interval * 1000

    while (Date.now() < timeoutAt) {
      await new Promise((r) => setTimeout(r, intervalMs))
      const result = await pollDeviceToken(deviceCode, intervalMs)

      if (result.status === "pending") {
        continue
      }
      if (result.status === "slow_down") {
        intervalMs = result.intervalMs
        continue
      }

      // 授权成功，持久化 token 和用户信息
      const user = await completeDeviceAuth(result.accessToken)
      return { success: true, user }
    }

    return { success: false, error: "验证码已过期" }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
