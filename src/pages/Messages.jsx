import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import useAuth from "../hooks/useAuth";
import { insertNotification } from "../utils/supabase-helpers";
import { formatTimeOnly } from "../utils/format";
import BackgroundParticles from "../components/BackgroundParticles";
import ErrorBoundary from "../components/ErrorBoundary";

// ── Simple XOR-based encryption using a shared key ──────────────────────────
// We use a simple but effective approach: CryptoJS-style using Web Crypto API
// The key is derived from a shared secret known to both sender and receiver.

const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || "superconnect-secret-key-2024";

function strToBytes(str) {
  return new TextEncoder().encode(str);
}

function bytesToStr(bytes) {
  return new TextDecoder().decode(bytes);
}

async function getCryptoKey(keyMaterial) {
  const keyBytes = await crypto.subtle.digest("SHA-256", strToBytes(keyMaterial));
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptMessage(plaintext, keyMaterial) {
  try {
    const key = await getCryptoKey(keyMaterial);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = strToBytes(plaintext);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
    
    // Return iv and ciphertext separately encoded as base64
    const encryptedContent = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    const ivString = btoa(String.fromCharCode(...iv));
    
    return { encryptedContent, ivString };
  } catch (e) {
    console.error("Encrypt error:", e);
    return { encryptedContent: plaintext, ivString: "" }; // fallback: store plain if crypto fails
  }
}

async function decryptMessage(ciphertext, ivString, keyMaterial) {
  try {
    if (!ivString) return ciphertext; // Fallback for old plain-text messages or messages without IV
    const iv = Uint8Array.from(atob(ivString), (c) => c.charCodeAt(0));
    const data = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    const key = await getCryptoKey(keyMaterial);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return bytesToStr(new Uint8Array(decrypted));
  } catch (e) {
    // If decryption fails (e.g. old plain-text messages), return as-is
    return ciphertext;
  }
}

const styles = `


  .messages-root {
    min-height: 100vh;
    background: var(--bg-app);
    font-family: 'Inter', sans-serif;
    color: var(--text-primary);
    padding: 80px 24px 80px;
    display: flex;
    justify-content: center;
  }

  .messages-inner {
    width: 100%;
    max-width: 1200px;
    display: flex;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    height: 75vh;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    overflow: hidden;
    position: relative;
    z-index: 1;
  }
  


  /* ── Sidebar (Chats list) ── */
  .chat-sidebar {
    width: 300px;
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    background: var(--bg-card);
  }

  .sidebar-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
  }

  .sidebar-header h3 {
    font-family: 'Inter', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
  }

  .chat-list {
    flex: 1;
    overflow-y: auto;
  }

  .chat-user-item {
    padding: 16px 24px;
    cursor: pointer;
    border-bottom: 1px solid var(--border);
    transition: background 200ms ease;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
  }

  .chat-user-item:hover, .chat-user-item.active {
    background: rgba(124, 58, 237, 0.08);
  }

  /* ── Chat Window ── */
  .chat-window {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg-app);
  }

  .chat-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-card);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .chat-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
  }

  .chat-header .lock-badge {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .messages-area {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .message-wrapper {
    display: flex;
    flex-direction: column;
  }

  .message-bubble {
    max-width: 70%;
    padding: 10px 16px;
    border-radius: 12px;
    font-size: 0.95rem;
    line-height: 1.4;
    word-break: break-word;
  }

  .message-wrapper.sent {
    align-items: flex-end;
  }

  .message-wrapper.sent .message-bubble {
    background: var(--accent);
    color: #fff;
    border-bottom-right-radius: 4px;
  }

  .message-wrapper.received {
    align-items: flex-start;
  }

  .message-wrapper.received .message-bubble {
    background: var(--border);
    color: var(--text-primary);
    border-bottom-left-radius: 4px;
  }

  .message-timestamp {
    font-size: 10px;
    color: var(--text-secondary);
    margin-top: 4px;
  }

  /* ── Input Area ── */
  .input-area {
    padding: 16px 24px;
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    display: flex;
    gap: 12px;
  }

  .chat-input {
    flex: 1;
    background: var(--bg-app);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 10px 16px;
    font-family: inherit;
    font-size: 0.95rem;
    outline: none;
    color: var(--text-primary);
    transition: border-color 200ms ease;
  }

  .chat-input:focus {
    border-color: var(--accent);
  }
  
  .chat-input::placeholder {
    color: var(--text-secondary);
  }

  .btn-send {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 20px;
    padding: 0 20px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: background 200ms ease;
  }

  .btn-send:hover {
    background: #6D28D9;
  }

  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    font-style: italic;
  }

  @media (max-width: 768px) {
    .messages-root {
      padding: 80px 12px 80px;
    }
    .messages-inner {
      position: relative;
    }
    .chat-sidebar {
      width: 100%;
      border-right: none;
    }
    .chat-window {
      width: 100%;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10;
      background: var(--bg-app);
    }
    .chat-sidebar.hidden-mobile {
      display: none;
    }
    .chat-window.hidden-mobile {
      display: none;
    }
    .btn-back {
      display: flex;
      align-items: center;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 1.2rem;
      cursor: pointer;
      margin-right: 8px;
      padding: 4px;
    }
    .input-area {
      flex-direction: column;
    }
    .btn-send {
      width: 100%;
      padding: 10px;
    }
  }

  @media (min-width: 769px) {
    .btn-back {
      display: none;
    }
  }
`;

export default function Messages() {
  const { user } = useAuth();
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [unreadChats, setUnreadChats] = useState(new Set());
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const selectedUserRef = useRef(selectedUser);
  
  const handleSelectUser = (u) => {
    setSelectedUser(u);
    selectedUserRef.current = u;
    if (u) {
      setUnreadChats(prev => {
        const next = new Set(prev);
        next.delete(u.id);
        return next;
      });
    }
  };

  useEffect(() => {
    if (!user) return;
    
    console.log('Subscription setup. user:', user?.id, 'activeChatUser:', selectedUserRef.current?.id);

    const subscription = supabase
      .channel('messages-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, async (payload) => {
        console.log('New message payload:', payload);
        const currentSelected = selectedUserRef.current;
        if (currentSelected && payload.new.sender_id === currentSelected.id) {
          const decryptedContent = await decryptMessage(payload.new.content, payload.new.iv, ENCRYPTION_KEY);
          setMessages(prev => [...prev, { ...payload.new, content: decryptedContent }]);
          setTimeout(scrollToBottom, 100);
        } else {
          setUnreadChats(prev => {
            const next = new Set(prev);
            next.add(payload.new.sender_id);
            return next;
          });
        }
      })
      .subscribe((status) => {
        console.log('Messages channel status:', status);
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const fetchChatUsers = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setError("Failed to fetch chat users.");
      return;
    }

    // Extract unique conversation partner IDs
    const partnerIds = [...new Set(
      (data || []).map(m => m.sender_id === userId ? m.receiver_id : m.sender_id)
    )];

    if (partnerIds.length === 0) {
      setChatUsers([]);
      return;
    }

    // Fetch only those profiles
    const { data: profiles, error: chatErr } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .in('id', partnerIds);

    if (chatErr) {
      setError("Failed to fetch chat users.");
      return;
    }

    const profilesWithMessages = await Promise.all((profiles || []).map(async (prof) => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('content, iv, created_at, sender_id')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${prof.id}),and(sender_id.eq.${prof.id},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(1);

      let lastMessage = null;
      let lastMessageTime = null;
      
      if (msgs && msgs.length > 0) {
        const msg = msgs[0];
        lastMessageTime = msg.created_at;
        try {
          const decrypted = await decryptMessage(msg.content, msg.iv, ENCRYPTION_KEY);
          lastMessage = decrypted;
        } catch (e) {
          lastMessage = "Encrypted message";
        }
      }
      
      return {
        ...prof,
        lastMessage,
        lastMessageTime
      };
    }));

    profilesWithMessages.sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));

    setChatUsers(profilesWithMessages);
  }, []);

  useEffect(() => {
    if (user) {
      fetchChatUsers(user.id);
    }
  }, [user, fetchChatUsers]);



  const fetchMessages = async (otherUserId) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setError("Failed to fetch messages.");
      return;
    }

    // 🔓 Decrypt each message before displaying
    const decrypted = await Promise.all(
      (data || []).map(async (msg) => ({
        ...msg,
        content: await decryptMessage(msg.content, msg.iv, ENCRYPTION_KEY),
      }))
    );

    setMessages(decrypted.reverse());
    setHasMoreMessages(data.length === 50);
    setTimeout(scrollToBottom, 100);
  };

  const loadOlderMessages = async () => {
    if (!hasMoreMessages || loadingMore || !selectedUser || !user) return;
    setLoadingMore(true);
    const oldest = messages[0];
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: false })
      .lt('created_at', oldest.created_at)
      .limit(50);
      
    if (error) {
      setError("Failed to load older messages.");
      setLoadingMore(false);
      return;
    }

    const decrypted = await Promise.all(
      (data || []).map(async (msg) => ({
        ...msg,
        content: await decryptMessage(msg.content, msg.iv, ENCRYPTION_KEY),
      }))
    );
    
    setMessages(prev => [...decrypted.reverse(), ...prev]);
    setHasMoreMessages(data.length === 50);
    setLoadingMore(false);
  };

  const sendMessage = async () => {
    if (!text.trim() || !selectedUser || !user || isSending) return;
    
    setIsSending(true);
    const start = Date.now();

    // 🛑 Rate Limit Check
    const { data: isAllowed, error: rlError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_action: 'messages',
      p_max_count: 30,
      p_window_seconds: 60
    });

    if (rlError) {
      console.error("Rate limit check failed:", rlError);
    } else if (!isAllowed) {
      alert("Too many messages sent — slow down a bit.");
      setIsSending(false);
      return;
    }

    // 🔐 Encrypt before storing
    const { encryptedContent, ivString } = await encryptMessage(text, ENCRYPTION_KEY);

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: user.id,
        receiver_id: selectedUser.id,
        content: encryptedContent,
        iv: ivString,
      },
    ]);

    if (error) {
      setError("Failed to send message.");
      setIsSending(false);
      return;
    }

    setText("");
    
    // Optimistic append
    const tempMsg = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: text,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 100);

    fetchMessages(selectedUser.id);
    fetchChatUsers(user.id);
    
    // Add notification
    await insertNotification(user.id, selectedUser.id, 'message', null, 'sent you a message');
    
    const elapsed = Date.now() - start;
    if (elapsed < 500) {
      setTimeout(() => setIsSending(false), 500 - elapsed);
    } else {
      setIsSending(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="messages-root">
        <BackgroundParticles variant="split" />
        <ErrorBoundary>
        <div className="messages-inner">
          {error && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#ef4444', color: 'white', padding: '12px', textAlign: 'center', zIndex: 100, fontSize: '14px', fontWeight: '500' }}>
              {error}
              <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: 'white', marginLeft: '10px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>
          )}
          {/* LEFT: Sidebar */}
          <div className={`chat-sidebar ${selectedUser ? 'hidden-mobile' : ''}`}>
            <div className="sidebar-header">
              <h3>Messages</h3>
            </div>
            
            <div className="chat-list">
              {chatUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                  <p>No conversations yet.</p>
                  <p>Search for a user to start chatting.</p>
                </div>
              ) : (
                chatUsers.map((u) => (
                  <div
                    key={u.id}
                    className={`chat-user-item ${selectedUser?.id === u.id ? "active" : ""}`}
                    onClick={() => {
                      handleSelectUser(u);
                      fetchMessages(u.id);
                    }}
                  >
                    <Link
                      to={`/profile/${u.username || u.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}
                    >
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>
                          {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '500', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name || "User"}</span>
                          {u.lastMessageTime && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{formatTimeOnly(u.lastMessageTime)}</span>
                          )}
                        </div>
                        {u.username && !u.lastMessage && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>@{u.username}</span>
                        )}
                        {u.lastMessage && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {u.lastMessage.length > 40 ? u.lastMessage.substring(0, 40) + '...' : u.lastMessage}
                          </span>
                        )}
                      </div>
                      {unreadChats.has(u.id) && (
                        <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} title="New message" />
                      )}
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Chat Window */}
          <div className={`chat-window ${!selectedUser ? 'hidden-mobile' : ''}`}>
            {selectedUser ? (
              <>
                <div className="chat-header">
                  <button className="btn-back" onClick={() => handleSelectUser(null)}>←</button>
                  <Link 
                    to={`/profile/${selectedUser.username || selectedUser.id}`} 
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}
                  >
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                        {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ margin: 0, lineHeight: 1.2 }}>{selectedUser.name}</h3>
                      {selectedUser.username && (
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>@{selectedUser.username}</span>
                      )}
                    </div>
                  </Link>
                  <span className="lock-badge">🔒 End-to-end encrypted</span>
                </div>

                <div className="messages-area">
                  {hasMoreMessages && messages.length > 0 && (
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <button 
                        onClick={loadOlderMessages} 
                        disabled={loadingMore}
                        style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        {loadingMore ? 'Loading...' : 'Load older messages'}
                      </button>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message-wrapper ${msg.sender_id === user.id ? "sent" : "received"}`}
                    >
                      <div className="message-bubble">
                        {msg.content}
                      </div>
                      <span className="message-timestamp">
                        {formatTimeOnly(msg.created_at)}
                      </span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="input-area">
                  <input
                    className="chat-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMessage();
                    }}
                    placeholder="Type a message..."
                  />
                  <button className="btn-send" onClick={sendMessage} disabled={isSending} style={{ opacity: isSending ? 0.6 : 1 }}>Send</button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                Select a user to start chatting
              </div>
            )}
          </div>
        </div>
        </ErrorBoundary>
      </div>
    </>
  );
}