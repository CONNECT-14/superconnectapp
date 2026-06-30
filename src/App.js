import { useEffect, useState } from "react";
import { HashRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { supabase, wasRecoveryDetected, clearRecoveryFlag } from "./supabaseClient";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Following from "./pages/Following";
import Followers from "./pages/Followers"; 
import UserProfile from "./pages/UserProfile";
import ProjectPage from "./pages/ProjectPage";
import ProjectHub from "./pages/ProjectHub";
import ResetPassword from "./pages/ResetPassword";
import ExplorePage from "./pages/ExplorePage";
import PostDetail from "./pages/PostDetail";

// Components
import Sidebar from "./components/Sidebar";
import TopProgressBar from "./components/TopProgressBar";

// Pages where navbar should NOT appear
const NO_NAVBAR_ROUTES = ["/", "/login", "/register", "/reset-password"];

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const showNavbar = !NO_NAVBAR_ROUTES.includes(location.pathname);

  // Show a loading overlay while Supabase handles the initial OAuth redirect hash
  const [isLoadingAuth, setIsLoadingAuth] = useState(
    window.location.hash.includes("access_token=")
  );

  useEffect(() => {
    // Local flag shared by both event handlers in this closure.
    // This prevents SIGNED_IN from overriding PASSWORD_RECOVERY in the
    // same event-loop tick (React hasn't re-rendered yet, so location.pathname is stale).
    let isRecovery = false;

    // Check 1: Was recovery detected at module-load time (before React mounted)?
    if (wasRecoveryDetected()) {
      isRecovery = true;
      navigate("/reset-password");
      setIsLoadingAuth(false);
    }

    // Check 2: Does the URL hash still contain recovery tokens?
    if (!isRecovery && window.location.hash.includes('type=recovery')) {
      isRecovery = true;
      navigate("/reset-password");
      setIsLoadingAuth(false);
    }

    // Pages that should redirect to /home after a successful sign-in.
    // All other app pages (profile, explore, project, etc.) must stay as-is on refresh.
    const PUBLIC_AUTH_ROUTES = ["/", "/login", "/register"];

    // Check initial session right away for immediate navigation (fixes OAuth redirect delay)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && PUBLIC_AUTH_ROUTES.includes(location.pathname)) {
        navigate("/home");
      }
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        isRecovery = true;
        navigate("/reset-password");
        setIsLoadingAuth(false);
        return;
      }
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        // If we're in a recovery flow, DO NOT redirect to /home.
        const currentUrl = window.location.href;
        if (
          isRecovery ||
          location.pathname === "/reset-password" ||
          currentUrl.includes("reset-password") ||
          currentUrl.includes("type=recovery")
        ) {
          setIsLoadingAuth(false);
          return;
        }
        // Only redirect to /home if the user is currently on a public/auth page.
        // On all other pages (e.g. /profile, /explore, /project/:id), stay put.
        if (session && PUBLIC_AUTH_ROUTES.includes(location.pathname)) {
          navigate("/home");
        }
      }
      setIsLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
      // Clear the module-level flag so future logins aren't affected
      if (isRecovery) clearRecoveryFlag();
    };
  }, [navigate, location.pathname]);

  if (isLoadingAuth) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F11' }}>
        <style>{`
          @keyframes appSpin { to { transform: rotate(360deg); } }
          .app-loading-spinner {
            width: 40px; height: 40px;
            border: 4px solid rgba(255,255,255,0.1);
            border-top-color: #7C3AED;
            border-radius: 50%;
            animation: appSpin 1s linear infinite;
          }
        `}</style>
        <div className="app-loading-spinner"></div>
      </div>
    );
  }


  return (
    <>
      <TopProgressBar />
      {showNavbar && <Sidebar />}
      <main className="main-content" style={showNavbar ? { marginTop: 64 } : {}}>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Register */}
          <Route path="/register" element={<Register />} />

          {/* Dashboard */}
          <Route path="/home" element={<Home />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/following" element={<Following />} />
          <Route path="/followers" element={<Followers />} />
          <Route path="/profile/:identifier" element={<UserProfile />} />
          <Route path="/project/:id" element={<ProjectPage />} />
          <Route path="/project-hub" element={<ProjectHub />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/post/:postId" element={<PostDetail />} />
          <Route path="/reset-password" element={<ResetPassword />} />

        </Routes>
      </main>
    </>
  );
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.documentElement.classList.add("light-mode");
    } else {
      document.documentElement.classList.remove("light-mode");
    }
  }, []);

  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
}

export default App;