import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import BackgroundParticles from "../components/BackgroundParticles";
import './Login.css'

const Register = () => {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [isUsernameValid, setIsUsernameValid] = useState(false)
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    const validateUsername = async () => {
      if (!username) {
        setIsUsernameValid(false);
        setIsUsernameAvailable(null);
        return;
      }
      const regex = /^[a-z0-9_.]{3,30}$/;
      if (!regex.test(username)) {
        setIsUsernameValid(false);
        setIsUsernameAvailable(null);
        return;
      }
      setIsUsernameValid(true);
      setCheckingUsername(true);
      
      const { data } = await supabase.from('profiles').select('id').ilike('username', username).maybeSingle();
      
      setIsUsernameAvailable(!data);
      setCheckingUsername(false);
    };

    const timer = setTimeout(() => {
      validateUsername();
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
        setMessage("Passwords do not match");
        return;
    }

    if (!isUsernameValid) {
        setMessage("Username format is invalid. Must be 3-30 lowercase letters, numbers, underscores, or periods.");
        return;
    }
    if (isUsernameAvailable === false) {
        setMessage("Username already taken.");
        return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
          username_is_auto_generated: false
        }
      }
    })

    if (error) {
      if (error.message.includes("23505") || error.message.toLowerCase().includes("unique constraint")) {
        setMessage("Username already taken")
      } else {
        setMessage(error.message)
      }
    } else {
      setMessage("Registration successful 🎉 Please check your email to verify.")
      setTimeout(() => navigate("/login"), 3000)
    }
  }

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

  return (
    <div className="login-page" style={{ position: "relative", overflow: "hidden" }}>
      <BackgroundParticles />
      <div className="login-card animate-slideUp" style={{ position: "relative", zIndex: 1 }}>

        <div className="login-header">
          <h1>Create Account</h1>
          <p>Join Connect and start building</p>
        </div>

        <div className="social-login">
          <button 
            className="social-btn google"
            onClick={handleGoogleLogin}
            type="button"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" />
            Continue with Google
          </button>
        </div>

        <div className="divider">
          <span>OR SIGN UP WITH EMAIL</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">

          <div className="input-group">
            <span className="input-icon">👤</span>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div className="input-group" style={{ marginBottom: '4px' }}>
              <span className="input-icon">@</span>
              <input
                type="text"
                placeholder="Username (e.g., alex_dev)"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
              />
              {checkingUsername && <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>...</span>}
              {!checkingUsername && isUsernameValid && isUsernameAvailable === true && <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span>}
            </div>
            {!isUsernameValid && username.length > 0 && <div style={{ color: '#EF4444', fontSize: '12px' }}>Must be 3-30 chars (letters, numbers, _, .)</div>}
            {isUsernameValid && isUsernameAvailable === false && <div style={{ color: '#EF4444', fontSize: '12px' }}>Username already taken</div>}
          </div>

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

          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn" style={{ width: '100%', display: 'block' }}>
            Create Account
          </button>
        </form>

        <p style={{ color: "red", marginTop: "10px" }}>{message}</p>

        <p className="signup-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>

      </div>
    </div>
  )
}

export default Register
