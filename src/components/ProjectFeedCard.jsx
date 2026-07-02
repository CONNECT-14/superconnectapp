import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { supabase } from "../supabaseClient";
import { timeAgo } from "../utils/format";
import "./PostCard.css";

export default function ProjectFeedCard({ project }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [isFollowingAction, setIsFollowingAction] = useState(false);
  const [isHiring, setIsHiring] = useState(false);

  useEffect(() => {
    if (user) checkFollow(user);
    checkHiring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, user]);

  const checkHiring = async () => {
    const { count } = await supabase
      .from('collab_requests')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .eq('status', 'open');
    setIsHiring((count || 0) > 0);
  };

  const checkFollow = async (currentUser) => {
    if (currentUser.id === project.user_id) return;
    const { data } = await supabase
      .from("project_followers")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("project_id", project.id);
    setFollowing(data?.length > 0);
  };

  const handleFollow = async () => {
    if (!user) return;
    setIsFollowingAction(true);
    if (following) {
      await supabase
        .from("project_followers")
        .delete()
        .eq("user_id", user.id)
        .eq("project_id", project.id);
      setFollowing(false);
    } else {
      const { error } = await supabase.from("project_followers").insert([
        { user_id: user.id, project_id: project.id },
      ]);
      if (!error) {
        setFollowing(true);
      }
    }
    setIsFollowingAction(false);
  };

  const creatorName = project.profiles?.name || "User";
  const avatarUrl = project.profiles?.avatar_url;
  
  const timeStr = project.created_at ? timeAgo(project.created_at) : '';

  return (
    <div className="post-card" style={{ position: 'relative' }}>
      {isHiring && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          color: 'white',
          fontSize: '10px', fontWeight: '700',
          padding: '3px 8px', borderRadius: '20px',
          letterSpacing: '0.05em', textTransform: 'uppercase',
          zIndex: 2, boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
        }}>
          🔥 Hiring
        </div>
      )}
      {/* HEADER */}
      <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link 
          to={`/profile/${project.profiles?.username || project.user_id}`}
          className="user-info" 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}
        >
          <div className="avatar" style={{ overflow: 'hidden', width: '40px', height: '40px', borderRadius: '50%' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ background: 'var(--accent)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                {creatorName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span className="username" style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '15px', lineHeight: '1.2' }}>{creatorName}</span>
                {project.profiles?.username && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    @{project.profiles.username}
                  </span>
                )}
              </div>
              <span style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#A855F7', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', marginTop: '2px' }}>PROJECT</span>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>created a project</span>
          </div>
        </Link>
        <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
          {timeStr}
        </div>
      </div>

      {/* PROJECT IMAGE */}
      {project.image_url && (
        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
          <img 
            src={project.image_url} 
            alt="Project Cover" 
            style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px' }} 
          />
        </div>
      )}

      {/* PROJECT INFO */}
      <div style={{ marginTop: project.image_url ? '0' : '16px', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{project.title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {project.description}
        </p>
        <div>
          <span style={{ 
            display: 'inline-block',
            padding: '4px 10px', 
            borderRadius: '16px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            textTransform: 'uppercase',
            background: project.status === 'Live' ? 'rgba(34,197,94,0.1)' : project.status === 'Idea' ? 'rgba(234,179,8,0.1)' : 'rgba(59,130,246,0.1)',
            color: project.status === 'Live' ? '#4ADE80' : project.status === 'Idea' ? '#FDE047' : '#60A5FA'
          }}>
            {project.status || 'Idea'}
          </span>
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <Link 
          to={`/project/${project.id}`} 
          style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}
        >
          View Project &rarr;
        </Link>
        {user && user.id !== project.user_id && (
          <button 
            onClick={handleFollow}
            disabled={isFollowingAction}
            style={{ 
              background: following ? 'var(--accent)' : 'transparent',
              border: '1px solid var(--accent)',
              color: following ? 'white' : 'var(--accent)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isFollowingAction ? 'not-allowed' : 'pointer',
              opacity: isFollowingAction ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isFollowingAction ? <div className="btn-spinner" style={{ borderColor: following ? "rgba(255,255,255,0.3)" : "rgba(124,58,237,0.3)", borderTopColor: following ? "white" : "var(--accent)" }}></div> : following ? 'Tracking' : 'Track'}
          </button>
        )}
      </div>
    </div>
  );
}
