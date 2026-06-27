import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const styles = `
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 24px;
  }
  .modal-content {
    background: #1A1A1F;
    border: 1px solid #2A2A2F;
    border-radius: 12px;
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    padding: 24px;
    position: relative;
    font-family: 'Inter', sans-serif;
    color: #F4F4F5;
  }
  .modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: transparent;
    border: none;
    color: #A1A1AA;
    font-size: 20px;
    cursor: pointer;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 4px;
  }
  .modal-close:hover {
    color: #F4F4F5;
    background: rgba(255,255,255,0.1);
  }
  .modal-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 24px;
    padding-right: 32px;
  }
  .grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .card-new {
    background: #111114;
    border: 1px solid #2A2A2F;
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
    border-color: #7C3AED;
    transform: translateY(-2px);
  }
  .action-btn {
    margin-top: 16px;
    background: transparent;
    border: 1px solid rgba(124, 58, 237, 0.5);
    color: #7C3AED;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }
  .action-btn:hover {
    background: rgba(124, 58, 237, 0.1);
    border-color: #7C3AED;
  }
  .unfollow-btn {
    border-color: rgba(239, 68, 68, 0.5);
    color: #EF4444;
  }
  .unfollow-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #EF4444;
  }
  .section-label {
    font-size: 16px;
    font-weight: bold;
    color: white;
    text-transform: uppercase;
    margin: 24px 0 16px;
    border-left: 3px solid #7C3AED;
    padding-left: 8px;
  }
  .empty-msg {
    color: #A1A1AA;
    font-size: 0.9rem;
    font-style: italic;
  }
  @media (max-width: 600px) {
    .grid-container {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 400px) {
    .grid-container {
      grid-template-columns: 1fr;
    }
  }
`;

export default function FollowModals({ isOpen, onClose, type, userId }) {
  const [list, setList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [myFollowing, setMyFollowing] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      init();
    }
  }, [isOpen, userId, type]);

  const init = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const cUser = session?.user;
    setCurrentUser(cUser);

    if (cUser) {
      const { data: followingData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", cUser.id);
      setMyFollowing(followingData?.map(f => f.following_id) || []);
    }

    if (type === "followers") {
      await fetchFollowers();
    } else {
      await fetchFollowing();
    }
    setLoading(false);
  };

  const fetchFollowers = async () => {
    const { data } = await supabase
      .from("follows")
      .select("*")
      .eq("following_id", userId);
    
    const ids = (data || []).map((f) => f.follower_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, occupation")
      .in("id", ids);

    const merged = (data || []).map((f) => ({
      ...f,
      profiles: (profiles || []).find((p) => p.id === f.follower_id),
    }));
    setList(merged);
  };

  const fetchFollowing = async () => {
    // Users
    const { data: userData } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", userId);

    const userIds = (userData || []).map((f) => f.following_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, occupation")
      .in("id", userIds);

    const mergedUsers = (userData || []).map((f) => ({
      ...f,
      profiles: profiles?.find((p) => p.id === f.following_id),
    }));
    setList(mergedUsers);

    // Projects
    const { data: projectData } = await supabase
      .from("project_followers")
      .select("*")
      .eq("user_id", userId);

    const projectIds = (projectData || []).map((p) => p.project_id);
    const { data: projects } = await supabase
      .from("projects")
      .select("id, title, image_url, user_id")
      .in("id", projectIds);

    let creators = [];
    if (projects && projects.length > 0) {
      const uids = projects.map(p => p.user_id).filter(Boolean);
      if (uids.length > 0) {
        const { data: cData } = await supabase.from("profiles").select("id, name").in("id", uids);
        creators = cData || [];
      }
    }

    const mergedProjects = (projectData || []).map((p) => {
      const proj = projects?.find((proj) => proj.id === p.project_id);
      const creator = creators.find(c => c.id === proj?.user_id);
      return {
        ...p,
        project: proj,
        creator: creator
      };
    });
    setProjectList(mergedProjects);
  };

  const toggleFollow = async (e, targetUserId) => {
    e.stopPropagation();
    if (!currentUser) return;
    
    if (myFollowing.includes(targetUserId)) {
      await supabase.from("follows").delete().match({ follower_id: currentUser.id, following_id: targetUserId });
      setMyFollowing(prev => prev.filter(id => id !== targetUserId));
    } else {
      await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: targetUserId });
      setMyFollowing(prev => [...prev, targetUserId]);
      
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: 'follow',
        from_user_id: currentUser.id,
        message: 'started following you'
      });
    }
  };

  const unfollowProject = async (e, projectId) => {
    e.stopPropagation();
    if (!currentUser) return;
    await supabase.from("project_followers").delete().match({ user_id: currentUser.id, project_id: projectId });
    // Remove from UI only if we are viewing our own following list
    if (userId === currentUser.id) {
      setProjectList(prev => prev.filter(p => p.project_id !== projectId));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{styles}</style>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          <div className="modal-title">
            {type === 'followers' ? 'Followers' : 'Following'}
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {type === 'followers' && (
                <>
                  <div className="section-label">Followers</div>
                  {list.length === 0 ? (
                    <p className="empty-msg">No followers found.</p>
                  ) : (
                    <div className="grid-container">
                      {list.map((f, i) => (
                        <div key={i} className="card-new" onClick={() => { onClose(); navigate("/user/" + f.follower_id); }}>
                          {f.profiles?.avatar_url ? (
                            <img src={f.profiles.avatar_url} alt="avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px' }} />
                          ) : (
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#7C3AED', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
                              {f.profiles?.name ? f.profiles.name.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}
                          <div style={{ fontWeight: '600', fontSize: '1rem' }}>{f.profiles?.name || "User"}</div>
                          <div style={{ color: '#A1A1AA', fontSize: '12px', marginTop: '4px' }}>{f.profiles?.occupation || "Member"}</div>
                          {currentUser && currentUser.id !== f.follower_id && (
                            <button 
                              className={"action-btn " + (myFollowing.includes(f.follower_id) ? "unfollow-btn" : "")} 
                              onClick={(e) => toggleFollow(e, f.follower_id)}
                            >
                              {myFollowing.includes(f.follower_id) ? "Unfollow" : "Follow"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {type === 'following' && (
                <>
                  <div className="section-label">Users</div>
                  {list.length === 0 ? (
                    <p className="empty-msg">No users followed.</p>
                  ) : (
                    <div className="grid-container">
                      {list.map((f, i) => (
                        <div key={i} className="card-new" onClick={() => { onClose(); navigate("/user/" + f.following_id); }}>
                          {f.profiles?.avatar_url ? (
                            <img src={f.profiles.avatar_url} alt="avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px' }} />
                          ) : (
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#7C3AED', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
                              {f.profiles?.name ? f.profiles.name.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}
                          <div style={{ fontWeight: '600', fontSize: '1rem' }}>{f.profiles?.name || "User"}</div>
                          <div style={{ color: '#A1A1AA', fontSize: '12px', marginTop: '4px' }}>{f.profiles?.occupation || "Member"}</div>
                          {currentUser && currentUser.id !== f.following_id && (
                            <button 
                              className={"action-btn " + (myFollowing.includes(f.following_id) ? "unfollow-btn" : "")} 
                              onClick={(e) => toggleFollow(e, f.following_id)}
                            >
                              {myFollowing.includes(f.following_id) ? "Unfollow" : "Follow"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="section-label" style={{ marginTop: '32px' }}>Projects</div>
                  {projectList.length === 0 ? (
                    <p className="empty-msg">No projects followed.</p>
                  ) : (
                    <div className="grid-container">
                      {projectList.map((p, i) => (
                        <div key={i} className="card-new" onClick={() => { onClose(); navigate("/project/" + p.project_id); }}>
                          {p.project?.image_url ? (
                            <img src={p.project.image_url} alt="cover" style={{ width: '100%', height: '70px', borderRadius: '8px', objectFit: 'cover', marginBottom: '12px' }} />
                          ) : (
                            <div style={{ width: '100%', height: '70px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            </div>
                          )}
                          <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{p.project?.title || "Project"}</div>
                          <div style={{ color: '#A1A1AA', fontSize: '11px', marginTop: '4px' }}>by {p.creator?.name || "User"}</div>
                          {currentUser && userId === currentUser.id && (
                            <button className="action-btn unfollow-btn" onClick={(e) => unfollowProject(e, p.project_id)}>
                              Unfollow
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
