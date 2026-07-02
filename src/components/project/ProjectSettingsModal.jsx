import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useDebounce } from "../../hooks/useDebounce";
import { insertNotification } from "../../utils/supabase-helpers";

export default function ProjectSettingsModal({
  project,
  user,
  onClose,
  onUpdateProject,
  setPendingCount
}) {
  const [viewAccess, setViewAccess] = useState(project?.view_access || 'all');
  const [postAccess, setPostAccess] = useState(project?.post_access || 'all');
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [searchResults, setSearchResults] = useState([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUpdatingRequest, setIsUpdatingRequest] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettingsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettingsData = async () => {
    const { data: memData, error: memError } = await supabase
      .from("project_members")
      .select("*, profiles!project_members_user_id_fkey(name, avatar_url, username)")
      .eq("project_id", project.id);
    if (memError) setError("Error fetching members");
    setMembers(memData || []);
    
    const { data: reqData } = await supabase
      .from('project_access_requests')
      .select('*, profiles(name, avatar_url)')
      .eq('project_id', project.id)
      .eq('status', 'pending');
    setPendingRequests(reqData || []);
    if (setPendingCount) setPendingCount((reqData || []).length);
  };

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const runSearch = async () => {
      const { data, searchError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, username')
        .ilike('name', `%${debouncedSearch}%`)
        .limit(5);
      if (!searchError) setSearchResults(data || []);
    };
    runSearch();
  }, [debouncedSearch]);

  const saveSettings = async () => {
    setIsSavingSettings(true);
    await supabase.from('projects').update({
      view_access: viewAccess,
      post_access: postAccess
    }).eq('id', project.id);
    
    onUpdateProject({ view_access: viewAccess, post_access: postAccess });
    onClose();
    setIsSavingSettings(false);
  };
  
  const addMember = async (userId) => {
    const { error: insertError } = await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: userId,
      added_by: user.id
    });
    
    if (insertError) setError("Error adding member."); else {
      await fetchSettingsData();
      setSearchResults([]);
      setSearchQuery('');
    }
  };
  
  const removeMember = async (userId) => {
    const { error: deleteError } = await supabase.from('project_members').delete().eq('project_id', project.id).eq('user_id', userId);
    if (deleteError) setError("Error removing member."); else {
      await fetchSettingsData();
    }
  };
  
  const updateRequest = async (requestId, userId, newStatus) => {
    setIsUpdatingRequest(prev => ({ ...prev, [requestId]: newStatus }));
    const { error: updateError } = await supabase.from('project_access_requests').update({ status: newStatus }).eq('id', requestId);
    if (updateError) {
      setError("Error updating request.");
      setIsUpdatingRequest(prev => ({ ...prev, [requestId]: null }));
      return;
    }
    
    if (newStatus === 'approved') {
      const { error: insertError } = await supabase.from('project_members').insert({
        project_id: project.id,
        user_id: userId,
        added_by: user.id
      });
      if (insertError) {
        setError("Error adding approved member.");
      } else {
        await insertNotification(user.id, userId, 'access_approved', project.id, `Your request to join ${project.title} was approved!`);
      }
    }
    await fetchSettingsData();
    setIsUpdatingRequest(prev => ({ ...prev, [requestId]: null }));
  };

  return (
    <div className="pp-modal-overlay" onClick={onClose}>
      <div className="pp-modal" onClick={e => e.stopPropagation()}>
        <div className="pp-modal-header">
          <h2>Project Settings</h2>
          <button className="pp-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="pp-modal-body">
          {error && (
            <div style={{ background: '#ef4444', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}>
              {error}
            </div>
          )}
          
          <div className="pp-settings-group">
            <label>Who can VIEW posts</label>
            <select className="pp-settings-select" value={viewAccess} onChange={e => setViewAccess(e.target.value)}>
              <option value="creator">Creator Only</option>
              <option value="members">Members Only</option>
              <option value="trackers">Trackers Only</option>
              <option value="all">Everyone</option>
            </select>
            {viewAccess === 'members' && <div className="pp-settings-help">Only approved members can do this — others can request access.</div>}
          </div>
          
          <div className="pp-settings-group">
            <label>Who can POST</label>
            <select className="pp-settings-select" value={postAccess} onChange={e => setPostAccess(e.target.value)}>
              <option value="creator">Creator Only</option>
              <option value="members">Members Only</option>
              <option value="trackers">Trackers Only</option>
              <option value="all">Everyone</option>
            </select>
            {postAccess === 'members' && <div className="pp-settings-help">Only approved members can do this — others can request access.</div>}
          </div>
          
          <div className="pp-settings-group">
            <label>Manage Members</label>
            <div className="pp-member-search">
              <input 
                placeholder="Search by name..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="pp-list" style={{ marginBottom: 12 }}>
                {searchResults.map(res => (
                  <div key={res.id} className="pp-list-item">
                    <Link to={`/profile/${res.username || res.id}`} target="_blank" className="pp-list-item-info" style={{ textDecoration: 'none', color: 'inherit' }}>
                      {res.avatar_url ? <img src={res.avatar_url} alt="" /> : <div style={{width: 24, height: 24, borderRadius: '50%', background: 'var(--border)'}}></div>}
                      <span style={{ fontSize: '0.85rem' }}>{res.name}</span>
                    </Link>
                    <div className="pp-list-item-actions">
                      <button onClick={() => addMember(res.id)}>Add as Member</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="pp-list">
              {members.map(m => (
                <div key={m.id} className="pp-list-item">
                  <Link to={`/profile/${m.profiles?.username || m.user_id}`} target="_blank" className="pp-list-item-info" style={{ textDecoration: 'none', color: 'inherit' }}>
                    {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} alt="" /> : <div style={{width: 24, height: 24, borderRadius: '50%', background: 'var(--border)'}}></div>}
                    <span style={{ fontSize: '0.85rem' }}>{m.profiles?.name}</span>
                  </Link>
                  <div className="pp-list-item-actions">
                    <button onClick={() => removeMember(m.user_id)}>Remove</button>
                  </div>
                </div>
              ))}
              {members.length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)'}}>No members added.</div>}
            </div>
          </div>
          
          <div className="pp-settings-group">
            <label>Pending Requests</label>
            <div className="pp-list">
              {pendingRequests.map(req => (
                <div key={req.id} className="pp-list-item">
                  <Link to={`/profile/${req.profiles?.username || req.user_id}`} target="_blank" className="pp-list-item-info" style={{ textDecoration: 'none', color: 'inherit' }}>
                    {req.profiles?.avatar_url ? <img src={req.profiles.avatar_url} alt="" /> : <div style={{width: 24, height: 24, borderRadius: '50%', background: 'var(--border)'}}></div>}
                    <span style={{ fontSize: '0.85rem' }}>{req.profiles?.name}</span>
                  </Link>
                  <div className="pp-list-item-actions">
                    <button className="btn-approve" onClick={() => updateRequest(req.id, req.user_id, 'approved')} disabled={isUpdatingRequest[req.id]} style={{ opacity: isUpdatingRequest[req.id] === 'approved' ? 0.7 : 1, width: '60px', display: 'flex', justifyContent: 'center' }}>
                      {isUpdatingRequest[req.id] === 'approved' ? <div className="btn-spinner" style={{ borderColor: "rgba(16,185,129,0.3)", borderTopColor: "#10B981" }}></div> : "Approve"}
                    </button>
                    <button className="btn-reject" onClick={() => updateRequest(req.id, req.user_id, 'rejected')} disabled={isUpdatingRequest[req.id]} style={{ opacity: isUpdatingRequest[req.id] === 'rejected' ? 0.7 : 1, width: '60px', display: 'flex', justifyContent: 'center' }}>
                      {isUpdatingRequest[req.id] === 'rejected' ? <div className="btn-spinner" style={{ borderColor: "rgba(239,68,68,0.3)", borderTopColor: "#EF4444" }}></div> : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
              {pendingRequests.length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)'}}>No pending requests.</div>}
            </div>
          </div>
          
          <button className="btn-post" style={{ justifyContent: 'center', marginTop: 12, opacity: isSavingSettings ? 0.7 : 1 }} onClick={saveSettings} disabled={isSavingSettings}>
            {isSavingSettings ? <div className="btn-spinner" style={{ margin: '0 auto' }}></div> : "Save Settings"}
          </button>
          
        </div>
      </div>
    </div>
  );
}
