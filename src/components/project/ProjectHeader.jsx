import { Link } from "react-router-dom";

export default function ProjectHeader({
  project,
  user,
  isCreator,
  isFollowing,
  isTogglingFollow,
  toggleFollow,
  pendingCount,
  openSettings,
  openEditProject,
  setShowPostCollabModal
}) {
  return (
    <>
      {/* ── 1. Banner ── */}
      <div className="pp-banner">
        {project.image_url ? (
          <img src={project.image_url} alt={`${project.title} banner`} />
        ) : (
          <div className="pp-banner-placeholder" />
        )}
      </div>

      {/* ── 2. Header row: title + track button ── */}
      <div className="pp-header-row">
        <h1 className="pp-project-title">{project.title}</h1>
        <div className="pp-header-actions">
          {project.user_id !== user?.id && (
            <button
              className={`btn-track ${isFollowing ? "tracking" : ""}`}
              onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
              disabled={isTogglingFollow}
              style={{ opacity: isTogglingFollow ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isTogglingFollow ? <div className="btn-spinner" style={{ borderColor: isFollowing ? "rgba(255,255,255,0.3)" : "var(--border)", borderTopColor: isFollowing ? "white" : "var(--text-primary)" }}></div> : isFollowing ? "✓ Tracking" : "Track"}
            </button>
          )}
          {isCreator && (
            <>
              <button
                onClick={() => setShowPostCollabModal(true)}
                title="Post Collab Request"
                style={{
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  color: '#A855F7',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'background 0.2s'
                }}
              >
                🤝 Post Collab
              </button>
              <button className="btn-settings" onClick={openEditProject} title="Edit Project">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
              <button className="btn-settings" onClick={openSettings} title="Settings" style={{ position: 'relative' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                {pendingCount > 0 && <span className="pp-badge">{pendingCount}</span>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── 3. Meta row: status + creator + description ── */}
      <div className="pp-meta-row">
        {project.status && (
          <span className="pp-status-badge">{project.status}</span>
        )}
        <Link 
          to={`/profile/${project.profiles?.username || project.user_id}`}
          className="pp-creator" 
          style={{ alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
        >
          {project.profiles?.avatar_url ? (
            <img
              src={project.profiles.avatar_url}
              alt="creator"
              className="pp-creator-avatar"
            />
          ) : (
            <div className="pp-creator-initials">
              {project.profiles?.name
                ? project.profiles.name.charAt(0).toUpperCase()
                : "U"}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontWeight: '600', lineHeight: 1.2 }}>{project.profiles?.name || "Unknown"}</span>
            {project.profiles?.username && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                @{project.profiles.username}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* ── Description row ── */}
      {project.description && (
        <div className="pp-description">
          <p style={{ fontSize: '0.9rem', color: '#71717A', lineHeight: 1.65 }}>{project.description}</p>
        </div>
      )}

      {/* ── 4. Bottom border / divider ── */}
      <div className="pp-header-bottom" />
      
      {/* ── Access Info Row ── */}
      <div className="pp-access-info">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        Viewing: {project.view_access === 'all' ? 'Everyone' : project.view_access === 'members' ? 'Members Only' : project.view_access === 'trackers' ? 'Trackers Only' : 'Creator Only'} &middot; Posting: {project.post_access === 'all' ? 'Everyone' : project.post_access === 'members' ? 'Members Only' : project.post_access === 'trackers' ? 'Trackers Only' : 'Creator Only'}
      </div>
    </>
  );
}
