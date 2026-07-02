import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import useImageUpload from "../../hooks/useImageUpload";

export default function ProfileEditForm({
  user,
  profileData,
  setProfileData,
  setIsEditingProfile,
  setAvatarPreview,
  setShowUsernamePrompt
}) {
  const [editName, setEditName] = useState(profileData?.name || "");
  const [editUsername, setEditUsername] = useState(profileData?.username || "");
  const [isEditUsernameValid, setIsEditUsernameValid] = useState(true);
  const [isEditUsernameAvailable, setIsEditUsernameAvailable] = useState(null);
  const [checkingEditUsername, setCheckingEditUsername] = useState(false);
  const [editAge, setEditAge] = useState(profileData?.age || "");
  const [editOccupation, setEditOccupation] = useState(profileData?.occupation || "");
  const [editBio, setEditBio] = useState(profileData?.bio || "");
  const [editSkills, setEditSkills] = useState(profileData?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const { upload: uploadAvatar } = useImageUpload("avatars");

  useEffect(() => {
    const validateEditUsername = async () => {
      if (!editUsername || editUsername === profileData?.username) {
        setIsEditUsernameValid(true);
        setIsEditUsernameAvailable(true);
        return;
      }
      const regex = /^[a-z0-9_.]{3,30}$/;
      if (!regex.test(editUsername)) {
        setIsEditUsernameValid(false);
        setIsEditUsernameAvailable(null);
        return;
      }
      setIsEditUsernameValid(true);
      setCheckingEditUsername(true);
      
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', editUsername)
        .neq('id', user.id)
        .maybeSingle();
      
      setIsEditUsernameAvailable(!data);
      setCheckingEditUsername(false);
    };

    const timer = setTimeout(() => {
      validateEditUsername();
    }, 400);

    return () => clearTimeout(timer);
  }, [editUsername, profileData, user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!isEditUsernameValid || isEditUsernameAvailable === false) {
      return;
    }
    
    setSavingProfile(true);
    let avatarUrl = profileData?.avatar_url || null;

    if (avatarFile) {
      const uploadedUrl = await uploadAvatar(avatarFile, `avatar-${Date.now()}-`);
      if (uploadedUrl) avatarUrl = uploadedUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: editName,
        username: editUsername,
        age: editAge ? parseInt(editAge) : null,
        occupation: editOccupation,
        bio: editBio,
        avatar_url: avatarUrl,
        skills: editSkills
      })
      .eq("id", user.id);

    if (error) {
      if (error.message.includes('23505') || error.message.toLowerCase().includes('unique')) {
        setIsEditUsernameAvailable(false);
      } else {
        alert("Error saving profile: " + error.message);
      }
    } else {
      setProfileData({ ...profileData, name: editName, username: editUsername, age: editAge, occupation: editOccupation, bio: editBio, avatar_url: avatarUrl, skills: editSkills });
      if (setShowUsernamePrompt) setShowUsernamePrompt(false);
      setIsEditingProfile(false);
      setAvatarPreview(null);
    }
    setSavingProfile(false);
  };

  const handleCancel = () => {
    setIsEditingProfile(false);
    setAvatarPreview(null);
  };

  return (
    <div className="profile-details" style={{ flex: 1, padding: '16px 24px 24px 24px' }}>
      <label className="file-label" style={{ marginBottom: '12px', alignSelf: 'flex-start' }}>
        + Change Avatar
        <input type="file" accept="image/*" className="file-input-hidden" onChange={handleAvatarChange} />
      </label>
      <input className="form-field" placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ marginBottom: '8px' }} />
      
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px' }}>
          <span style={{ color: 'var(--text-secondary)', marginRight: '8px', fontSize: '0.95rem' }}>@</span>
          <input 
            type="text" 
            placeholder="username"
            value={editUsername} 
            onChange={e => setEditUsername(e.target.value.toLowerCase())} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', flex: 1, fontSize: '0.95rem', fontFamily: 'Inter, sans-serif' }} 
          />
          {checkingEditUsername && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>Checking...</span>}
          {!checkingEditUsername && isEditUsernameValid && isEditUsernameAvailable === true && editUsername !== profileData?.username && <span style={{ color: '#10B981', fontWeight: 'bold', marginLeft: '8px' }}>✓</span>}
        </div>
        {!isEditUsernameValid && editUsername.length > 0 && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>Only lowercase letters, numbers, _ and . allowed, 3-30 characters</div>}
        {isEditUsernameValid && isEditUsernameAvailable === false && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>Username already taken.</div>}
      </div>

      <input className="form-field" type="number" placeholder="Age" value={editAge} onChange={(e) => setEditAge(e.target.value)} style={{ marginBottom: '8px' }} />
      <input className="form-field" placeholder="Occupation" value={editOccupation} onChange={(e) => setEditOccupation(e.target.value)} style={{ marginBottom: '8px' }} />
      
      <textarea
        className="form-field"
        placeholder="Write something about yourself..."
        value={editBio}
        onChange={(e) => setEditBio(e.target.value)}
        maxLength={200}
        rows={3}
        style={{ marginBottom: '4px', resize: 'vertical' }}
      />
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right', marginBottom: '8px' }}>
        {editBio.length}/200
      </div>
       
       <div style={{ marginBottom: '12px' }}>
         <div className="skill-tags-container">
           {editSkills.map((skill, i) => (
             <span key={i} className="skill-tag">
               {skill}
               <button className="skill-tag-remove" onClick={() => setEditSkills(prev => prev.filter((_, idx) => idx !== i))}>×</button>
             </span>
           ))}
         </div>
         {editSkills.length < 10 && (
           <div className="skill-input-row">
             <input
               className="form-field"
               placeholder="Add a skill (e.g. React, Python)"
               value={skillInput}
               onChange={(e) => setSkillInput(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   e.preventDefault();
                   const trimmed = skillInput.trim();
                   if (trimmed && !editSkills.includes(trimmed)) {
                     setEditSkills(prev => [...prev, trimmed]);
                     setSkillInput('');
                   }
                 }
               }}
             />
             <button className="btn-add-skill" onClick={() => {
               const trimmed = skillInput.trim();
               if (trimmed && !editSkills.includes(trimmed)) {
                 setEditSkills(prev => [...prev, trimmed]);
                 setSkillInput('');
               }
             }}>Add</button>
           </div>
         )}
         <p className="skill-limit-text">{editSkills.length}/10 skills</p>
       </div>
       
       <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn-create" onClick={handleSaveProfile} disabled={savingProfile || !isEditUsernameValid || isEditUsernameAvailable === false} style={{ opacity: savingProfile ? 0.7 : 1 }}>
          {savingProfile ? <div className="btn-spinner" style={{ margin: '0 auto' }}></div> : "Save"}
        </button>
        <button onClick={handleCancel} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '11px 22px', borderRadius: '7px', cursor: 'pointer', color: 'var(--text-primary)' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
