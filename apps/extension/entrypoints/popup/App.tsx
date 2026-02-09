import { useEffect, useState } from "react"
import {
  getCachedUser,
  getSession,
  removeCachedUser,
  setCachedUser,
  signIn,
  signOut,
} from "../../lib/auth-client"
import { detectPlatform, PLATFORM_CONFIG } from "../../lib/platform-icons"
import "./App.css"

interface User {
  id: string
  name: string
  email: string
}
type Status = "idle" | "loading" | "success" | "error"

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)

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
        .catch((err) => {
          console.error("[MindPocket] getSession error:", err)
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
    return <LoginForm onLogin={setUser} />
  }

  return <SavePage onLogout={() => setUser(null)} user={user} />
}

function LoginForm({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setError("")

    try {
      const res = await signIn(email, password)
      console.log("[MindPocket] signIn res:", JSON.stringify(res, null, 2))
      if (res.ok && res.data?.user) {
        setStatus("success")
        onLogin(res.data.user)
      } else {
        setStatus("error")
        setError(`登录失败 [${res.status}]: ${JSON.stringify(res.data)}`)
      }
    } catch (err) {
      console.error("[MindPocket] signIn catch:", err)
      setStatus("error")
      setError(`请求异常: ${err}`)
    }
  }

  return (
    <div className="app">
      <h1 style={{ fontSize: 16, fontWeight: 600 }}>MindPocket</h1>
      <form className="form" onSubmit={handleSubmit}>
        <input
          className="input"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱"
          required
          type="email"
          value={email}
        />
        <input
          className="input"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码"
          required
          type="password"
          value={password}
        />
        <button className="btn btn-primary" disabled={status === "loading"} type="submit">
          {status === "loading" ? "登录中..." : "登录"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}

function SavePage({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")
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

  const handleSave = async () => {
    setStatus("loading")
    setMessage("")

    const res = await browser.runtime.sendMessage({ type: "SAVE_PAGE" })
    if (res?.success) {
      setStatus("success")
      setMessage(`已保存: ${res.data?.title || "页面"}`)
    } else {
      setStatus("error")
      setMessage(res?.error || "保存失败")
    }
  }

  return (
    <div className="app">
      <div className="header">
        <h1>MindPocket</h1>
        <button
          className="logout-btn"
          onClick={async () => {
            await signOut()
            onLogout()
          }}
          type="button"
        >
          退出
        </button>
      </div>
      <p className="user-info">{user.email}</p>
      {pageInfo && (
        <div className="page-info">
          {pageInfo.platform && PLATFORM_CONFIG[pageInfo.platform] ? (
            (() => {
              const config = PLATFORM_CONFIG[pageInfo.platform]
              const Icon = config.icon
              return (
                <span className="platform-badge">
                  <Icon style={{ width: 14, height: 14, color: config.color }} />
                  <span>{config.label}</span>
                </span>
              )
            })()
          ) : (
            <span className="platform-badge">
              <span>{new URL(pageInfo.url).hostname.replace(/^www\./, "")}</span>
            </span>
          )}
          <p className="page-title">{pageInfo.title}</p>
        </div>
      )}
      <button
        className="btn btn-save"
        disabled={status === "loading"}
        onClick={handleSave}
        type="button"
      >
        {status === "loading" ? "保存中..." : "收藏此页面"}
      </button>
      {status === "success" && <p className="success">{message}</p>}
      {status === "error" && <p className="error">{message}</p>}
    </div>
  )
}

export default App
