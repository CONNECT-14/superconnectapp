import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import useAuth from "../hooks/useAuth";
import { insertNotification } from "../utils/supabase-helpers";
import SkeletonLoader from "../components/SkeletonLoader";
import BackgroundParticles from "../components/BackgroundParticles";
import PostCollabModal from "../components/PostCollabModal";
import ProjectSettingsModal from "../components/project/ProjectSettingsModal";
import EditProjectModal from "../components/project/EditProjectModal";
import ProjectHeader from "../components/project/ProjectHeader";
import ProjectFeed from "../components/project/ProjectFeed";

import './ProjectPage.css';
export default function ProjectPage() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const { user } = useAuth();
  
  const [error, setError] = useState(null);
  
  // Access state
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); // 'pending', 'approved', 'rejected'
  const [pendingCount, setPendingCount] = useState(0);

  // Settings Modal state
  const [showSettings, setShowSettings] = useState(false);

  // Edit Project state
  const [showEditProject, setShowEditProject] = useState(false);
  
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);

  // Collab state
  const [showPostCollabModal, setShowPostCollabModal] = useState(false);
  const [collabToast, setCollabToast] = useState(null);

  const fetchProject = useCallback(async (currentUser) => {
    const { data } = await supabase
      .from("projects")
      .select("*, profiles(name, avatar_url, username)")
      .eq("id", id)
      .single();
      
    if (data) {
      setProject(data);
    }

    if (currentUser && data) {
      // Check tracker status
      const { data: followData } = await supabase
        .from("project_followers")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", currentUser.id)
        .single();
      if (followData) setIsFollowing(true);
      
      // Check member status
      const { data: memberData } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", currentUser.id)
        .single();
      if (memberData) setIsMember(true);
      
      // Check request status - fetch the most recent request for this user
      const { data: requestData } = await supabase
        .from("project_access_requests")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (requestData && requestData.length > 0) {
        if (requestData[0].status === 'pending') {
          setRequestStatus('pending');
        } else {
          setRequestStatus(null); // allow requesting again if approved but not member, or rejected
        }
      }
      
      if (currentUser.id === data.user_id) {
        const { count } = await supabase
          .from("project_access_requests")
          .select("*", { count: 'exact', head: true })
          .eq("project_id", id)
          .eq("status", "pending");
        setPendingCount(count || 0);
      }
    }
  }, [id]);
  
  const isCreator = user && project && user.id === project.user_id;

  const checkAccess = (accessLevel) => {
    if (!project) return false;
    if (isCreator) return true;
    if (accessLevel === 'all') return true;
    if (accessLevel === 'members') return isMember;
    if (accessLevel === 'trackers') return isMember || isFollowing;
    return false;
  };

  const canView = checkAccess(project?.view_access || 'all');
  const canPost = checkAccess(project?.post_access || 'all');
  
  const showRequestJoin = user && !isCreator && !isMember && (project?.view_access === 'members' || project?.post_access === 'members');
  
  useEffect(() => {
    const init = async () => {
      try {
        await fetchProject(user);
      } catch (err) {
        setError("Failed to initialize project.");
      }
    };
    init();
  }, [fetchProject, user]);
  
  const handleRequestAccess = async () => {
    if (!user) return;
    setIsRequestingAccess(true);
    try {
      const { error } = await supabase.from('project_access_requests').insert({
        project_id: id,
        user_id: user.id,
        status: 'pending'
      });
      if (!error) {
        setRequestStatus('pending');
        // Fetch the user's name for the notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        // Add notification for creator
        await insertNotification(user.id, project.user_id, 'access_request', id, `${profile?.name || 'A user'} requested member access to your project ${project.title}`);
      }
    } catch (err) {
      setError("Failed to request access.");
    }
    setIsRequestingAccess(false);
  };

  const toggleFollow = async () => {
    if (!user) return;
    setIsTogglingFollow(true);
    try {
      if (isFollowing) {
        await supabase.from("project_followers").delete().eq("project_id", id).eq("user_id", user.id);
        setIsFollowing(false);
      } else {
        await supabase.from("project_followers").insert([{ project_id: id, user_id: user.id }]);
        setIsFollowing(true);
      }
    } catch (err) {
      setError("Failed to toggle follow.");
    }
    setIsTogglingFollow(false);
  };

  // Settings Logic
  const openSettings = () => {
    setShowSettings(true);
  };

  return (
    <>
      
      <div className="pp-root">
        <BackgroundParticles variant="split" />

        {error && (
          <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            {error}
            <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

        {project ? (
          <div className="pp-page">

            <ProjectHeader 
              project={project}
              user={user}
              isCreator={isCreator}
              isFollowing={isFollowing}
              isTogglingFollow={isTogglingFollow}
              toggleFollow={toggleFollow}
              pendingCount={pendingCount}
              openSettings={openSettings}
              openEditProject={() => setShowEditProject(true)}
              setShowPostCollabModal={setShowPostCollabModal}
            />

            <ProjectFeed 
              projectId={project.id}
              user={user}
              canView={canView}
              canPost={canPost}
              showRequestJoin={showRequestJoin}
              handleRequestAccess={handleRequestAccess}
              requestStatus={requestStatus}
              isRequestingAccess={isRequestingAccess}
            />
          </div>
        ) : (
          <div className="pp-page">
            <SkeletonLoader type="page" />
          </div>
        )}
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <ProjectSettingsModal
          project={project}
          user={user}
          onClose={() => setShowSettings(false)}
          onUpdateProject={(updates) => setProject({ ...project, ...updates })}
          setPendingCount={setPendingCount}
        />
      )}

      {/* Edit Project Modal */}
      {showEditProject && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditProject(false)}
          onUpdateProject={(updates) => setProject({ ...project, ...updates })}
        />
      )}

      {/* POST COLLAB MODAL */}
      {showPostCollabModal && (
        <PostCollabModal
          currentUser={user}
          preselectedProjectId={project?.id}
          onClose={() => setShowPostCollabModal(false)}
          onSuccess={() => {
            setCollabToast('🎉 Collab request posted!');
            setTimeout(() => setCollabToast(null), 2700);
          }}
        />
      )}

      {/* COLLAB TOAST */}
      {collabToast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#22C55E', color: 'white', padding: '12px 24px',
          borderRadius: '20px', fontSize: '13px', fontWeight: '600',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 9999,
          animation: 'toastIn 0.3s ease', whiteSpace: 'nowrap'
        }}>
          {collabToast}
        </div>
      )}
    </>
  );
}

