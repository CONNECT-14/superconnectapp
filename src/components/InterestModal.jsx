import { useState } from "react";
import { supabase } from "../supabaseClient";
import { insertNotification } from "../utils/supabase-helpers";

const modalStyles = `
  .interest-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    z-index: 9000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.18s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .interest-card {
    background: #1A1A1F;
    border: 1px solid #2A2A2F;
    border-radius: 20px;
    padding: 28px;
    width: 100%;
    max-width: 460px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    animation: slideUp 0.2s ease;
    position: relative;
  }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .interest-header {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .interest-title {
    font-size: 20px;
    font-weight: 700;
    color: #FFFFFF;
    margin: 0;
  }
  .interest-subtitle {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
  }
  .interest-textarea {
    width: 100%;
    background: #0F0F11;
    border: 1px solid #2A2A2F;
    border-radius: 12px;
    padding: 14px 16px;
    color: var(--text-primary);
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    resize: none;
    min-height: 120px;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  .interest-textarea:focus {
    border-color: #7C3AED;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
  .interest-textarea::placeholder { color: #4A4A5A; }
  .interest-char-counter {
    font-size: 11px;
    color: var(--text-secondary);
    text-align: right;
    margin-top: -12px;
  }
  .interest-char-counter.warn { color: #F59E0B; }
  .interest-char-counter.over { color: #EF4444; }
  .interest-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
  .btn-interest-cancel {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid #2A2A2F;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .btn-interest-cancel:hover { background: rgba(255,255,255,0.05); }
  .btn-interest-send {
    background: #7C3AED;
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    font-family: 'Inter', sans-serif;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .btn-interest-send:hover:not(:disabled) { opacity: 0.85; }
  .btn-interest-send:disabled { opacity: 0.6; cursor: not-allowed; }
  .interest-error {
    font-size: 12px;
    color: #EF4444;
    padding: 8px 12px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
`;

const MAX_CHARS = 300;

export default function InterestModal({ collab, currentUser, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const remaining = MAX_CHARS - message.length;

  const handleSend = async () => {
    if (!currentUser) return;
    setSending(true);
    setError(null);

    // Insert collab interest
    const { error: insertError } = await supabase
      .from('collab_interests')
      .insert({
        collab_request_id: collab.id,
        user_id: currentUser.id,
        message: message.trim() || null
      });

    if (insertError) {
      if (insertError.code === '23505') {
        setError("You've already expressed interest in this collab request.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setSending(false);
      return;
    }

    // Get current user's profile name for notification
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('name, username')
      .eq('id', currentUser.id)
      .single();

    const displayName = myProfile?.name || myProfile?.username || 'Someone';

    // Send notification to creator
    await insertNotification(
      currentUser.id,
      collab.creator_id,
      'collab_interest',
      null, // postId
      `${displayName} is interested in your ${collab.role} collab request`,
      collab.id
    );

    setSending(false);
    onSuccess();
  };

  return (
    <>
      <style>{modalStyles}</style>
      <div className="interest-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="interest-card">
          <div className="interest-header">
            <h2 className="interest-title">Express Interest</h2>
            <p className="interest-subtitle">
              Applying for: <strong style={{ color: '#A855F7' }}>{collab.role}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <textarea
              className="interest-textarea"
              placeholder="Tell them why you're a good fit (optional)"
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, MAX_CHARS))}
              maxLength={MAX_CHARS}
            />
            <div className={`interest-char-counter${remaining <= 30 ? remaining <= 0 ? ' over' : ' warn' : ''}`}>
              {remaining} chars remaining
            </div>
          </div>

          {error && <div className="interest-error">{error}</div>}

          <div className="interest-actions">
            <button className="btn-interest-cancel" onClick={onClose}>Cancel</button>
            <button
              className="btn-interest-send"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                  Sending...
                </>
              ) : 'Send Interest'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
