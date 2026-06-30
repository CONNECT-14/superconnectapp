import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import CreatePost from "../components/CreatePost";
import Feed from "../components/Feed";
import BackgroundParticles from "../components/BackgroundParticles";

const styles = `

  .home-root {
    min-height: 100vh;
    background: var(--bg-app);
    font-family: 'Inter', sans-serif;
    color: var(--text-primary);
    padding-top: var(--nav-height);
  }

  .home-layout {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    min-height: 100vh;
    width: 100%;
    gap: 32px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    overflow: visible;
  }

  .left-sidebar {
    width: 240px;
    flex-shrink: 0;
    position: sticky;
    top: 60px;
    align-self: flex-start;
    max-height: calc(100vh - 80px);
    overflow-y: auto;
    scrollbar-width: none;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border);
    padding: 28px 28px 80px 28px;
    z-index: 2;
  }
  .left-sidebar::-webkit-scrollbar {
    display: none;
  }

  /* MIDDLE FEED (Now right feed) */
  .middle-feed {
    flex: 1;
    margin: 0 auto;
    padding: 24px 16px 40px 16px;
  }
  .middle-feed::-webkit-scrollbar {
    display: none;
  }

  /* LEFT SIDEBAR STYLES */
  .ls-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 12px;
  }
  .ls-avatar-placeholder {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 12px;
  }
  .ls-name {
    font-weight: bold;
    font-size: 16px;
    color: var(--text-primary);
    margin-bottom: 4px;
  }
  .ls-email {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 16px;
  }
  .ls-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
  }
  .ls-stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .ls-stat-num {
    font-size: 14px;
    font-weight: bold;
    color: var(--text-primary);
  }
  .ls-stat-label {
    font-size: 11px;
    color: var(--text-secondary);
  }
  .ls-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 20px;
  }
  .ls-skill-pill {
    background: rgba(124, 58, 237, 0.15);
    color: #A855F7;
    border: 1px solid rgba(124, 58, 237, 0.3);
    border-radius: 99px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 500;
  }
  .ls-divider {
    height: 1px;
    background: var(--border);
    margin: 20px 0;
  }
  .ls-heading {
    font-size: 14px;
    font-weight: bold;
    color: var(--text-primary);
    margin-bottom: 16px;
    border-left: 3px solid var(--accent);
    padding-left: 8px;
    text-transform: uppercase;
  }
  .rs-project {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 -8px 8px -8px;
    padding: 8px;
    border-radius: 8px;
    transition: var(--transition);
  }
  .rs-project:hover {
    background: var(--border);
  }
  .ls-project {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 -8px 8px -8px;
    padding: 8px;
    border-radius: 8px;
    text-decoration: none;
    color: var(--text-primary);
    transition: var(--transition);
  }
  .ls-project:hover {
    color: var(--accent);
    background: var(--border);
  }
  .ls-project img, .ls-project-placeholder {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    object-fit: cover;
  }
  .ls-project-placeholder {
    background: rgba(124, 58, 237, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
  }
  .ls-project-name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* MERGED RIGHT SIDEBAR CONTENT */
  .rs-user {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 -8px 8px -8px;
    padding: 8px;
    border-radius: 8px;
    transition: var(--transition);
  }
  .rs-user:hover {
    background: var(--border);
  }
  .rs-user img, .rs-user-placeholder {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
  }
  .rs-user-placeholder {
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
  }
  .rs-user-info {
    flex: 1;
    min-width: 0;
  }
  .rs-user-name {
    font-size: 14px;
    font-weight: bold;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rs-user-occ {
    font-size: 12px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rs-btn {
    background: transparent;
    border: 1px solid var(--accent);
    color: var(--accent);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
  }
  .rs-btn:hover {
    background: var(--accent);
    color: white;
  }
  
  .btn-outline-full {
    width: 100%;
    background: transparent;
    border: 1px solid var(--accent);
    color: var(--accent);
    padding: 10px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: var(--transition);
  }
  .btn-outline-full:hover {
    background: rgba(124, 58, 237, 0.1);
  }

  /* SEARCH & FILTERS */
  .search-filters-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .search-bar {
    display: flex;
    gap: 10px;
  }

  .search-bar input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--border);
    background: var(--bg-card);
    color: var(--text-primary);
    border-radius: 8px;
    outline: none;
    font-family: 'Inter', sans-serif;
    transition: var(--transition);
  }
  
  .search-bar input::placeholder {
    color: var(--text-secondary);
  }
  
  .search-bar input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
  }

  .search-bar button {
    padding: 8px 14px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    transition: var(--transition);
  }
  
  .search-bar button:hover {
    background: #6D28D9;
  }

  .filters-bar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .filters-bar select {
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    outline: none;
    background: var(--bg-card);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    cursor: pointer;
    transition: var(--transition);
    flex: 1;
    min-width: 150px;
  }

  .filters-bar select:hover, .filters-bar select:focus {
    border-color: var(--accent);
  }


  /* TABS */
  .feed-tabs {
    display: flex;
    gap: 12px;
    margin: 0 0 24px;
  }
  .feed-tab {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 8px 16px;
    border-radius: 99px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
  }
  .feed-tab:hover {
    border-color: var(--accent);
    color: var(--text-primary);
  }
  .feed-tab.active {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }

  @media (max-width: 768px) {
    .left-sidebar {
      display: none;
    }
    .middle-feed {
      max-width: 100%;
      padding: 16px;
    }
    .search-bar {
      flex-direction: column;
    }
    .search-bar button {
      width: 100%;
    }
    .filters-bar {
      flex-direction: column;
      gap: 8px;
    }
    .filters-bar select {
      width: 100%;
    }
  }
`;

export default function Home() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [refresh, setRefresh] = useState(false);

  // Left Sidebar Data
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ followers: 0, following: 0, projects: 0 });
  const [myProjects, setMyProjects] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [trendingProjects, setTrendingProjects] = useState([]);

  // Search & Filter State
  const [searchText, setSearchText] = useState("");
  const [searchTrigger, setSearchTrigger] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [category, setCategory] = useState("All");
  const [topic, setTopic] = useState("All");
  const [sort, setSort] = useState("latest");

  // Feed State
  const [feedType, setFeedType] = useState('All'); // 'All', 'People', 'Projects'

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const init = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      const user = session?.user;
      setCurrentUser(user);
      
      if (user) {
        await fetchSidebarData(user.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
    }
  };

  const fetchSidebarData = async (userId) => {
    // Profile
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (prof) setProfile(prof);

    // Stats
    const { count: followers } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId);
    const { count: following } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId);
    
    // My Projects
    const { data: projData } = await supabase.from("projects").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    
    setStats({
      followers: followers || 0,
      following: following || 0,
      projects: projData?.length || 0
    });
    setMyProjects(projData || []);

    // Suggested Users (not followed)
    const { data: followingData } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
    const followingIds = followingData?.map(f => f.following_id) || [];
    
    const { data: sUsers } = await supabase.from("profiles").select("*").neq("id", userId).limit(20);
    const filteredUsers = (sUsers || []).filter(u => !followingIds.includes(u.id)).slice(0, 3);
    setSuggestedUsers(filteredUsers);

    // Trending Projects (not followed)
    const { data: pFollowingData } = await supabase.from("project_followers").select("project_id").eq("user_id", userId);
    const pFollowingIds = pFollowingData?.map(p => p.project_id) || [];

    const { data: tProjects } = await supabase.from("projects").select("*").neq("user_id", userId).limit(20);
    const filteredProjects = (tProjects || []).filter(p => !pFollowingIds.includes(p.id)).slice(0, 2);
    setTrendingProjects(filteredProjects);
  };

  const handleFollowUser = async (targetId) => {
    if (!currentUser) return;
    const { error } = await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: targetId });
    if (!error) {
      setSuggestedUsers(prev => prev.filter(u => u.id !== targetId));
      setStats(prev => ({ ...prev, following: prev.following + 1 }));
    }
  };

  const handleFollowProject = async (targetId) => {
    if (!currentUser) return;
    const { error } = await supabase.from("project_followers").insert({ user_id: currentUser.id, project_id: targetId });
    if (!error) {
      setTrendingProjects(prev => prev.filter(p => p.id !== targetId));
    }
  };

  const handleSearch = () => {
    setSearchTrigger(searchText);
  };

  useEffect(() => {
    if (!searchTrigger) {
      setUserSearchResults([]);
      return;
    }
    const fetchUsers = async () => {
      const { data } = await supabase.rpc('search_profiles', { search_query: searchTrigger });
      setUserSearchResults(data || []);
    };
    fetchUsers();
  }, [searchTrigger]);

  const handleRefresh = () => setRefresh((prev) => !prev);



  return (
    <>
      <style>{styles}</style>
      <div className="home-root">
        <BackgroundParticles variant="split" />
        
        <div className="home-layout">
          
          {/* LEFT SIDEBAR (Now 280px and contains everything) */}
          <div className="left-sidebar">
            {profile ? (
              <>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="ls-avatar" />
                ) : (
                  <div className="ls-avatar-placeholder">{profile.name ? profile.name.charAt(0).toUpperCase() : "U"}</div>
                )}
                <div className="ls-name">{profile.name || "User"}</div>
                <div className="ls-email">{profile.email || currentUser?.email}</div>

                <div className="ls-stats">
                  <div className="ls-stat">
                    <span className="ls-stat-num">{stats.followers}</span>
                    <span className="ls-stat-label">Followers</span>
                  </div>
                  <div className="ls-stat">
                    <span className="ls-stat-num">{stats.following}</span>
                    <span className="ls-stat-label">Following</span>
                  </div>
                  <div className="ls-stat">
                    <span className="ls-stat-num">{stats.projects}</span>
                    <span className="ls-stat-label">Projects</span>
                  </div>
                </div>

                {profile.skills && profile.skills.length > 0 && (
                  <div className="ls-skills">
                    {profile.skills.map((skill, i) => (
                      <span key={i} className="ls-skill-pill">{skill}</span>
                    ))}
                  </div>
                )}

                <div className="ls-divider"></div>

                <div className="ls-heading">MY PROJECTS</div>
                {myProjects.length === 0 ? (
                  <div style={{fontSize:'12px', color:'var(--text-secondary)'}}>No projects yet</div>
                ) : (
                  <>
                    {myProjects.slice(0, 3).map(p => (
                      <Link key={p.id} to={`/project/${p.id}`} className="ls-project">
                        {p.image_url ? (
                          <img src={p.image_url} alt="Cover" />
                        ) : (
                          <div className="ls-project-placeholder" style={{ background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                            {p.title ? p.title.charAt(0).toUpperCase() : 'P'}
                          </div>
                        )}
                        <div className="ls-project-name">{p.title}</div>
                      </Link>
                    ))}
                    {myProjects.length > 3 && (
                      <Link to="/profile" style={{ fontSize: '12px', color: '#A855F7', textDecoration: 'none', display: 'block', padding: '0 8px', marginTop: '4px', fontWeight: '500' }}>
                        View All
                      </Link>
                    )}
                  </>
                )}

                <div className="ls-divider"></div>

                <div className="ls-heading">SUGGESTED USERS</div>
                {suggestedUsers.length === 0 ? (
                  <div style={{fontSize:'12px', color:'var(--text-secondary)', marginBottom:'20px'}}>No suggestions right now</div>
                ) : (
                  <>
                    {suggestedUsers.map(u => (
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
                        <button className="rs-btn" onClick={() => handleFollowUser(u.id)}>Follow</button>
                      </div>
                    ))}
                    {suggestedUsers.length > 0 && (
                      <Link to="/" style={{ fontSize: '12px', color: '#A855F7', textDecoration: 'none', display: 'block', padding: '0 8px', marginTop: '4px', fontWeight: '500' }}>
                        Find more
                      </Link>
                    )}
                  </>
                )}

                <div className="ls-heading" style={{marginTop:'24px'}}>TRENDING PROJECTS</div>
                {trendingProjects.length === 0 ? (
                  <div style={{fontSize:'12px', color:'var(--text-secondary)', marginBottom:'20px'}}>No trending projects</div>
                ) : (
                  <>
                    {trendingProjects.map(p => (
                      <div key={p.id} className="rs-project">
                        {p.image_url ? (
                          <img src={p.image_url} alt="Project" style={{width:'32px', height:'32px', borderRadius:'6px', objectFit:'cover'}} />
                        ) : (
                          <div className="ls-project-placeholder" style={{width:'32px', height:'32px', borderRadius:'6px'}}>P</div>
                        )}
                        <div className="rs-project-info">
                          <div className="rs-project-name" onClick={() => navigate(`/project/${p.id}`)} style={{cursor:'pointer'}}>{p.title}</div>
                        </div>
                        <button className="rs-btn" onClick={() => handleFollowProject(p.id)}>Track</button>
                      </div>
                    ))}
                    {trendingProjects.length > 0 && (
                      <Link to="/project-hub" style={{ fontSize: '12px', color: '#A855F7', textDecoration: 'none', display: 'block', padding: '0 8px', marginTop: '4px', fontWeight: '500' }}>
                        See all
                      </Link>
                    )}
                  </>
                )}

                <div className="ls-heading" style={{marginTop:'24px'}}>DISCOVER</div>
                <button className="btn-outline-full" onClick={() => navigate('/explore')}>
                  Explore All Posts
                </button>
              </>
            ) : (
              <div style={{color:'var(--text-secondary)', fontSize:'13px'}}>Please log in to view your profile.</div>
            )}
          </div>

          {/* MIDDLE FEED (Now right feed flex 1) */}
          <div className="middle-feed">

            {/* SEARCH & FILTERS */}
            <div className="search-filters-container">
              <div className="search-bar">
                <input
                  placeholder="Search posts or users..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <button onClick={handleSearch}>Search</button>
              </div>

              <div className="filters-bar">
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="All">Category: All</option>
                  <option value="Discussion">Discussion</option>
                  <option value="Question">Question</option>
                  <option value="Help Request">Help Request</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Collaboration">Collaboration</option>
                  <option value="Project Update">Project Update</option>
                </select>

                <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                  <option value="All">Topic: All</option>
                  <option value="Design">Design</option>
                  <option value="Technology">Technology</option>
                  <option value="Startups">Startups</option>
                  <option value="Marketing">Marketing</option>
                  <option value="AI">AI</option>
                  <option value="Growth">Growth</option>
                </select>

                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="latest">Sort: Latest</option>
                  <option value="top">Sort: Top</option>
                  <option value="most_replies">Sort: Most Replies</option>
                </select>
              </div>
            </div>

            {userSearchResults.length > 0 && (
              <div className="user-search-results" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Users</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {userSearchResults.map(u => (
                    <div key={u.id} onClick={() => navigate(`/profile/${u.username}`)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                          {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                        </div>
                      )}
                      <div>
                        <div style={{ color: '#fff', fontWeight: '600' }}>{u.name || "User"}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>@{u.username} {u.bio ? `• ${u.bio.substring(0, 40)}${u.bio.length > 40 ? '...' : ''}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="feed-tabs">
              <button 
                className={`feed-tab ${feedType === 'All' ? 'active' : ''}`}
                onClick={() => setFeedType('All')}
              >
                All
              </button>
              <button 
                className={`feed-tab ${feedType === 'Posts' ? 'active' : ''}`}
                onClick={() => setFeedType('Posts')}
              >
                Posts
              </button>
              <button 
                className={`feed-tab ${feedType === 'Projects' ? 'active' : ''}`}
                onClick={() => setFeedType('Projects')}
              >
                Projects
              </button>
            </div>

            <CreatePost onPostCreated={handleRefresh} />

            <Feed 
              refresh={refresh} 
              feedType={feedType} 
              currentUser={currentUser}
              search={searchTrigger}
              category={category}
              topic={topic}
              sort={sort}
            />
          </div>

        </div>
      </div>
    </>
  );
};