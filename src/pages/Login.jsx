import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import BackgroundParticles from "../components/BackgroundParticles";
import ThemeToggle from "../components/ThemeToggle";
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [resetMsgType, setResetMsgType] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const navigate = useNavigate()

  // 🔐 Email Login
  const handleSubmit = async (e) => {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Login successful 🎉")
      navigate("/home")
    }
  }

  // 🔥 Google Login
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    })

    if (error) {
      setMessage(error.message)
    }
  }

  // 🔑 Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setResetMsg('')
    if (!resetEmail.trim()) {
      setResetMsgType('error')
      setResetMsg('Please enter your email address.')
      return
    }
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/#/reset-password`
    })
    setResetLoading(false)
    if (error) {
      setResetMsgType('error')
      setResetMsg(error.message)
    } else {
      setResetMsgType('success')
      setResetMsg('Password reset link sent to your email. Check your inbox.')
    }
  }

  const modalStyles = `
    .forgot-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(4px);
      animation: forgotFadeIn 0.2s ease;
    }
    @keyframes forgotFadeIn { from { opacity: 0; } to { opacity: 1; } }
    .forgot-modal {
      background: #1A1A1F;
      border: 1px solid #2A2A2F;
      border-radius: 16px;
      padding: 36px 32px;
      width: 100%;
      max-width: 400px;
      margin: 16px;
      animation: forgotSlideUp 0.25s ease;
    }
    @keyframes forgotSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .forgot-title {
      color: white; font-size: 20px; font-weight: 700; margin: 0 0 6px; font-family: 'Inter', sans-serif;
    }
    .forgot-subtitle {
      color: #A1A1AA; font-size: 13px; margin: 0 0 24px; font-family: 'Inter', sans-serif;
    }
    .forgot-input {
      width: 100%; background: #0F0F11; border: 1px solid #2A2A2F; border-radius: 10px;
      padding: 12px 16px; color: #F4F4F5; font-size: 14px; font-family: 'Inter', sans-serif;
      outline: none; box-sizing: border-box; transition: border-color 0.2s; margin-bottom: 16px;
    }
    .forgot-input:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
    .forgot-input::placeholder { color: #52525B; }
    .forgot-send-btn {
      width: 100%; background: linear-gradient(135deg, #7C3AED, #5B21B6); color: white;
      border: none; border-radius: 10px; padding: 13px; font-size: 14px; font-weight: 700;
      cursor: pointer; font-family: 'Inter', sans-serif; transition: opacity 0.2s;
    }
    .forgot-send-btn:hover { opacity: 0.9; }
    .forgot-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .forgot-cancel {
      width: 100%; background: transparent; color: #A1A1AA; border: 1px solid #2A2A2F;
      border-radius: 10px; padding: 11px; font-size: 14px; cursor: pointer;
      font-family: 'Inter', sans-serif; margin-top: 10px; transition: border-color 0.2s, color 0.2s;
    }
    .forgot-cancel:hover { border-color: #7C3AED; color: white; }
    .forgot-msg {
      margin-top: 14px; padding: 10px 14px; border-radius: 8px; font-size: 13px;
      font-weight: 500; font-family: 'Inter', sans-serif;
    }
    .forgot-msg.error { background: rgba(239,68,68,0.1); color: #F87171; border: 1px solid rgba(239,68,68,0.3); }
    .forgot-msg.success { background: rgba(34,197,94,0.1); color: #4ADE80; border: 1px solid rgba(34,197,94,0.3); }
  `

  return (
    <div className="login-page" style={{ position: "relative", overflow: "hidden" }}>
      <ThemeToggle />
      <style>{modalStyles}</style>
      <BackgroundParticles />
      <div className="login-card animate-slideUp" style={{ position: "relative", zIndex: 1 }}>

        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Login to continue to Connect</p>
        </div>

        {/* 🔥 Social Login */}
        <div className="social-login">
          <button 
            className="social-btn google"
            onClick={handleGoogleLogin}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" />
            Continue with Google
          </button>
        </div>

        <div className="divider">
          <span>or login with email</span>
        </div>

        {/* 🔐 Email Form */}
        <form onSubmit={handleSubmit} className="login-form">

          <div className="input-group">
            <span className="input-icon">✉️</span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="forgot-link">
            <button
              type="button"
              onClick={() => { setShowForgot(true); setResetMsg(''); setResetEmail(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C3AED', fontSize: '13px', padding: 0, fontFamily: 'Inter, sans-serif' }}
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className="btn btn-primary login-btn">
            Login
          </button>
        </form>

        {/* 🔥 Message */}
        <p style={{ color: "red", marginTop: "10px" }}>{message}</p>

        <p className="signup-link">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>

      </div>

      {/* 🔑 Forgot Password Modal */}
      {showForgot && (
        <div
          className="forgot-overlay"
          onClick={(e) => { if (e.target.classList.contains('forgot-overlay')) setShowForgot(false) }}
        >
          <div className="forgot-modal">
            <h2 className="forgot-title">Reset Password</h2>
            <p className="forgot-subtitle">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleForgotPassword}>
              <input
                className="forgot-input"
                type="email"
                placeholder="your@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                autoFocus
              />
              <button className="forgot-send-btn" type="submit" disabled={resetLoading}>
                {resetLoading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
            <button className="forgot-cancel" onClick={() => setShowForgot(false)}>
              Cancel
            </button>
            {resetMsg && (
              <div className={`forgot-msg ${resetMsgType}`}>{resetMsg}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Login