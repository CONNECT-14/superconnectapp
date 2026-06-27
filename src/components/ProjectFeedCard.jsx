import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./PostCard.css";

export default function ProjectFeedCard({ project }) {
  const [user, setUser] = useState(null);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;
      if (!currentUser) return;
      setUser(currentUser);
      checkFollow(currentUser);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

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
  };

  const creatorName = project.profiles?.name || "User";
  const avatarUrl = project.profiles?.avatar_url;
  
  // Format timestamp safely
  let timeStr = "";
  if (project.created_at) {
    const d = new Date(project.created_at);
    timeStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return (
    <div className="post-card">
      {/* HEADER */}
      <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="username" style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>{creatorName}</span>
              <span style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#A855F7', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>PROJECT</span>
            </div>
            <span style={{ color: 'var(--ink-muted)', fontSize: '13px' }}>created a project</span>
          </div>
        </div>
        <div style={{ color: 'var(--ink-muted)', fontSize: '12px' }}>
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
        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{project.title}</h3>
        <p style={{ color: 'var(--ink-muted)', fontSize: '14px', lineHeight: '1.5', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
            style={{ 
              background: following ? 'var(--accent)' : 'transparent',
              border: '1px solid var(--accent)',
              color: following ? 'white' : 'var(--accent)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );
}
