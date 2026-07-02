import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export default function UsernamePrompt({ user, profileData, setProfileData }) {
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [promptUsername, setPromptUsername] = useState("");
  const [isPromptUsernameValid, setIsPromptUsernameValid] = useState(true);
  const [isPromptUsernameAvailable, setIsPromptUsernameAvailable] = useState(null);
  const [checkingPromptUsername, setCheckingPromptUsername] = useState(false);
  const [savingPromptUsername, setSavingPromptUsername] = useState(false);

  useEffect(() => {
    if (profileData && profileData.username_is_auto_generated && !profileData.username_prompt_dismissed) {
       setShowUsernamePrompt(true);
       setPromptUsername(profileData.username || "");
       setIsPromptUsernameValid(true);
       setIsPromptUsernameAvailable(true);
    } else {
       setShowUsernamePrompt(false);
    }
  }, [profileData]);

  useEffect(() => {
    const validatePromptUsername = async () => {
      if (!promptUsername || promptUsername === profileData?.username) {
        setIsPromptUsernameValid(true);
        setIsPromptUsernameAvailable(true);
        return;
      }
      const regex = /^[a-z0-9_.]{3,30}$/;
      if (!regex.test(promptUsername)) {
        setIsPromptUsernameValid(false);
        setIsPromptUsernameAvailable(null);
        return;
      }
      setIsPromptUsernameValid(true);
      setCheckingPromptUsername(true);
      
      const { data } = await supabase.from('profiles').select('id').ilike('username', promptUsername).maybeSingle();
      
      setIsPromptUsernameAvailable(!data);
      setCheckingPromptUsername(false);
    };

    const timer = setTimeout(() => {
      if (showUsernamePrompt) validatePromptUsername();
    }, 400);

    return () => clearTimeout(timer);
  }, [promptUsername, showUsernamePrompt, profileData]);

  const handleDismissPrompt = async () => {
    setShowUsernamePrompt(false);
    await supabase.from('profiles').update({ username_prompt_dismissed: true }).eq('id', user.id);
  };

  const handleSavePrompt = async () => {
    if (!isPromptUsernameValid || isPromptUsernameAvailable === false) return;
    setSavingPromptUsername(true);
    const { error } = await supabase.from('profiles').update({ 
      username: promptUsername, 
      username_is_auto_generated: false 
    }).eq('id', user.id);
    
    if (error) {
      alert("Error saving username: " + error.message);
    } else {
      setProfileData(prev => ({ ...prev, username: promptUsername, username_is_auto_generated: false }));
      setShowUsernamePrompt(false);
    }
    setSavingPromptUsername(false);
  };

  if (!showUsernamePrompt) return null;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(124, 58, 237, 0.15)' }}>
      <h3 style={{ marginBottom: '12px', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Claim your username</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.95rem' }}>We've added usernames to help people find you. Yours is currently <strong>@{profileData?.username}</strong> — want to customize it?</p>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', flex: 1 }}>
          <span style={{ color: 'var(--text-primary)', marginRight: '8px' }}>@</span>
          <input 
            type="text" 
            value={promptUsername} 
            onChange={e => setPromptUsername(e.target.value.toLowerCase())} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', flex: 1, fontSize: '1rem' }} 
          />
          {checkingPromptUsername && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>Checking...</span>}
          {!checkingPromptUsername && isPromptUsernameValid && isPromptUsernameAvailable === true && <span style={{ color: '#10B981', fontWeight: 'bold', marginLeft: '8px' }}>✓</span>}
        </div>
        <button onClick={handleSavePrompt} disabled={!isPromptUsernameValid || isPromptUsernameAvailable === false || savingPromptUsername} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', opacity: (!isPromptUsernameValid || isPromptUsernameAvailable === false || savingPromptUsername) ? 0.5 : 1 }}>
          {savingPromptUsername ? 'Saving...' : 'Save'}
        </button>
        <button onClick={handleDismissPrompt} style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>
          Maybe later
        </button>
      </div>
      
      {!isPromptUsernameValid && promptUsername.length > 0 && <div style={{ color: '#EF4444', fontSize: '12px' }}>Must be 3-30 lowercase letters, numbers, underscores, or periods.</div>}
      {isPromptUsernameValid && isPromptUsernameAvailable === false && <div style={{ color: '#EF4444', fontSize: '12px' }}>Username already taken.</div>}
    </div>
  );
}
