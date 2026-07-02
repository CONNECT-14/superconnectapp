import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import SkeletonLoader from "../components/SkeletonLoader";
import BackgroundParticles from "../components/BackgroundParticles";
import UserCard from "../components/UserCard";

const styles = `
  :root {
    --bg-app: #0F0F11;
    --bg-card: #1A1A1F;
    --border: #2A2A2F;
    --text-primary: #F4F4F5;
    --text-secondary: #A1A1AA;
    --accent: #7C3AED;
  }

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
    background: #0F0F1180;
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
    background: linear-gradient(to right, #0F0F11, transparent);
  }
  
  .page-inner::after {
    right: 0;
    background: linear-gradient(to left, #0F0F11, transparent);
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
    color: white;
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

  .unfollow-btn {
    margin-top: 16px;
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.5);
    color: #EF4444;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }
  
  .unfollow-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #EF4444;
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

export default function Following() {
  const { user } = useAuth();
  const [following, setFollowing] = useState([]);
  const [projectFollowing, setProjectFollowing] = useState([]); // ✅ NEW
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        if (!user) return;
        setLoading(true);
        await Promise.all([
          fetchFollowing(user.id),
          fetchProjectFollowing(user.id)
        ]);
        setLoading(false);
      } catch(err) {
        console.error("Session error:", err);
        setLoading(false);
      }
    };
    
    if (user) {
      init();
    }
  }, [user]);

  // 🔥 FETCH FOLLOWING USERS
  const fetchFollowing = async (userId) => {
    const { data, error } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", userId);

    if (error) {
      console.log(error);
      return;
    }

    if (!data || data.length === 0) {
      setFollowing([]);
      return;
    }

    const ids = data.map((f) => f.following_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, username")
      .in("id", ids);

    const merged = data.map((f) => ({
      ...f,
      profiles: profiles?.find((p) => p.id === f.following_id),
    }));

    setFollowing(merged);
  };

  const fetchProjectFollowing = async (userId) => {
    const { data, error } = await supabase
      .from("project_followers")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.log(error);
      return;
    }

    if (!data || data.length === 0) {
      setProjectFollowing([]);
      return;
    }

    const ids = data.map((p) => p.project_id);

    const { data: projects } = await supabase
      .from("projects")
      .select("id, title, image_url, user_id")
      .in("id", ids);

    let creators = [];
    if (projects && projects.length > 0) {
      const uids = projects.map(p => p.user_id).filter(Boolean);
      if (uids.length > 0) {
        const { data: cData } = await supabase.from("profiles").select("id, name").in("id", uids);
        creators = cData || [];
      }
    }

    const merged = data.map((p) => {
      const proj = projects?.find((proj) => proj.id === p.project_id);
      const creator = creators.find(c => c.id === proj?.user_id);
      return {
        ...p,
        project: proj,
        creator: creator
      };
    });

    setProjectFollowing(merged);
  };

  const unfollowProject = async (e, projectId) => {
    e.stopPropagation();
    if (!user) return;
    await supabase.from("project_followers").delete().match({ user_id: user.id, project_id: projectId });
    setProjectFollowing(prev => prev.filter(p => p.project_id !== projectId));
  };

  return (
    <>
      <style>{styles}</style>
      <div className="page-root">
        <BackgroundParticles variant="split" />
        <div className="page-inner">
          <div className="page-header" style={{ flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            <h2>Following</h2>
            <p className="page-subtitle">People you follow and projects you track</p>
          </div>

          {/* 🔥 USERS */}
          <div className="section-label">Users</div>

          {loading ? (
             <>
               <SkeletonLoader type="block" />
               <SkeletonLoader type="block" />
             </>
          ) : following.length === 0 ? (
            <p className="empty-msg">No users followed</p>
          ) : (
            <div className="grid-container">
              {following.map((f, index) => (
                <UserCard 
                  key={index}
                  user={f}
                  currentUser={user}
                  variant="grid"
                  initialIsFollowing={true}
                  onFollowToggle={(userId, isFollowing) => {
                    if (!isFollowing) {
                      setFollowing(prev => prev.filter(item => item.following_id !== userId));
                    }
                  }}
                />
              ))}
            </div>
          )}

          {/* 🔥 PROJECTS */}
          <div className="section-label">Projects</div>

          {loading ? (
             <>
               <SkeletonLoader type="block" />
               <SkeletonLoader type="block" />
             </>
          ) : projectFollowing.length === 0 ? (
            <p className="empty-msg">No projects followed</p>
          ) : (
            <div className="grid-container">
              {projectFollowing.map((p, index) => (
                <div
                  key={index}
                  className="card-new"
                  onClick={() => navigate(`/project/${p.project_id}`)}
                >
                  {p.project?.image_url ? (
                    <img src={p.project.image_url} alt="cover" style={{ width: '100%', height: '80px', borderRadius: '8px', objectFit: 'cover', marginBottom: '12px' }} />
                  ) : (
                    <div style={{ width: '100%', height: '80px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    </div>
                  )}
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{p.project?.title || "Project"}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>by {p.creator?.name || "User"}</div>
                  <button className="unfollow-btn" onClick={(e) => unfollowProject(e, p.project_id)}>
                    Untrack Project
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}