import { useState } from "react";
import { supabase } from "../../supabaseClient";
import useImageUpload from "../../hooks/useImageUpload";
import ProfileSkills from "./ProfileSkills";

export default function ProfileHeader({
  user,
  profileData,
  setProfileData,
  isEditingProfile,
  setIsEditingProfile,
  followersCount,
  followingCount,
  projectsCount,
  postsCount,
  setModalType,
  avatarPreview,
  children
}) {
  const { upload: uploadAvatar } = useImageUpload("avatars");
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleDirectBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setIsUploadingBanner(true);
    
    const bannerUrl = await uploadAvatar(file, `banner-${Date.now()}-`);

    if (!bannerUrl) {
      alert("Banner upload failed");
      setIsUploadingBanner(false);
      return;
    }
    
    const { error } = await supabase.from("profiles").update({ banner_url: bannerUrl }).eq("id", user.id);
    if (error) alert("Error saving banner: " + error.message);
    else setProfileData(prev => ({ ...prev, banner_url: bannerUrl }));
    
    setIsUploadingBanner(false);
  };

  const handleDirectAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setIsUploadingAvatar(true);
    
    const avatarUrl = await uploadAvatar(file, `avatar-${Date.now()}-`);

    if (!avatarUrl) {
      alert("Avatar upload failed");
      setIsUploadingAvatar(false);
      return;
    }
    
    const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
    if (error) alert("Error saving avatar: " + error.message);
    else {
      setProfileData(prev => ({ ...prev, avatar_url: avatarUrl }));
    }
    
    setIsUploadingAvatar(false);
  };

  return (
    <div className="profile-info-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p className="section-label" style={{ marginBottom: 0 }}>User Info</p>
        {!isEditingProfile && (
          <button 
            onClick={() => setIsEditingProfile(true)}
            style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Edit Profile
          </button>
        )}
      </div>
      
      <div className="profile-card">
         <div className="profile-banner" style={profileData?.banner_url ? { backgroundImage: `url(${profileData.banner_url})` } : {}}>
           <label className="banner-edit-btn">
             <span>📷 {isUploadingBanner ? '...' : ''}</span>
             <input type="file" accept="image/*" className="file-input-hidden" onChange={handleDirectBannerUpload} disabled={isUploadingBanner} />
           </label>
         </div>
         
         <div className="avatar-wrapper">
           <div className="profile-avatar">
             {(avatarPreview || profileData?.avatar_url) ? (
               <img src={avatarPreview || profileData?.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             ) : (
               profileData?.name ? profileData.name.charAt(0).toUpperCase() : "U"
             )}
           </div>
           <label className="avatar-overlay">
             <span>📷 {isUploadingAvatar ? '...' : ''}</span>
             <input type="file" accept="image/*" className="file-input-hidden" onChange={handleDirectAvatarUpload} disabled={isUploadingAvatar} />
           </label>
         </div>
         
         {isEditingProfile ? (
           children
         ) : (
           <div className="profile-details" style={{ padding: '16px 24px 24px 24px' }}>
             <h3>{profileData?.name || "User"}</h3>
             {profileData?.username && (
               <p style={{ color: 'var(--accent)', fontSize: '0.95rem', fontWeight: '500', marginBottom: '4px' }}>
                 @{profileData.username}
               </p>
             )}
             <p className="profile-email">{profileData?.email}</p>
             {profileData?.occupation && <p className="profile-meta">💼 {profileData.occupation}</p>}
             {profileData?.age && <p className="profile-meta">🎂 {profileData.age} years old</p>}
             
             {profileData?.bio ? (
               <p style={{ marginTop: '12px', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                 {profileData.bio}
               </p>
             ) : (
               <p style={{ marginTop: '12px', fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                 No bio yet
               </p>
             )}
              
             {/* Skill Tags Display */}
             <ProfileSkills skills={profileData?.skills} />
              
             <div className="profile-stats" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setModalType('followers')}>
                 <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '18px' }}>{followersCount}</span>
                 <span style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px' }}>Followers</span>
               </div>
               <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setModalType('following')}>
                 <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '18px' }}>{followingCount}</span>
                 <span style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px' }}>Following</span>
               </div>
               <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                 <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '18px' }}>{projectsCount}</span>
                 <span style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px' }}>Projects</span>
               </div>
               <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                 <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '18px' }}>{postsCount}</span>
                 <span style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px' }}>Posts</span>
               </div>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}
