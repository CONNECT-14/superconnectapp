import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Feed from "../components/Feed";
import BackgroundParticles from "../components/BackgroundParticles";
import { useNavigate } from "react-router-dom";

const styles = `
  /* Same layout styles as Home.jsx */
  .home-root {
    min-height: 100vh;
    background: var(--bg-app);
    color: var(--text-primary);
    position: relative;
    display: flex;
    flex-direction: row;
    overflow: visible;
  }
  .home-layout {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    gap: 32px;
    padding: 0 16px;
  }
  /* LEFT SIDEBAR */
  .left-sidebar {
    width: 280px;
    flex-shrink: 0;
    position: sticky;
    top: 60px;
    max-height: calc(100vh - 80px);
    overflow-y: auto;
    padding: 24px 16px 80px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    scrollbar-width: none;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border);
    border-radius: 0 12px 12px 0;
    z-index: 2;
  }
  .left-sidebar::-webkit-scrollbar { display: none; }

  /* SIDEBAR SECTIONS */
  .ls-heading {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-secondary);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: -8px;
  }
  .ls-divider {
    height: 1px;
    background: var(--border);
    margin: 4px 0;
  }
  .ls-project {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: var(--text-primary);
    padding: 8px;
    border-radius: 8px;
    transition: background 0.2s;
  }
  .ls-project:hover { background: var(--bg-card); }
  .ls-project img, .ls-project-placeholder {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .ls-project-name { font-size: 13px; font-weight: 600; }
  
  /* Suggested Users */
  .rs-user {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: 8px;
    transition: background 0.2s;
  }
  .rs-user:hover { background: var(--bg-card); }
  .rs-user img, .rs-user-placeholder {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  .rs-user-placeholder {
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
  }
  .rs-user-info { flex: 1; min-width: 0; }
  .rs-user-name { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rs-user-occ { font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rs-btn {
    background: var(--accent);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .rs-btn:hover { opacity: 0.9; }

  /* MIDDLE FEED */
  .middle-feed {
    flex: 1;
    min-width: 0;
    padding: 24px 0 40px 0;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Explore Header */
  .explore-header {
    margin-bottom: 8px;
  }
  .explore-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 4px 0;
  }
  .explore-subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
  }

  /* Search Bar */
  .explore-search {
    display: flex;
    align-items: center;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 16px;
    gap: 12px;
    transition: border-color 0.2s;
  }
  .explore-search:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
  .explore-search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    outline: none;
  }
  .explore-search-input::placeholder { color: var(--text-secondary); }
  .explore-search-icon {
    color: var(--text-secondary);
    width: 18px;
    height: 18px;
  }

  /* Feed Tabs */
  .feed-tabs {
    display: flex;
    gap: 12px;
    border-bottom: 1px solid var(--border);
    padding-bottom: 12px;
    margin-bottom: 8px;
  }
  .feed-tab {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .feed-tab:hover { color: var(--text-primary); background: var(--border); }
  .feed-tab.active { background: var(--accent); color: white; }

  @media (max-width: 900px) {
    .left-sidebar { display: none; }
  }
`;

export default function ExplorePage() {
  const [currentUser, setCurrentUser] = useState(null);

  // Feed state
  const [feedType, setFeedType] = useState('All'); // All, Posts, Projects
  const [searchText, setSearchText] = useState("");
  const [searchTrigger, setSearchTrigger] = useState("");

  // Sidebar state
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [trendingProjects, setTrendingProjects] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    let userId = null;
    if (session?.user) {
      userId = session.user.id;
      setCurrentUser(session.user);
    }

    // Suggested Users
    let followingIds = [];
    if (userId) {
      const { data: followingData } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
      followingIds = followingData?.map(f => f.following_id) || [];
    }
    
    let userQuery = supabase.from("profiles").select("*").limit(20);
    if (userId) userQuery = userQuery.neq("id", userId);
    
    const { data: sUsers } = await userQuery;
    const filteredUsers = (sUsers || []).filter(u => !followingIds.includes(u.id)).slice(0, 5);
    setSuggestedUsers(filteredUsers);

    // Trending Projects
    let pFollowingIds = [];
    if (userId) {
      const { data: pFollowingData } = await supabase.from("project_followers").select("project_id").eq("user_id", userId);
      pFollowingIds = pFollowingData?.map(p => p.project_id) || [];
    }

    let projectQuery = supabase.from("projects").select("*").limit(20);
    if (userId) projectQuery = projectQuery.neq("user_id", userId);

    const { data: tProjects } = await projectQuery;
    const filteredProjects = (tProjects || []).filter(p => !pFollowingIds.includes(p.id)).slice(0, 4);
    setTrendingProjects(filteredProjects);
  };

  const handleFollowUser = async (targetId) => {
    if (!currentUser) return;
    const { error } = await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: targetId });
    if (!error) {
      setSuggestedUsers(prev => prev.filter(u => u.id !== targetId));
    }
  };

  const handleFollowProject = async (targetId) => {
    if (!currentUser) return;
    const { error } = await supabase.from("project_followers").insert({ user_id: currentUser.id, project_id: targetId });
    if (!error) {
      setTrendingProjects(prev => prev.filter(p => p.id !== targetId));
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setSearchTrigger(searchText);
    }
  };



  return (
    <>
      <style>{styles}</style>
      <div className="home-root">
        <BackgroundParticles variant="split" />
        
        <div className="home-layout">
          
          {/* LEFT SIDEBAR */}
          <div className="left-sidebar">
            <div className="ls-heading">SUGGESTED USERS</div>
            {suggestedUsers.length === 0 ? (
              <div style={{fontSize:'12px', color:'var(--ink-muted)'}}>No suggestions right now</div>
            ) : (
              suggestedUsers.map(u => (
                <div key={u.id} className="rs-user">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="User" />
                  ) : (
                    <div className="rs-user-placeholder">{u.name ? u.name.charAt(0).toUpperCase() : "U"}</div>
                  )}
                  <div className="rs-user-info">
                    <div className="rs-user-name" onClick={() => navigate(`/profile/${u.username || u.id}`)} style={{cursor:'pointer'}}>{u.name || "User"}</div>
                    <div className="rs-user-occ">{u.occupation || "Member"}</div>
                  </div>
                  {currentUser && (
                    <button className="rs-btn" onClick={() => handleFollowUser(u.id)}>Follow</button>
                  )}
                </div>
              ))
            )}

            <div className="ls-divider" style={{ margin: '12px 0' }}></div>

            <div className="ls-heading">TRENDING PROJECTS</div>
            {trendingProjects.length === 0 ? (
              <div style={{fontSize:'12px', color:'var(--ink-muted)'}}>No trending projects right now</div>
            ) : (
              trendingProjects.map(p => (
                <div key={p.id} className="rs-user">
                  {p.image_url ? (
                    <img src={p.image_url} alt="Project" style={{ borderRadius: '6px' }} />
                  ) : (
                    <div className="rs-user-placeholder" style={{ borderRadius: '6px', background: 'linear-gradient(135deg, #7C3AED, #4C1D95)' }}>
                      {p.title ? p.title.charAt(0).toUpperCase() : "P"}
                    </div>
                  )}
                  <div className="rs-user-info">
                    <div className="rs-user-name" onClick={() => navigate(`/project/${p.id}`)} style={{cursor:'pointer'}}>{p.title}</div>
                    <div className="rs-user-occ" style={{ fontSize: '11px' }}>{p.status || 'Active'}</div>
                  </div>
                  {currentUser && (
                    <button className="rs-btn" onClick={() => handleFollowProject(p.id)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--ink)' }}>Track</button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* MIDDLE FEED */}
          <div className="middle-feed">
            
            <div className="explore-header">
              <h1 className="explore-title">Explore</h1>
              <p className="explore-subtitle">Discover posts and projects from the community</p>
            </div>

            <div className="explore-search">
              <svg className="explore-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="explore-search-input"
                placeholder="Search posts or projects... (Press Enter)"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>

            <div className="feed-tabs">
              {['All', 'Posts', 'Projects'].map(tab => (
                <button
                  key={tab}
                  className={`feed-tab ${feedType === tab ? 'active' : ''}`}
                  onClick={() => setFeedType(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* THE GLOBAL FEED */}
            <Feed
              feedType={feedType}
              currentUser={currentUser}
              search={searchTrigger}
              category="All"
              topic="All"
              sort="latest"
              globalMode={true}
            />
            
          </div>
        </div>
      </div>
    </>
  );
}
