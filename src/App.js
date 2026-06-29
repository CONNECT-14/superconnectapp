import { useEffect } from "react";
import { HashRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

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

// Components
import Sidebar from "./components/Sidebar";
import TopProgressBar from "./components/TopProgressBar";

// Pages where navbar should NOT appear
const NO_NAVBAR_ROUTES = ["/", "/login", "/register", "/reset-password"];

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const showNavbar = !NO_NAVBAR_ROUTES.includes(location.pathname);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        navigate("/home");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/project/:id" element={<ProjectPage />} />
          <Route path="/project-hub" element={<ProjectHub />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/reset-password" element={<ResetPassword />} />

        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
}

export default App;