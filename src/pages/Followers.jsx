import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SkeletonLoader from "../components/SkeletonLoader";
import BackgroundParticles from "../components/BackgroundParticles";

const styles = `

  .page-root {
    min-height: 100vh;
    background: var(--bg-app);
    font-family: 'Inter', sans-serif;
    color: var(--text-primary);
    padding: 80px 24px 80px;
  }

  .page-inner {
    max-width: 900px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    background: transparent;
  }
  
  .page-inner::before, .page-inner::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 80px;
    pointer-events: none;
    z-index: -1;
  }
  
  .page-inner::before {
    left: 0;
    background: linear-gradient(to right, var(--bg-app), transparent);
  }
  
  .page-inner::after {
    right: 0;
    background: linear-gradient(to left, var(--bg-app), transparent);
  }

  .page-subtitle {
    color: var(--text-secondary);
    font-size: 15px;
    margin-top: 4px;
  }

  .page-header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }

  .page-header h2 {
    font-family: 'Inter', sans-serif;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1;
    color: var(--text-primary);
  }

  .page-header .dot {
    display: none;
  }

  .section-label {
    font-size: 16px;
    font-weight: bold;
    color: var(--text-primary);
    text-transform: uppercase;
    margin: 32px 0 16px;
    border-left: 3px solid var(--accent);
    padding-left: 8px;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .card-new {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: transform 0.2s ease, border-color 0.2s ease;
    cursor: pointer;
  }
  
  .card-new:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }

  .follow-back-btn {
    margin-top: 16px;
    background: transparent;
    border: 1px solid rgba(124, 58, 237, 0.5);
    color: var(--accent);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }
  
  .follow-back-btn:hover {
    background: rgba(124, 58, 237, 0.1);
    border-color: var(--accent);
  }

  .empty-msg {
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .page-root {
      padding: 80px 16px 80px;
    }
    .grid-container {
      grid-template-columns: 1fr;
    }
  }
`;

export default function Followers() {
  const [followers, setFollowers] = useState([]);
  const [myFollowing, setMyFollowing] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFollowers();
  }, []);

  const fetchFollowers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

    if (!user) return;
    
    setCurrentUser(user);

    const { data: followingData } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
      
    const followingIds = followingData?.map(f => f.following_id) || [];
    setMyFollowing(followingIds);

    const { data } = await supabase
      .from("follows")
      .select("*")
      .eq("following_id", user.id); // 🔥 IMPORTANT

    const ids = (data || []).map((f) => f.follower_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, occupation")
      .in("id", ids);

    const merged = (data || []).map((f) => ({
      ...f,
      profiles: (profiles || []).find((p) => p.id === f.follower_id),
    }));

    setFollowers(merged);
    setLoading(false);
    } catch(err) {
      console.error("Session error:", err);
      setLoading(false);
    }
  };

  const followBack = async (e, userIdToFollow) => {
    e.stopPropagation();
    if (!currentUser) return;
    await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: userIdToFollow });
    setMyFollowing(prev => [...prev, userIdToFollow]);
    
    // Add notification
    await supabase.from("notifications").insert({
      user_id: userIdToFollow,
      type: 'follow',
      from_user_id: currentUser.id,
      message: 'started following you'
    });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="page-root">
        <BackgroundParticles variant="split" />
        <div className="page-inner">
          <div className="page-header" style={{ flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            <h2>Followers</h2>
            <p className="page-subtitle">People who follow you</p>
          </div>

          <div className="section-label">Your Followers</div>

          {loading ? (
             <>
               <SkeletonLoader type="block" />
               <SkeletonLoader type="block" />
             </>
          ) : followers.length === 0 ? (
            <p className="empty-msg">No followers</p>
          ) : (
            <div className="grid-container">
              {followers.map((f, i) => (
                <div 
                  key={i} 
                  className="card-new"
                  onClick={() => navigate(`/profile/${f.follower_id}`)}
                >
                  {f.profiles?.avatar_url ? (
                    <img src={f.profiles.avatar_url} alt="avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px' }} />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                      {f.profiles?.name ? f.profiles.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{f.profiles?.name || "User"}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{f.profiles?.occupation || "Member"}</div>
                  {!myFollowing.includes(f.follower_id) && (
                    <button className="follow-back-btn" onClick={(e) => followBack(e, f.follower_id)}>
                      Follow Back
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}