import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useFollow from '../hooks/useFollow';

export default function UserCard({ 
  user, 
  currentUser, 
  variant = 'grid', 
  initialIsFollowing = false,
  onFollowToggle
}) {
  // If the passed object is already a profile, use it directly. Otherwise use user.profiles.
  const profile = user.profiles || user;
  const userId = profile.id || user.id || user.following_id || user.follower_id;
  
  const { isFollowing, toggleFollow, setIsFollowing, loading: isTogglingFollow } = useFollow(
    currentUser?.id, 
    userId
  );

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing, setIsFollowing]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFollow();
    if (onFollowToggle) {
      onFollowToggle(userId, !isFollowing);
    }
  };

  const avatarUrl = profile.avatar_url;
  const username = profile.username || userId;
  const name = profile.name || "User";
  const occupation = profile.occupation || "Member";

  if (variant === 'list') {
    return (
      <div className="rs-user" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to={`/profile/${username}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div className="rs-user-placeholder" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="rs-user-info" style={{ flex: 1, overflow: 'hidden' }}>
            <div className="rs-user-name" style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            {profile.username && <div className="rs-user-occ" style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '12px' }}>@{profile.username}</div>}
            <div className="rs-user-occ" style={{ marginTop: '2px', color: 'var(--text-secondary)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{occupation}</div>
          </div>
        </Link>
        {currentUser && currentUser.id !== userId && (
          <button 
            className="rs-btn" 
            onClick={handleToggle} 
            disabled={isTogglingFollow} 
            style={{ 
              opacity: isTogglingFollow ? 0.7 : 1,
              background: isFollowing ? 'transparent' : 'var(--accent)',
              border: isFollowing ? '1px solid var(--border)' : 'none',
              color: isFollowing ? 'var(--text-primary)' : 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            {isTogglingFollow ? "..." : isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>
    );
  }

  // Grid variant (default for Followers / Following)
  return (
    <div className="card-new" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <Link 
        to={`/profile/${username}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px' }} />
        ) : (
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ fontWeight: '600', fontSize: '1.1rem', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{name}</div>
      </Link>
      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{occupation}</div>
      {currentUser && currentUser.id !== userId && (
        <button 
          className="follow-back-btn" 
          onClick={handleToggle}
          disabled={isTogglingFollow}
          style={{ 
            marginTop: '16px', 
            background: isFollowing ? 'transparent' : 'var(--accent)', 
            color: isFollowing ? 'var(--accent)' : 'white', 
            border: isFollowing ? '1px solid rgba(124, 58, 237, 0.5)' : 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          {isTogglingFollow ? "..." : isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}
