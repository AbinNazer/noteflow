"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useNoteStore } from "@/store/noteStore"

export default function LoginPage() {
  const [email, setEmail] = useState("demo@noteflow.app")
  const [password, setPassword] = useState("demo1234")
  const [mode, setMode] = useState<"login" | "register">("login")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const setToken = useNoteStore((s) => s.setToken)
  const router = useRouter()

  const submit = async () => {
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      setToken(data.token)
      router.push("/dashboard")
    } catch { setError("Network error"); setLoading(false) }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0d0b", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={{ width: "360px", background: "#151210", border: "1px solid #2a2520", borderRadius: "16px", padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✦</div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "1.5rem", color: "#f0ede8", margin: 0 }}>NoteFlow</h1>
          <p style={{ fontSize: "13px", color: "#5a5550", marginTop: "4px" }}>{mode === "login" ? "Sign in to continue" : "Create your account"}</p>
        </div>
        {error && <div style={{ background: "#3a1a1a", border: "1px solid #6a2a2a", borderRadius: "8px", padding: "10px", fontSize: "13px", color: "#f08080", marginBottom: "1rem" }}>{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input style={{ background: "#1e1a16", border: "1px solid #2a2520", borderRadius: "8px", padding: "10px 12px", color: "#c4bfb8", fontSize: "14px", outline: "none" }}
            type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          <input style={{ background: "#1e1a16", border: "1px solid #2a2520", borderRadius: "8px", padding: "10px 12px", color: "#c4bfb8", fontSize: "14px", outline: "none" }}
            type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          <button onClick={submit} disabled={loading}
            style={{ background: "#c9a96e", color: "#1a1510", border: "none", borderRadius: "8px", padding: "11px", fontSize: "14px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "4px" }}>
            {loading ? "…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "13px", color: "#5a5550" }}>
          {mode === "login" ? "No account? " : "Have an account? "}
          <button onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{ background: "none", border: "none", color: "#c9a96e", cursor: "pointer", fontSize: "13px" }}>
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </div>
        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #1e1c18", fontSize: "11px", color: "#4a4540", textAlign: "center" }}>
          NOTEFLOW
        </div>
      </div>
    </div>
  )
}
