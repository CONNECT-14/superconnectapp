import CollabCard from "../CollabCard";

export default function ProfileCollabs({
  myCollabs,
  collabsLoading,
  profileData,
  user,
  setMyCollabs
}) {
  return (
    <div style={{ marginTop: '48px' }}>
      <p className="section-label">Collab Requests ({myCollabs.length})</p>
      {collabsLoading ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '16px 0' }}>Loading...</div>
      ) : myCollabs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-secondary)', fontSize: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px', opacity: 0.4 }}>🤝</div>
          <div>No collab requests posted yet.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {myCollabs.map(collab => (
            <CollabCard
              key={collab.id}
              collab={{ ...collab, creator: profileData }}
              currentUser={user}
              compact={true}
              onCloseRequest={(cid) => setMyCollabs(prev => prev.map(c => c.id === cid ? { ...c, status: 'closed' } : c))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
