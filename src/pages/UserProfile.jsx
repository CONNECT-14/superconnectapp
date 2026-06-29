import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import SkeletonLoader from "../components/SkeletonLoader";
import FollowModals from "../components/FollowModals";

const styles = `
  :root {
    --bg: #0F0F11;
    --surface: #1A1A1F;
    --border: #2A2A2F;
    --ink: #F4F4F5;
    --ink-muted: #A1A1AA;
    --accent: #7C3AED;
    --accent-hover: #6D28D9;
    --shadow: 0 4px 12px rgba(0,0,0,0.2);
    --radius: 12px;
    --transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .profile-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'Inter', sans-serif;
    color: var(--ink);
    padding: 80px 24px 80px;
  }

  .profile-inner {
    max-width: 760px;
    margin: 0 auto;
  }

  .profile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 48px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }

  .profile-header h2 {
    font-family: 'Inter', sans-serif;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1;
    color: var(--ink);
  }

  .btn-follow-user {
    background: transparent;
    border: 1.5px solid var(--accent);
    color: var(--accent);
    padding: 8px 16px;
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-follow-user:hover {
    background: var(--accent);
    color: #fff;
  }
  .btn-follow-user.active {
    background: var(--accent);
    color: #fff;
  }

  .section-label {
    font-size: 15px;
    font-weight: bold;
    color: white;
    text-transform: uppercase;
    margin-bottom: 16px;
    border-left: 3px solid #7C3AED;
    padding-left: 8px;
  }

  .projects-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .project-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    cursor: pointer;
    position: relative;
    transition: transform var(--transition), border-color var(--transition);
  }
  
  .project-card:hover { 
    transform: translateY(-2px); 
    border-color: var(--accent);
  }

  .project-list-img {
    width: 100%;
    height: 180px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid var(--border);
  }
  .project-tag {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
  .tag-idea { background: rgba(59, 130, 246, 0.15); color: #60A5FA; }
  .tag-in-progress { background: rgba(16, 185, 129, 0.15); color: #10B981; }
  .tag-live { background: rgba(245, 158, 11, 0.15); color: #FBBF24; }

  .profile-info-section {
    margin-bottom: 48px;
  }
  .profile-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .profile-banner {
    position: relative;
    height: 100px;
    background: linear-gradient(135deg, #1A1A1F, #2D1B69);
    width: 100%;
    background-size: cover;
    background-position: center;
  }
  .avatar-wrapper {
    position: relative;
    width: 88px;
    height: 88px;
    border-radius: 50%;
    margin-top: -40px;
    margin-left: 24px;
    border: 3px solid #0F0F11;
    overflow: hidden;
    flex-shrink: 0;
  }
  .profile-avatar {
    width: 100%;
    height: 100%;
    background: var(--accent);
    color: white;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .profile-details {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .profile-details h3 {
    font-family: 'Inter', sans-serif;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 2px;
  }
  .profile-meta {
    font-size: 0.95rem;
    color: var(--ink-muted);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ── Posts Section ── */
  .my-posts-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .my-post-card {
    background: #1A1A1F;
    border: 1px solid #2A2A2F;
    border-radius: 12px;
    padding: 16px;
    position: relative;
    transition: border-color 0.2s ease;
  }

  .my-post-card:hover {
    border-color: var(--accent);
  }

  .my-post-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .my-post-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .my-post-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .my-post-username {
    font-weight: 600;
    font-size: 1rem;
    color: #F4F4F5;
  }

  .my-post-content {
    margin-top: 12px;
    font-size: 0.95rem;
    line-height: 1.6;
    color: #A1A1AA;
  }

  .my-post-tags {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    flex-wrap: wrap;
  }

  .my-post-tag {
    background: rgba(124, 58, 237, 0.12);
    padding: 4px 10px;
    font-size: 0.75rem;
    border-radius: 20px;
    color: #A855F7;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .my-post-image {
    width: 100%;
    max-height: 400px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid var(--border);
    margin-top: 12px;
  }

  .my-post-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 12px;
  }

  .my-post-like {
    background: #0F0F11;
    border: 1px solid var(--border);
    padding: 6px 14px;
    border-radius: 20px;
    color: var(--ink);
    font-size: 0.85rem;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    cursor: default;
  }

  .my-post-comments-btn {
    background: none;
    border: none;
    color: #A1A1AA;
    font-size: 13px;
    cursor: pointer;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: 'Inter', sans-serif;
    padding: 0;
    transition: color 0.2s ease;
  }

  .my-post-comments-btn:hover {
    color: #7C3AED;
  }

  .my-post-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--ink-muted);
  }

  .my-post-empty p {
    font-size: 0.95rem;
  }

  .my-post-comments-container {
    max-height: 140px;
    overflow-y: auto;
    background: #0F0F11;
    padding: 12px 16px;
    border-radius: 8px;
    margin-top: 12px;
    border: 1px solid var(--border);
  }

  .my-post-comment-item {
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
    font-size: 0.9rem;
    line-height: 1.4;
    color: #A1A1AA;
  }

  .my-post-comment-item:last-child {
    border-bottom: none;
  }

  .my-post-comment-user {
    font-weight: 600;
    color: #A855F7;
    margin-right: 4px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .my-post-comment-box {
    display: flex;
    margin-top: 12px;
    gap: 8px;
  }

  .my-post-comment-box input {
    flex: 1;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: #0F0F11;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    color: #F4F4F5;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .my-post-comment-box input:focus {
    border-color: #7C3AED;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
  }

  .my-post-comment-box button {
    padding: 0 16px;
    background: #7C3AED;
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
    font-family: 'Inter', sans-serif;
  }

  .my-post-comment-box button:hover {
    background: #6D28D9;
  }

  .my-post-comments-container::-webkit-scrollbar {
    width: 4px;
  }
  .my-post-comments-container::-webkit-scrollbar-thumb {
    background: #2A2A2F;
    border-radius: 10px;
  }
`;

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [modalType, setModalType] = useState(null);

  // Posts state
  const [userPosts, setUserPosts] = useState([]);
  const [postsCount, setPostsCount] = useState(0);
  const [postLikes, setPostLikes] = useState({});
  const [postComments, setPostComments] = useState({});
  const [showPostComments, setShowPostComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const init = async () => {
    const start = Date.now();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      setCurrentUser(user);

      await fetchUser();
      await fetchProjects();
      await fetchUserPosts();
      await fetchFollowStats();
      if (user) await checkFollowStatus(user.id);
      
    } catch(err) {
      console.error(err);
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    setUserProfile(data);
  };

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    setProjects(data || []);
  };

  const fetchFollowStats = async () => {
    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", id);

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", id);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
  };

  const fetchUserPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`*, profiles(name, avatar_url)`)
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user posts:", error.message);
      return;
    }

    const parsed = (data || []).map(p => {
      if (p.content && p.content.startsWith("{") && p.content.includes('"text"')) {
        try {
          const obj = JSON.parse(p.content);
          return { ...p, content: obj.text || "", category: obj.category, topic: obj.topic };
        } catch (e) {}
      }
      return p;
    });

    setUserPosts(parsed);
    setPostsCount(parsed.length);

    const likesMap = {};
    for (const post of parsed) {
      const { data: likes } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", post.id);
      likesMap[post.id] = likes?.length || 0;
    }
    setPostLikes(likesMap);
  };

  const fetchPostComments = async (postId) => {
    const { data } = await supabase
      .from("comments")
      .select(`*, profiles(name, avatar_url)`)
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    setPostComments(prev => ({ ...prev, [postId]: data || [] }));
  };

  const togglePostComments = async (postId) => {
    const isShowing = showPostComments[postId];
    if (!isShowing) await fetchPostComments(postId);
    setShowPostComments(prev => ({ ...prev, [postId]: !isShowing }));
  };

  const handlePostComment = async (postId) => {
    if (!currentUser || !commentInputs[postId]?.trim()) return;
    const { error } = await supabase.from("comments").insert([{
      user_id: currentUser.id,
      post_id: postId,
      content: commentInputs[postId],
    }]);
    if (!error) {
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      await fetchPostComments(postId);
    }
  };

  const checkFollowStatus = async (currentUserId) => {
    const { data } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", currentUserId)
      .eq("following_id", id);
    setIsFollowingUser(data?.length > 0);
  };

  const handleFollowUser = async () => {
    if (!currentUser) return;
    if (isFollowingUser) {
      await supabase.from("follows").delete().match({ follower_id: currentUser.id, following_id: id });
      setIsFollowingUser(false);
      setFollowersCount(prev => prev - 1);
    } else {
      await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: id });
      setIsFollowingUser(true);
      setFollowersCount(prev => prev + 1);
      
      // Add notification
      await supabase.from("notifications").insert({
        user_id: id,
        type: 'follow',
        from_user_id: currentUser.id,
        message: 'started following you'
      });
    }
  };

  if (loading) return (
    <div className="profile-root">
      <div className="profile-inner">
        <SkeletonLoader type="profile" />
      </div>
    </div>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="profile-root">
        <div className="profile-inner">
          <div className="profile-header">
            <h2>{userProfile?.name || "User Profile"}</h2>
            {currentUser && currentUser.id !== id && (
              <button 
                className={`btn-follow-user ${isFollowingUser ? "active" : ""}`}
                onClick={handleFollowUser}
              >
                {isFollowingUser ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>

          {userProfile && (
            <div className="profile-info-section">
              <p className="section-label">User Info</p>
              
              <div className="profile-card">
                 <div className="profile-banner" style={userProfile?.banner_url ? { backgroundImage: `url(${userProfile.banner_url})` } : {}}>
                 </div>
                 
                 <div className="avatar-wrapper">
                   <div className="profile-avatar">
                     {userProfile?.avatar_url ? (
                       <img src={userProfile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     ) : (
                       userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : "U"
                     )}
                   </div>
                 </div>
                 
                 <div className="profile-details" style={{ padding: '16px 24px 24px 24px' }}>
                   <h3>{userProfile?.name || "User"}</h3>
                   {userProfile?.occupation && <p className="profile-meta">💼 {userProfile.occupation}</p>}
                   {userProfile?.age && <p className="profile-meta">🎂 {userProfile.age} years old</p>}
                   
                   <div className="profile-stats" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setModalType('followers')}>
                       <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{followersCount}</span>
                       <span style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px' }}>Followers</span>
                     </div>
                     <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setModalType('following')}>
                       <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{followingCount}</span>
                       <span style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px' }}>Following</span>
                     </div>
                     <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                       <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{projects.length}</span>
                       <span style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px' }}>Projects</span>
                     </div>
                     <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                       <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{postsCount}</span>
                       <span style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px' }}>Posts</span>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          )}

          <div>
            <p className="section-label">Projects ({projects.length})</p>
            <div className="projects-list">
              {projects.length === 0 ? (
                <p style={{ color: "var(--ink-muted)" }}>No projects yet.</p>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="project-card"
                    onClick={() => navigate(`/project/${proj.id}`)}
                  >
                    {proj.image_url && (
                      <img src={proj.image_url} alt="cover" className="project-list-img" />
                    )}
                    <div>
                      <span className={`project-tag tag-${(proj.status || 'idea').replace(' ', '-')}`}>
                        {proj.status || 'idea'}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{proj.title}</h4>
                    {proj.description && (
                      <p style={{ fontSize: "0.95rem", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                        {proj.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* POSTS SECTION */}
          <div style={{ marginTop: '48px' }}>
            <p className="section-label">Posts ({postsCount})</p>
            <div className="my-posts-list">
              {userPosts.length === 0 ? (
                <div className="my-post-empty">
                  <p>No posts yet.</p>
                </div>
              ) : (
                userPosts.map(post => {
                  let images = [];
                  if (post.image_urls?.length > 0) images = post.image_urls;
                  else if (post.image_url) images = [post.image_url];

                  return (
                    <div key={post.id} className="my-post-card">
                      <div className="my-post-header">
                        <div className="my-post-avatar">
                          {userProfile?.avatar_url ? (
                            <img src={userProfile.avatar_url} alt="avatar" />
                          ) : (
                            userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : "U"
                          )}
                        </div>
                        <span className="my-post-username">{userProfile?.name || "User"}</span>
                      </div>
                      <div className="my-post-content">
                        <p>{post.content}</p>
                      </div>
                      {(post.category || post.topic) && (
                        <div className="my-post-tags">
                          {post.category && <span className="my-post-tag">{post.category}</span>}
                          {post.topic && <span className="my-post-tag">{post.topic}</span>}
                        </div>
                      )}
                      {images.length > 0 && (
                        <img src={images[0]} alt="post" className="my-post-image" />
                      )}
                      <div className="my-post-actions">
                        <span className="my-post-like">❤️ {postLikes[post.id] || 0}</span>
                        <button className="my-post-comments-btn" onClick={() => togglePostComments(post.id)}>
                          💬 {showPostComments[post.id] ? "Hide comments" : "Show comments"}
                        </button>
                      </div>
                      {showPostComments[post.id] && (
                        <>
                          <div className="my-post-comments-container">
                            {(postComments[post.id] || []).length === 0 ? (
                              <p style={{ color: 'var(--ink-muted)', fontSize: '13px' }}>No comments yet.</p>
                            ) : (
                              (postComments[post.id] || []).slice(0, 4).map(c => (
                                <div key={c.id} className="my-post-comment-item">
                                  <span className="my-post-comment-user">
                                    {c.profiles?.avatar_url ? (
                                      <img src={c.profiles.avatar_url} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                      <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--border)', color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                        {c.profiles?.name ? c.profiles.name.charAt(0).toUpperCase() : "U"}
                                      </span>
                                    )}
                                    {c.profiles?.name || "User"}
                                  </span>
                                  : {c.content}
                                </div>
                              ))
                            )}
                          </div>
                          <div className="my-post-comment-box">
                            <input
                              value={commentInputs[post.id] || ""}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Write a comment..."
                              onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(post.id); }}
                            />
                            <button onClick={() => handlePostComment(post.id)}>Post</button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      <FollowModals 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)} 
        type={modalType} 
        userId={id} 
      />
    </>
  );
}