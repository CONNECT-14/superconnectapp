import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import UserCard from "../components/UserCard";
import useAuth from "../hooks/useAuth";
import Feed from "../components/Feed";
import BackgroundParticles from "../components/BackgroundParticles";
import CollabCard from "../components/CollabCard";
import PostCollabModal from "../components/PostCollabModal";
import { useNavigate, useLocation } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";
import { useRef } from "react";
import ErrorBoundary from "../components/ErrorBoundary";

const SKILL_FILTERS = ['All', 'React', 'Python', 'UI/UX', 'Backend', 'Frontend', 'AI', 'Mobile', 'Design'];

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
    transition: all 0.2s ease-in-out;
    cursor: pointer;
  }
  .rs-user:hover { background: rgba(124, 58, 237, 0.08); }
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
    flex-shrink: 0;
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

  /* Collab Tab Header */
  .collab-tab-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 4px;
  }
  .btn-post-collab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #7C3AED;
    color: white;
    border: none;
    padding: 10px 18px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    font-family: 'Inter', sans-serif;
    white-space: nowrap;
  }
  .btn-post-collab:hover { opacity: 0.85; }

  /* Skill Filter Scroll Bar */
  .skill-filter-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 2px;
  }
  .skill-filter-wrap::-webkit-scrollbar { display: none; }
  .skill-filter-row {
    display: flex;
    gap: 8px;
    width: max-content;
  }
  .skill-filter-pill {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s;
    font-family: 'Inter', sans-serif;
    white-space: nowrap;
  }
  .skill-filter-pill:hover {
    border-color: rgba(168,85,247,0.4);
    color: #A855F7;
    background: rgba(124,58,237,0.06);
  }
  .skill-filter-pill.active {
    background: rgba(124,58,237,0.15);
    border-color: rgba(168,85,247,0.4);
    color: #A855F7;
  }

  /* Collab Grid */
  .collab-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .collab-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-secondary);
    font-size: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .collab-empty-icon {
    font-size: 2.5rem;
    opacity: 0.3;
    margin-bottom: 6px;
  }

  /* Toast */
  .explore-toast {
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    background: #22C55E;
    color: white;
    padding: 12px 24px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 9999;
    animation: toastIn 0.3s ease, toastOut 0.3s ease 2.2s forwards;
    white-space: nowrap;
  }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  @keyframes toastOut { from { opacity: 1; } to { opacity: 0; } }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 900px) {
    .left-sidebar { display: none; }
  }
`;

export default function ExplorePage() {
  const { user: currentUser } = useAuth();

  // Feed state
  const [feedType, setFeedType] = useState('All'); // All, Posts, Projects, Collabs
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 400);
  const [searchTrigger, setSearchTrigger] = useState("");

  useEffect(() => {
    if (searchText === "") {
      setSearchTrigger("");
    } else if (debouncedSearch) {
      setSearchTrigger(debouncedSearch);
    }
  }, [debouncedSearch, searchText]);

  // Sidebar state
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingUserMap, setFollowingUserMap] = useState({});
  const [trendingProjects, setTrendingProjects] = useState([]);
  const [trackingProjectProgress, setTrackingProjectProgress] = useState({});

  // Collabs tab state
  const [collabs, setCollabs] = useState([]);
  const [collabsLoading, setCollabsLoading] = useState(false);
  const [skillFilter, setSkillFilter] = useState('All');
  const [showPostCollabModal, setShowPostCollabModal] = useState(false);
  const [collabRefreshKey, setCollabRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  // Users tab state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(0);
  const [usersHasMore, setUsersHasMore] = useState(true);
  const usersSentinelRef = useRef(null);
  
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');
    if (filter) {
      const formatted = filter.charAt(0).toUpperCase() + filter.slice(1).toLowerCase();
      if (['All', 'Posts', 'Projects', 'Collabs', 'Users'].includes(formatted)) {
        setFeedType(formatted);
      }
    }
  }, [location.search]);

  // Auto trigger pagination when sentinel intersects
  useEffect(() => {
    if (feedType !== 'Users' || !usersHasMore || usersLoading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setUsersPage(p => p + 1);
      }
    });
    if (usersSentinelRef.current) observer.observe(usersSentinelRef.current);
    return () => observer.disconnect();
  }, [feedType, usersHasMore, usersLoading]);

  useEffect(() => {
    if (feedType === 'Users') {
      setUsersPage(0);
      fetchUsers(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedType, searchTrigger]);

  useEffect(() => {
    if (feedType === 'Users' && usersPage > 0) {
      fetchUsers(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersPage]);


  useEffect(() => {
    if (feedType === 'Collabs') {
      fetchCollabs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedType, collabRefreshKey]);

  const fetchInitialData = useCallback(async (user) => {
    let userId = user?.id || null;

    // Suggested Users
    let followingIds = [];
    if (userId) {
      const { data: followingData } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
      followingIds = followingData?.map(f => f.following_id) || [];
      const fMap = {};
      followingIds.forEach(id => { fMap[id] = true; });
      setFollowingUserMap(fMap);
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
  }, []);

  useEffect(() => {
    fetchInitialData(currentUser);
  }, [currentUser, fetchInitialData]);

  const fetchCollabs = useCallback(async () => {
    setCollabsLoading(true);
    const { data, error } = await supabase
      .from('collab_requests')
      .select('*, creator:creator_id(*), project:project_id(id, title)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCollabs(data);
    } else if (error) {
      setError("Failed to load collaborations.");
    }
    setCollabsLoading(false);
  }, []);

  useEffect(() => {
    if (feedType === 'Collabs') {
      fetchCollabs();
    }
  }, [feedType, collabRefreshKey, fetchCollabs]);

  const fetchUsers = useCallback(async (isInitial = true) => {
    setUsersLoading(true);
    const currentPage = isInitial ? 0 : usersPage;
    const { data, error } = await supabase.rpc('search_profiles', {
      search_query: searchTrigger || '',
      max_limit: 15,
      result_offset: currentPage * 15
    });
    
    if (!error && data) {
      // Exclude self
      const filtered = currentUser ? data.filter(u => u.id !== currentUser.id) : data;
      if (data.length < 15) setUsersHasMore(false);
      else setUsersHasMore(true);
      
      setUsers(prev => isInitial ? filtered : [...prev, ...filtered]);
      if (!isInitial) setUsersPage(currentPage);
    } else {
      setUsersHasMore(false);
      if (error) setError("Failed to fetch users.");
    }
    setUsersLoading(false);
  }, [searchTrigger, usersPage, currentUser]);

  const handleFollowProject = async (targetId) => {
    if (!currentUser) return;
    setTrackingProjectProgress(prev => ({ ...prev, [targetId]: true }));
    const { error } = await supabase.from("project_followers").insert({ user_id: currentUser.id, project_id: targetId });
    if (!error) {
      setTrendingProjects(prev => prev.filter(p => p.id !== targetId));
    } else {
      setError("Failed to track project.");
    }
    setTrackingProjectProgress(prev => ({ ...prev, [targetId]: false }));
  };

  const handleSearch = (e) => {
    // Automatically handled by debounce, but kept for fallback or explicit search
    if (e.key === 'Enter') {
      setSearchTrigger(searchText);
    }
  };

  const handleCollabPosted = () => {
    setCollabRefreshKey(k => k + 1);
    showToast('🎉 Collab request posted!');
  };

  const handleCollabClosed = (collabId) => {
    setCollabs(prev => prev.filter(c => c.id !== collabId));
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2700);
  };

  // Filter collabs by skill
  const filteredCollabs = skillFilter === 'All'
    ? collabs
    : collabs.filter(c => c.skills && c.skills.map(s => s.toLowerCase()).includes(skillFilter.toLowerCase()));

  return (
    <>
      <style>{styles}</style>
      <div className="home-root">
        <BackgroundParticles variant="split" />
        
        <div className="home-layout">
          {error && (
            <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              {error}
              <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>
          )}
          
          {/* LEFT SIDEBAR */}
          <div className="left-sidebar">
            <div className="ls-heading">SUGGESTED USERS</div>
            {suggestedUsers.length === 0 ? (
              <div style={{fontSize:'12px', color:'var(--ink-muted)'}}>No suggestions right now</div>
            ) : (
              suggestedUsers.map(u => (
                <UserCard 
                  key={u.id}
                  user={u}
                  currentUser={currentUser}
                  variant="list"
                  initialIsFollowing={followingUserMap[u.id] || false}
                  onFollowToggle={(userId, isFollowing) => {
                    setFollowingUserMap(prev => ({ ...prev, [userId]: isFollowing }));
                  }}
                />
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
                    <button className="rs-btn" onClick={() => handleFollowProject(p.id)} disabled={trackingProjectProgress[p.id]} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--ink)', opacity: trackingProjectProgress[p.id] ? 0.7 : 1 }}>
                      {trackingProjectProgress[p.id] ? <div className="btn-spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'var(--accent)' }}></div> : "Track"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* MIDDLE FEED */}
          <div className="middle-feed">
            
            <div className="explore-header">
              <h1 className="explore-title">Explore</h1>
              <p className="explore-subtitle">Discover posts, projects, and collaboration opportunities</p>
            </div>

            <div className="explore-search">
              <svg className="explore-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="explore-search-input"
                placeholder={feedType === 'Users' ? 'Search users by name or @username...' : 'Search posts or projects... (Press Enter)'}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>

            <div className="feed-tabs">
              {['All', 'Posts', 'Projects', 'Collabs', 'Users'].map(tab => (
                <button
                  key={tab}
                  className={`feed-tab ${feedType === tab ? 'active' : ''}`}
                  onClick={() => {
                    setFeedType(tab);
                    navigate(tab === 'All' ? '/explore' : `/explore?filter=${tab.toLowerCase()}`);
                  }}
                >
                  {tab === 'Collabs' ? '🤝 Collabs' : tab}
                </button>
              ))}
            </div>

            {/* COLLABS TAB */}
            {feedType === 'Collabs' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Header row with Post button */}
                <div className="collab-tab-header">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Open Collab Requests
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {filteredCollabs.length} {filteredCollabs.length === 1 ? 'request' : 'requests'}{skillFilter !== 'All' ? ` for #${skillFilter}` : ' available'}
                    </span>
                  </div>
                  {currentUser && (
                    <button className="btn-post-collab" onClick={() => setShowPostCollabModal(true)}>
                      + Post Collab Request
                    </button>
                  )}
                </div>

                {/* Skill Filter Bar */}
                <div className="skill-filter-wrap">
                  <div className="skill-filter-row">
                    {SKILL_FILTERS.map(skill => (
                      <button
                        key={skill}
                        className={`skill-filter-pill ${skillFilter === skill ? 'active' : ''}`}
                        onClick={() => setSkillFilter(skill)}
                      >
                        {skill === 'All' ? 'All' : `#${skill}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collab List */}
                {collabsLoading ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Loading collab requests...
                  </div>
                ) : filteredCollabs.length === 0 ? (
                  <div className="collab-empty">
                    <div className="collab-empty-icon">🤝</div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {skillFilter !== 'All' ? `No collabs need #${skillFilter} right now` : 'No collab requests yet'}
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      {currentUser ? 'Be the first to post a collab request!' : 'Sign in to post a collab request'}
                    </div>
                  </div>
                ) : (
                  <div className="collab-list">
                    {filteredCollabs.map(collab => (
                      <CollabCard
                        key={collab.id}
                        collab={collab}
                        currentUser={currentUser}
                        onCloseRequest={handleCollabClosed}
                        onEditRequest={() => {/* TODO: edit flow */}}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : feedType === 'Users' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {usersLoading && users.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading users...
                  </div>
                ) : users.length === 0 ? (
                  <div className="collab-empty">
                    <div className="collab-empty-icon">👥</div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      No users found
                    </div>
                  </div>
                ) : (
                  <div className="collab-list">
                    {users.map(u => (
                      <UserCard 
                        key={u.id}
                        user={u}
                        currentUser={currentUser}
                        variant="list"
                        initialIsFollowing={followingUserMap[u.id] || false}
                        onFollowToggle={(userId, isFollowing) => {
                          setFollowingUserMap(prev => ({ ...prev, [userId]: isFollowing }));
                        }}
                      />
                    ))}
                    {usersHasMore && <div ref={usersSentinelRef} style={{ height: "20px" }}></div>}
                  </div>
                )}
              </div>
            ) : (
              /* THE GLOBAL FEED */
              <ErrorBoundary>
                <Feed
                  feedType={feedType}
                  currentUser={currentUser}
                  search={searchTrigger}
                  category="All"
                  topic="All"
                  sort="latest"
                  globalMode={true}
                />
              </ErrorBoundary>
            )}
            
          </div>
        </div>
      </div>

      {/* POST COLLAB MODAL */}
      {showPostCollabModal && (
        <PostCollabModal
          currentUser={currentUser}
          onClose={() => setShowPostCollabModal(false)}
          onSuccess={handleCollabPosted}
        />
      )}

      {/* TOAST */}
      {toast && <div className="explore-toast">{toast}</div>}
    </>
  );
}
