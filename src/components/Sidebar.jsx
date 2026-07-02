import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import useAuth from "../hooks/useAuth";
import { formatTimestamp } from "../utils/format";
import ErrorBoundary from "../components/ErrorBoundary";

const styles = `
  /* ── Navbar ── */
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--nav-height);
    background: var(--bg-navbar);
    backdrop-filter: blur(18px) saturate(1.6);
    -webkit-backdrop-filter: blur(18px) saturate(1.6);
    display: flex;
    align-items: center;
    padding: 0 32px;
    font-family: 'Inter', sans-serif;
    z-index: 1000;
    border-bottom: 1px solid var(--border);
    box-shadow: 0 1px 24px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3);
    box-sizing: border-box;
  }

  /* ── Brand ── */
  .navbar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    flex-shrink: 0;
    margin-right: 40px;
    cursor: pointer;
  }

  .navbar-brand img {
    height: 38px;
    width: auto;
    object-fit: contain;
  }

  .brand-text {
    font-family: 'Inter', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    line-height: 1;
    text-shadow: 0 0 20px rgba(124, 58, 237, 0.4);
  }

  /* ── Nav Links ── */
  .navbar-nav {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
    justify-content: center;
  }

  .navbar-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    text-decoration: none;
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 400;
    letter-spacing: 0.01em;
    transition: color var(--transition), background var(--transition), transform var(--transition);
    position: relative;
    white-space: nowrap;
  }

  .navbar-link:hover {
    color: var(--text-primary);
    background: rgba(124, 58, 237, 0.08);
    transform: translateY(-1px);
  }

  .navbar-link:hover::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 20%;
    right: 20%;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: #A855F7;
  }

  .navbar-link.active {
    color: white;
    background: #7C3AED;
    border-radius: 20px;
  }

  .navbar-link.active .nav-icon {
    color: #fff;
  }

  /* Remove the bottom bar on active (using pill shape instead) */
  .navbar-link.active::after {
    display: none;
  }

  @keyframes slideIn {
    from { transform: scaleX(0); opacity: 0; }
    to   { transform: scaleX(1); opacity: 1; }
  }

  .nav-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    opacity: 0.75;
    transition: color var(--transition), opacity var(--transition);
  }

  .navbar-link:hover .nav-icon { opacity: 1; }

  /* ── Left brand group ── */
  .navbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }

  /* ── Right section ── */
  .navbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .btn-logout {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 6px 14px;
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all var(--transition);
  }

  .btn-logout:hover {
    background: rgba(239, 68, 68, 0.08);
    color: #EF4444;
    border-color: rgba(239, 68, 68, 0.3);
  }

  /* ── Notifications ── */
  .bell-btn {
    position: relative;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    transition: all var(--transition);
  }
  .bell-btn:hover {
    background: rgba(124, 58, 237, 0.1);
    color: var(--text-primary);
  }
  .bell-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    background: #EF4444;
    color: white;
    font-size: 10px;
    font-weight: bold;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .notifications-dropdown {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 320px;
    max-height: 400px;
    background: var(--bg-navbar);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 10px 24px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 1000;
  }
  
  .notifications-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .notifications-header h4 {
    margin: 0;
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 600;
  }
  
  .btn-mark-read {
    background: transparent;
    border: none;
    color: var(--accent);
    font-size: 12px;
    cursor: pointer;
    font-weight: 500;
  }
  .btn-mark-read:hover { text-decoration: underline; }

  .theme-toggle-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .theme-toggle-btn:hover {
    background: var(--bg-card);
    color: var(--text-primary);
  }

  .notifications-list {
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .notification-item {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 12px;
    cursor: pointer;
    transition: background 0.2s;
    text-decoration: none;
    color: inherit;
    align-items: flex-start;
  }
  .notification-item:hover { background: rgba(124, 58, 237, 0.05); }
  .notification-item.unread { background: rgba(124, 58, 237, 0.1); }
  
  .notification-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  
  .notification-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .notification-text {
    font-size: 13px;
    line-height: 1.4;
    color: var(--text-secondary);
  }
  .notification-text strong {
    color: var(--text-primary);
    font-weight: 600;
  }
  .notification-time {
    font-size: 11px;
    color: var(--text-secondary);
  }
  .notification-empty {
    padding: 24px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 13px;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .navbar {
      padding: 0 16px;
      justify-content: space-between;
    }
    .navbar-brand {
      margin-right: auto; /* Push everything else to the right */
      gap: 6px;
    }
    .navbar-brand img {
      height: 28px;
    }
    .brand-text {
      font-size: 1.2rem;
    }
    
    /* Hide normal nav and right section on mobile */
    .navbar-nav, .navbar-right {
      display: none;
    }

    /* Show hamburger icon */
    .mobile-menu-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 8px;
      margin-left: 16px;
    }

    /* Mobile Dropdown Menu */
    .mobile-menu {
      position: absolute;
      top: var(--nav-height);
      left: 0;
      right: 0;
      background: var(--bg-navbar);
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 16px;
      gap: 12px;
      box-shadow: 0 10px 24px rgba(0,0,0,0.5);
      z-index: 999;
    }

    .mobile-menu .navbar-link {
      padding: 12px 16px;
      font-size: 1rem;
      gap: 12px;
      justify-content: flex-start;
      border-radius: 8px;
    }

    .mobile-menu .btn-logout {
      margin-top: 12px;
      width: 100%;
      justify-content: center;
      padding: 12px;
    }
    
    .mobile-menu .btn-logout span {
      display: inline;
    }
  }

  @media (min-width: 769px) {
    .mobile-menu-btn, .mobile-menu {
      display: none;
    }
  }
`;

const navItems = [
  {
    to: "/home",
    label: "Dashboard",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    to: "/explore",
    label: "Explore",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "Profile",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    to: "/messages",
    label: "Messages",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  }
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  
  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const [isLightMode, setIsLightMode] = useState(
    () => document.documentElement.classList.contains("light-mode") || localStorage.getItem("theme") === "light"
  );

  const toggleTheme = () => {
    setIsLightMode(prev => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.classList.add("light-mode");
        localStorage.setItem("theme", "light");
      } else {
        document.documentElement.classList.remove("light-mode");
        localStorage.setItem("theme", "dark");
      }
      return newTheme;
    });
  };

  useEffect(() => {
    const ensureProfileExists = async () => {
      if (user) {
        // Check if profile exists
        const { error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        // If not found, insert one using Google Auth metadata or Email signup metadata
        if (error && error.code === 'PGRST116') {
          const rawName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "User";
          
          let desiredUsername = user.user_metadata?.username;
          let isAutoGenerated = false;

          if (!desiredUsername) {
            // Auto-generate a slug for Google OAuth signups or missing metadata
            desiredUsername = rawName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '');
            if (!desiredUsername || desiredUsername.length < 3) desiredUsername = "user_" + Math.floor(Math.random() * 10000);
            // Append random digits to reduce collision chances
            desiredUsername += Math.floor(Math.random() * 10000);
            isAutoGenerated = true;
          }

          const { error: insertError } = await supabase.from("profiles").insert([{
            id: user.id,
            name: rawName,
            email: user.email,
            username: desiredUsername,
            username_is_auto_generated: isAutoGenerated
          }]);

          if (insertError && (insertError.message.includes('23505') || insertError.message.toLowerCase().includes('unique'))) {
            // If the typed username (or generated one) was taken right at the finish line, append a random suffix to ensure creation doesn't hard-fail
            await supabase.from("profiles").insert([{
              id: user.id,
              name: rawName,
              email: user.email,
              username: desiredUsername + Math.floor(Math.random() * 10000),
              username_is_auto_generated: isAutoGenerated
            }]);
          }
        }
        
        fetchNotifications(user);
      }
    };

    ensureProfileExists();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const subscription = supabase
      .channel('notifications-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        const fromUserId = payload.new.from_user_id;
        let profile = null;
        if (fromUserId) {
          const { data } = await supabase.from('profiles').select('id, name, avatar_url, username').eq('id', fromUserId).single();
          profile = data;
        }
        
        setNotifications(prev => [{ ...payload.new, profiles: profile }, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const fetchNotifications = async (currentUser) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) { console.error("Notifications error:", error); return; }

    if (data.length > 0) {
      const fromUserIds = [...new Set(data.map(n => n.from_user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url, username').in('id', fromUserIds);

      const enriched = data.map(n => ({
        ...n,
        profiles: profiles?.find(p => p.id === n.from_user_id)
      }));

      setNotifications(enriched);
      setUnreadCount(enriched.filter(n => !n.is_read).length);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notif) => {
    setShowDropdown(false);
    if (!notif.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // Navigate based on type
    if (notif.type === 'follow') navigate(`/profile/${notif.from_user_id}`);
    else if (notif.type === 'message') navigate(`/messages`);
    else if (notif.type === 'collab_interest') navigate(`/profile/${notif.from_user_id}`);
    else if (notif.project_id) navigate(`/project/${notif.project_id}`);
    else navigate(`/home`);
  };

  const handleLogout = async () => {
    try {
      // 1. Backend Revocation: invalidate session on the server
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during backend logout:", error);
    } finally {
      // 2. Clear Client-Side Storage: JWTs, session IDs, user data
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all accessible cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // 3 & 4. Reset Auth State and Final Redirect
      // Navigate to the starting page, then force a full page reload to 
      // completely clear any React memory state (Redux/Context/useState).
      navigate("/", { replace: true });
      setTimeout(() => {
        window.location.reload();
      }, 50);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <nav className="navbar">
        {/* Left: Brand */}
        <div className="navbar-left">
          <Link to="/home" className="navbar-brand">
            <img src={process.env.PUBLIC_URL + "/assests/logo-light.png"} alt="Brain Logo" />
            <span className="brand-text">Connect</span>
          </Link>
        </div>

        {/* Center: Nav Links (Desktop) */}
        <div className="navbar-nav">
          {navItems.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`navbar-link${location.pathname === to ? " active" : ""}`}
            >
              {icon}
              {label}
            </Link>
          ))}
        </div>

        {/* Right: Notifications & Logout (Desktop) */}
        <div className="navbar-right" style={{ position: 'relative' }}>
          
          {/* Theme Toggle */}
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
            {isLightMode ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>

          {/* Bell Icon */}
          <button className="bell-btn" onClick={() => {
            setShowDropdown(!showDropdown);
            if (!showDropdown && user) fetchNotifications(user); // refresh when opening
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {/* Notifications Dropdown */}
          {showDropdown && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button className="btn-mark-read" onClick={markAllAsRead}>Mark all as read</button>
                )}
              </div>
              <ErrorBoundary>
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">You're all caught up!</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`notification-item ${n.is_read ? '' : 'unread'}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <Link 
                        to={`/profile/${n.profiles?.username || n.profiles?.id || n.from_user_id}`} 
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', textDecoration: 'none', color: 'inherit' }}
                      >
                        {n.profiles?.avatar_url ? (
                          <img src={n.profiles.avatar_url} alt="avatar" className="notification-avatar" />
                        ) : (
                          <div className="notification-avatar" style={{ background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                            {n.profiles?.name ? n.profiles.name.charAt(0).toUpperCase() : "U"}
                          </div>
                        )}
                      </Link>
                      <div className="notification-content">
                        <div className="notification-text">
                          <Link 
                            to={`/profile/${n.profiles?.username || n.profiles?.id || n.from_user_id}`} 
                            onClick={(e) => e.stopPropagation()}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <strong>{n.profiles?.name || 'Someone'}</strong>
                          </Link>{' '}
                          {n.type === 'follow' ? 'started following you' :
                           n.type === 'like' ? 'liked your post' :
                           n.type === 'comment' ? 'commented on your post' :
                           n.type === 'message' ? 'sent you a message' :
                           n.type === 'collab_interest' ? 'expressed interest in your collab request' :
                           n.type === 'access_request' ? (n.message && n.message.includes('requested') ? n.message.substring(n.message.indexOf('requested')) : 'requested member access to a project') :
                           (n.message || 'interacted with you')}
                        </div>
                        <div className="notification-time">
                          {formatTimestamp(n.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              </ErrorBoundary>
            </div>
          )}

          <button onClick={handleLogout} className="btn-logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width: '14px', height: '14px'}}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu">
            {navItems.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`navbar-link${location.pathname === to ? " active" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {icon}
                {label}
              </Link>
            ))}
            <button onClick={handleLogout} className="btn-logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width: '14px', height: '14px'}}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
}