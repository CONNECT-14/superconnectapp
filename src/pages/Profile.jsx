import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";
import SkeletonLoader from "../components/SkeletonLoader";
import FollowModals from "../components/FollowModals";
import BackgroundParticles from "../components/BackgroundParticles";
import ProfileCollabs from "../components/profile/ProfileCollabs";
import ProfileProjects from "../components/profile/ProfileProjects";
import ProfilePosts from "../components/profile/ProfilePosts";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import UsernamePrompt from "../components/profile/UsernamePrompt";
import "./Profile.css";

export default function Profile() {
  const { user } = useAuth();
  const { profile: hookProfile } = useProfile(user?.id);
  const [profileData, setProfileData] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [modalType, setModalType] = useState(null);
  const [postsCount, setPostsCount] = useState(0);

  // Collab Requests state
  const [myCollabs, setMyCollabs] = useState([]);
  const [collabsLoading, setCollabsLoading] = useState(false);

  const fetchMyCollabs = async (userId) => {
    setCollabsLoading(true);
    const { data } = await supabase
      .from('collab_requests')
      .select('*, project:project_id(id, title)')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });
    setMyCollabs(data || []);
    setCollabsLoading(false);
  };

  useEffect(() => {
    if (hookProfile) {
      setProfileData(hookProfile);
    }
  }, [hookProfile]);

  useEffect(() => {
    if (user) {
      const loadAdditionalData = async () => {
        const start = Date.now();
        await Promise.all([
          fetchProjects(user.id),
          fetchFollowStats(user.id),
          fetchMyCollabs(user.id)
        ]);
        const elapsed = Date.now() - start;
        if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
        setLoading(false);
      };
      loadAdditionalData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProjects = async (userId) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching projects:", error.message);
    else setProjects(data || []);
  };

  const fetchFollowStats = async (userId) => {
    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
  };

  if (loading) return (
    <div className="profile-root">
      <BackgroundParticles variant="split" />
      <div className="profile-inner">
        <SkeletonLoader type="profile" />
      </div>
    </div>
  );

  return (
    <>
      <div className="profile-root">
        <BackgroundParticles variant="split" />
        <div className="profile-inner">
          <UsernamePrompt user={user} profileData={profileData} setProfileData={setProfileData} />
          
          <div className="profile-header">
            <h2>My Profile</h2>
            <div className="dot" />
          </div>

          {/* USER PROFILE SECTION */}
          <ProfileHeader
            user={user}
            profileData={profileData}
            setProfileData={setProfileData}
            isEditingProfile={isEditingProfile}
            setIsEditingProfile={setIsEditingProfile}
            followersCount={followersCount}
            followingCount={followingCount}
            projectsCount={projects.length}
            postsCount={postsCount}
            setModalType={setModalType}
            avatarPreview={avatarPreview}
          >
            {isEditingProfile && (
                 <ProfileEditForm 
                   user={user}
                   profileData={profileData}
                   setProfileData={setProfileData}
                   setIsEditingProfile={setIsEditingProfile}
                   setAvatarPreview={setAvatarPreview}
                 />
            )}
          </ProfileHeader>

          {/* PROFILE PROJECTS SECTION */}
          <ProfileProjects 
            user={user}
            projects={projects}
            setProjects={setProjects}
          />

          {/* PROFILE POSTS SECTION */}
          <ProfilePosts 
            user={user}
            profileData={profileData}
            setPostsCount={setPostsCount}
          />

          {/* COLLAB REQUESTS SECTION */}
          <ProfileCollabs 
            myCollabs={myCollabs}
            collabsLoading={collabsLoading}
            profileData={profileData}
            user={user}
            setMyCollabs={setMyCollabs}
          />
        </div>
      </div>
      <FollowModals 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)} 
        type={modalType} 
        userId={user?.id} 
      />
    </>
  );
}