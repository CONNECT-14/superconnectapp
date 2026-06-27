import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const styles = `
  :root {
    --nav-height: 64px;
    --bg: #0F0F11;
    --surface: #1A1A1F;
    --border: #2A2A2F;
    --ink: #F4F4F5;
    --ink-muted: #A1A1AA;
    --accent: #7C3AED;
    --accent-hover: #6D28D9;
    --accent-light: #A855F7;
    --transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ── Navbar ── */
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--nav-height);
    background: #111114;
    backdrop-filter: blur(18px) saturate(1.6);
    -webkit-backdrop-filter: blur(18px) saturate(1.6);
    display: flex;
    align-items: center;
    padding: 0 32px;
    font-family: 'Inter', sans-serif;
    z-index: 1000;
    border-bottom: 1px solid #2A2A2F;
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
    color: #fff;
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
    color: #A1A1AA;
    font-size: 0.85rem;
    font-weight: 400;
    letter-spacing: 0.01em;
    transition: color var(--transition), background var(--transition), transform var(--transition);
    position: relative;
    white-space: nowrap;
  }

  .navbar-link:hover {
    color: #F4F4F5;
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
    color: #fff;
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
    border: 1px solid #2A2A2F;
    color: #A1A1AA;
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
    color: var(--ink-muted);
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
    color: var(--ink);
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
    background: #111114;
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
    color: var(--ink);
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
    color: var(--ink-muted);
  }
  .notification-text strong {
    color: var(--ink);
    font-weight: 600;
  }
  .notification-time {
    font-size: 11px;
    color: var(--ink-muted);
  }
  .notification-empty {
    padding: 24px;
    text-align: center;
    color: var(--ink-muted);
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
      color: var(--ink);
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
      background: #111114;
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
  },
  {
  to: "/project-hub",
  label: "Project Hub",
  icon: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
}
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const ensureProfileExists = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;
      
      if (currentUser) {
        setUser(currentUser);
        // Check if profile exists
        const { error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", currentUser.id)
          .single();

        // If not found, insert one using Google Auth metadata
        if (error && error.code === 'PGRST116') {
          await supabase.from("profiles").insert([{
            id: currentUser.id,
            name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || "User",
            email: currentUser.email
          }]);
        }
        
        fetchNotifications(currentUser);
      }
    };

    ensureProfileExists();
  }, []);

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
      const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', fromUserIds);

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
    if (notif.type === 'follow') navigate(`/user/${notif.from_user_id}`);
    else if (notif.type === 'message') navigate(`/messages`);
    else if (notif.project_id) navigate(`/project/${notif.project_id}`);
    else navigate(`/home`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
                      {n.profiles?.avatar_url ? (
                        <img src={n.profiles.avatar_url} alt="avatar" className="notification-avatar" />
                      ) : (
                        <div className="notification-avatar" style={{ background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                          {n.profiles?.name ? n.profiles.name.charAt(0).toUpperCase() : "U"}
                        </div>
                      )}
                      <div className="notification-content">
                        <div className="notification-text">
                          <strong>{n.profiles?.name || 'Someone'}</strong>{' '}
                          {n.type === 'follow' && 'started following you'}
                          {n.type === 'like' && 'liked your post'}
                          {n.type === 'comment' && 'commented on your post'}
                          {n.type === 'message' && 'sent you a message'}
                        </div>
                        <div className="notification-time">
                          {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
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