import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const modalStyles = `
  .iu-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(6px);
    z-index: 9000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.18s ease;
  }
  .iu-panel {
    background: #1A1A1F;
    border: 1px solid #2A2A2F;
    border-radius: 20px;
    width: 100%;
    max-width: 560px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideUp 0.2s ease;
  }
  .iu-header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid #2A2A2F;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-shrink: 0;
  }
  .iu-header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .iu-title {
    font-size: 18px;
    font-weight: 700;
    color: #FFFFFF;
    margin: 0;
  }
  .iu-subtitle {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
  }
  .iu-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .btn-iu-close-req {
    background: rgba(239, 68, 68, 0.1);
    color: #F87171;
    border: 1px solid rgba(239,68,68,0.25);
    padding: 7px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    font-family: 'Inter', sans-serif;
    white-space: nowrap;
  }
  .btn-iu-close-req:hover { background: rgba(239,68,68,0.2); }
  .btn-iu-close-req:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-iu-dismiss {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-iu-dismiss:hover { background: rgba(255,255,255,0.06); color: var(--text-primary); }
  .iu-body {
    overflow-y: auto;
    flex: 1;
    padding: 8px 0;
  }
  .iu-body::-webkit-scrollbar { width: 4px; }
  .iu-body::-webkit-scrollbar-thumb { background: #2A2A2F; border-radius: 4px; }
  .iu-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 24px;
    border-bottom: 1px solid rgba(42,42,47,0.6);
    transition: background 0.15s;
  }
  .iu-row:last-child { border-bottom: none; }
  .iu-row:hover { background: rgba(255,255,255,0.02); }
  .iu-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 15px;
    overflow: hidden;
  }
  .iu-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .iu-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .iu-skills-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .iu-skill-tag {
    background: rgba(124,58,237,0.12);
    color: #A855F7;
    border: 1px solid rgba(168,85,247,0.2);
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;
  }
  .iu-message {
    font-size: 12px;
    color: var(--text-secondary);
    font-style: italic;
    line-height: 1.5;
    background: rgba(255,255,255,0.03);
    padding: 8px 10px;
    border-radius: 8px;
    border-left: 2px solid #2A2A2F;
  }
  .iu-row-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }
  .btn-iu-view {
    background: transparent;
    color: #A855F7;
    border: 1px solid rgba(168,85,247,0.3);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    font-family: 'Inter', sans-serif;
    white-space: nowrap;
  }
  .btn-iu-view:hover { background: rgba(124,58,237,0.12); }
  .btn-iu-msg {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid #2A2A2F;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    font-family: 'Inter', sans-serif;
    white-space: nowrap;
  }
  .btn-iu-msg:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
  .iu-empty {
    padding: 48px 24px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 14px;
  }
  .iu-loading {
    padding: 40px 24px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 13px;
  }
  @media (max-width: 600px) {
    .iu-panel {
      max-width: 100%;
      max-height: 100vh;
      border-radius: 0;
      min-height: 100vh;
    }
    .iu-overlay {
      padding: 0;
      align-items: flex-end;
    }
  }
`;

export default function InterestedUsersModal({ collab, onClose, onCloseRequest }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closingReq, setClosingReq] = useState(false);

  useEffect(() => {
    fetchInterestedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collab.id]);

  const fetchInterestedUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('collab_interests')
      .select('*, profiles:user_id(*)')
      .eq('collab_request_id', collab.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const handleCloseRequest = async () => {
    setClosingReq(true);
    await supabase
      .from('collab_requests')
      .update({ status: 'closed' })
      .eq('id', collab.id);
    setClosingReq(false);
    if (onCloseRequest) onCloseRequest();
  };

  return (
    <>
      <style>{modalStyles}</style>
      <div className="iu-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="iu-panel">
          {/* HEADER */}
          <div className="iu-header">
            <div className="iu-header-left">
              <h2 className="iu-title">Interested Users</h2>
              <p className="iu-subtitle">
                {users.length} {users.length === 1 ? 'person' : 'people'} interested in your <strong style={{ color: '#A855F7' }}>{collab.role}</strong> request
              </p>
            </div>
            <div className="iu-header-right">
              {collab.status === 'open' && (
                <button
                  className="btn-iu-close-req"
                  onClick={handleCloseRequest}
                  disabled={closingReq}
                >
                  {closingReq ? 'Closing...' : '⛔ Close Request'}
                </button>
              )}
              <button className="btn-iu-dismiss" onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="iu-body">
            {loading ? (
              <div className="iu-loading">Loading...</div>
            ) : users.length === 0 ? (
              <div className="iu-empty">
                <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.3 }}>👥</div>
                <div>No one has expressed interest yet.</div>
                <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.6 }}>Share your collab request to attract candidates!</div>
              </div>
            ) : (
              users.map(interest => {
                const profile = interest.profiles;
                const name = profile?.name || 'User';
                const username = profile?.username;
                const avatarUrl = profile?.avatar_url;
                const skills = profile?.skills || [];

                return (
                  <div key={interest.id} className="iu-row">
                    <div 
                      style={{ display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer', flex: 1, textDecoration: 'none', color: 'inherit' }}
                      onClick={() => { onClose(); navigate(`/profile/${username || profile?.id}`); }}
                    >
                      {/* AVATAR */}
                      <div className="iu-avatar">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>
  
                      {/* INFO */}
                      <div className="iu-info">
                        <span className="iu-name">{name}</span>
                      {skills.length > 0 && (
                        <div className="iu-skills-row">
                          {skills.slice(0, 5).map(skill => (
                            <span key={skill} className="iu-skill-tag">#{skill}</span>
                          ))}
                        </div>
                      )}
                      {interest.message && (
                        <div className="iu-message">"{interest.message}"</div>
                      )}
                    </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="iu-row-actions">
                      <button
                        className="btn-iu-view"
                        onClick={() => { onClose(); navigate(`/profile/${username || profile?.id}`); }}
                      >
                        View Profile
                      </button>
                      <button
                        className="btn-iu-msg"
                        onClick={() => { onClose(); navigate(`/messages?userId=${profile?.id}`); }}
                      >
                        Message
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
