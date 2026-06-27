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

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const init = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      setCurrentUser(user);

      await fetchUser();
      await fetchProjects();
      await fetchFollowStats();
      if (user) await checkFollowStatus(user.id);
      
      setLoading(false);
    } catch(err) {
      console.error(err);
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
        <SkeletonLoader type="page" />
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