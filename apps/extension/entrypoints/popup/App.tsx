import { detectPlatform, hasPlatformIcon, PLATFORM_CONFIG } from "@repo/icons/web"
import { useEffect, useState } from "react"
import {
  type DeviceCodeResponse,
  getCachedUser,
  getInjectionPlatformSettings,
  getServerUrl,
  getSession,
  type InjectionPlatformSettings,
  removeCachedUser,
  requestDeviceCode,
  SUPPORTED_INJECTION_PLATFORMS,
  type SupportedInjectionPlatform,
  setCachedUser,
  setInjectionPlatformSettings,
  setServerUrl,
  signOut,
} from "../../lib/auth-client"
import "./App.css"

interface User {
  id: string
  name: string
  email: string
}
type Status = "idle" | "loading" | "success" | "error"
type LoginStep = "idle" | "requesting" | "polling" | "error"
const WWW_PREFIX_REGEX = /^www\./
const TRAILING_SLASH_REGEX = /\/+$/
const INJECTION_PLATFORM_OPTIONS: SupportedInjectionPlatform[] = [...SUPPORTED_INJECTION_PLATFORMS]

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [page, setPage] = useState<"main" | "settings">("main")

  const handleLogout = () => {
    setUser(null)
    setPage("main")
  }

  useEffect(() => {
    getCachedUser().then((cached) => {
      if (cached) {
        setUser(cached)
        setChecking(false)
      }

      getSession()
        .then((res) => {
          if (res.ok && res.data?.user) {
            setUser(res.data.user)
            setCachedUser(res.data.user)
          } else {
            setUser(null)
            removeCachedUser()
          }
        })
        .catch((_err) => {
          if (!cached) {
            setUser(null)
          }
        })
        .finally(() => setChecking(false))
    })
  }, [])

  if (checking) {
    return (
      <div className="app">
        <p className="status">检查登录状态...</p>
      </div>
    )
  }

  if (!user) {
    return <DeviceLoginForm />
  }

  if (page === "settings") {
    return <SettingsPage onBack={() => setPage("main")} onLogout={handleLogout} user={user} />
  }

  return <SavePage onSettings={() => setPage("settings")} />
}

function DeviceLoginForm() {
  const [server, setServer] = useState("")
  const [step, setStep] = useState<LoginStep>("idle")
  const [deviceData, setDeviceData] = useState<DeviceCodeResponse | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    getServerUrl().then(setServer)
  }, [])

  const startDeviceFlow = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep("requesting")
    setError("")

    const trimmed = server.replace(TRAILING_SLASH_REGEX, "")
    await setServerUrl(trimmed)

    try {
      // 请求设备码
      const codeResp = await requestDeviceCode()
      setDeviceData(codeResp)

      // 在新标签页打开验证页面
      await browser.tabs.create({ url: codeResp.verification_uri_complete })

      // 通知 background 开始轮询（popup 关闭后仍继续）
      setStep("polling")
      browser.runtime.sendMessage({
        type: "START_DEVICE_POLL",
        deviceCode: codeResp.device_code,
        expiresIn: codeResp.expires_in,
        interval: codeResp.interval,
      })
    } catch (err) {
      setStep("error")
      setError(String(err))
    }
  }

  // 输入服务器地址并发起登录
  if (step === "idle" || step === "requesting") {
    return (
      <div className="app">
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>MindPocket</h1>
        <form className="form" onSubmit={startDeviceFlow}>
          <input
            className="input"
            onChange={(e) => setServer(e.target.value)}
            placeholder="服务器地址"
            required
            type="url"
            value={server}
          />
          <button className="btn btn-primary" disabled={step === "requesting"} type="submit">
            {step === "requesting" ? "请求中..." : "登录"}
          </button>
        </form>
      </div>
    )
  }

  // 显示验证码，提示用户在浏览器中完成授权
  if (step === "polling" && deviceData) {
    return (
      <div className="app">
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>MindPocket</h1>
        <div className="device-code-card">
          <p className="device-code-label">用户验证码</p>
          <p className="device-code-value">{deviceData.user_code}</p>
        </div>
        <p className="status">
          已在浏览器中打开验证页面。
          <br />
          授权完成后重新打开此弹窗即可。
        </p>
      </div>
    )
  }

  // 错误状态
  return (
    <div className="app">
      <h1 style={{ fontSize: 16, fontWeight: 600 }}>MindPocket</h1>
      {error && <p className="error">{error}</p>}
      <button
        className="btn btn-primary"
        onClick={() => {
          setStep("idle")
          setDeviceData(null)
          setError("")
        }}
        type="button"
      >
        重试
      </button>
    </div>
  )
}

function SavePage({ onSettings }: { onSettings: () => void }) {
  const [pageInfo, setPageInfo] = useState<{
    url: string
    title: string
    platform: string | null
  } | null>(null)

  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.url && tab.title) {
        setPageInfo({
          url: tab.url,
          title: tab.title,
          platform: detectPlatform(tab.url),
        })
      }
    })
  }, [])

  // 发送消息后不等待结果，后台脚本会通过浏览器通知告知结果
  const handleSave = () => {
    browser.runtime.sendMessage({ type: "SAVE_PAGE" })
    window.close()
  }

  return (
    <div className="app">
      <div className="header">
        <h1>MindPocket</h1>
        <div className="header-actions">
          <button className="settings-btn" onClick={onSettings} title="设置" type="button">
            <svg
              className="lucide lucide-settings-icon lucide-settings"
              fill="none"
              height="20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>设置</title>
              <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>
      {pageInfo && (
        <div className="page-info">
          {hasPlatformIcon(pageInfo.platform) ? (
            (() => {
              const config = PLATFORM_CONFIG[pageInfo.platform]
              const Icon = config.icon
              return (
                <span className="platform-badge">
                  <Icon style={{ width: 14, height: 14, color: config.colorHex }} />
                  <span>{config.label}</span>
                </span>
              )
            })()
          ) : (
            <span className="platform-badge">
              <span>{new URL(pageInfo.url).hostname.replace(WWW_PREFIX_REGEX, "")}</span>
            </span>
          )}
          <p className="page-title">{pageInfo.title}</p>
        </div>
      )}
      <button className="btn btn-save" onClick={handleSave} type="button">
        收藏此页面
      </button>
    </div>
  )
}

function SettingsPage({
  onBack,
  onLogout,
  user,
}: {
  onBack: () => void
  onLogout: () => void
  user: User
}) {
  const [serverUrl, setServerUrlState] = useState("")
  const [platformSettings, setPlatformSettings] = useState<InjectionPlatformSettings | null>(null)
  const [status, setStatus] = useState<Status>("idle")

  useEffect(() => {
    Promise.all([getServerUrl(), getInjectionPlatformSettings()]).then(
      ([savedServerUrl, savedSettings]) => {
        setServerUrlState(savedServerUrl)
        setPlatformSettings(savedSettings)
      }
    )
  }, [])

  const handlePlatformToggle = (platform: SupportedInjectionPlatform, checked: boolean) => {
    setPlatformSettings((current) => (current ? { ...current, [platform]: checked } : current))
  }

  const handleSave = async () => {
    const trimmed = serverUrl.replace(TRAILING_SLASH_REGEX, "")
    if (!platformSettings) {
      return
    }

    setStatus("loading")
    await setServerUrl(trimmed)
    await setInjectionPlatformSettings(platformSettings)
    setServerUrlState(trimmed)
    setStatus("success")
    setTimeout(() => setStatus("idle"), 1500)
  }

  return (
    <div className="app">
      <div className="header">
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>设置</h1>
        <button className="settings-btn" onClick={onBack} type="button">
          ← 返回
        </button>
      </div>
      <div className="settings-section">
        <p className="settings-label">账号</p>
        <p className="settings-account">{user.email}</p>
      </div>
      <div className="settings-section">
        <label className="settings-label" htmlFor="server-url">
          服务器地址
        </label>
        <input
          className="input"
          id="server-url"
          onChange={(e) => setServerUrlState(e.target.value)}
          placeholder="http://127.0.0.1:3000"
          value={serverUrl}
        />
      </div>
      <div className="settings-section">
        <p className="settings-label">平台按钮开关</p>
        <div className="settings-switches">
          {platformSettings &&
            INJECTION_PLATFORM_OPTIONS.map((platform) => {
              const config = PLATFORM_CONFIG[platform]
              return (
                <label className="switch-row" htmlFor={`platform-${platform}`} key={platform}>
                  <span>{config.label}</span>
                  <span className="switch">
                    <input
                      checked={platformSettings[platform]}
                      id={`platform-${platform}`}
                      onChange={(e) => handlePlatformToggle(platform, e.target.checked)}
                      type="checkbox"
                    />
                    <span className="switch-slider" />
                  </span>
                </label>
              )
            })}
        </div>
      </div>
      <button
        className="btn btn-primary"
        disabled={status === "loading" || !platformSettings}
        onClick={handleSave}
        type="button"
      >
        {status === "success" ? "已保存" : "保存"}
      </button>
      <div className="settings-actions">
        <button
          className="logout-btn"
          onClick={async () => {
            await signOut()
            onLogout()
          }}
          type="button"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}

export default App
