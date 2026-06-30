import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import SkeletonLoader from "../components/SkeletonLoader";
import BackgroundParticles from "../components/BackgroundParticles";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  :root {
    --bg-app: #0F0F11;
    --bg-card: #1A1A1F;
    --border: #2A2A2F;
    --text-primary: #F4F4F5;
    --text-secondary: #A1A1AA;
    --accent: #7C3AED;
    --accent-hover: #6D28D9;
    --shadow: 0 4px 24px rgba(0,0,0,0.35);
    --radius: 16px;
    --transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pp-root {
    min-height: 100vh;
    background: var(--bg-app);
    font-family: 'Inter', sans-serif;
    color: var(--text-primary);
    padding-bottom: 80px;
    position: relative;
    z-index: 1;
  }

  .pp-page {
    max-width: 860px;
    margin: 0 auto;
    padding: 24px 20px 80px;
    position: relative;
    z-index: 2;
  }

  /* ── Banner ── */
  .pp-banner {
    width: 100%;
    height: 220px;
    border-radius: 12px 12px 0 0;
    overflow: hidden;
    position: relative;
  }

  .pp-banner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }

  .pp-banner-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1e1e2e 0%, #2a1a4e 40%, #1a0a2e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .pp-banner-placeholder::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.3) 0%, transparent 60%),
                radial-gradient(ellipse at 75% 25%, rgba(139,92,246,0.2) 0%, transparent 50%);
  }

  .pp-banner-placeholder::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 20% 80%, rgba(124,58,237,0.15) 0%, transparent 30%),
      radial-gradient(circle at 80% 20%, rgba(168,85,247,0.12) 0%, transparent 30%);
  }

  /* ── Header row: title + track button ── */
  .pp-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: #13131A;
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    gap: 16px;
  }

  .pp-project-title {
    font-size: 28px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.5px;
    line-height: 1.2;
  }

  .btn-track {
    flex-shrink: 0;
    padding: 9px 20px;
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
    letter-spacing: 0.02em;
    border: 1px solid var(--border);
    background: var(--bg-card);
    color: var(--text-primary);
    white-space: nowrap;
  }

  .btn-track:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(124, 58, 237, 0.08);
  }

  .btn-track.tracking {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  .btn-track.tracking:hover {
    background: var(--accent-hover);
  }

  /* ── Meta row ── */
  .pp-meta-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 24px;
    background: #13131A;
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    flex-wrap: wrap;
  }

  .pp-status-badge {
    background: rgba(124, 58, 237, 0.15);
    color: #a78bfa;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border: 1px solid rgba(124, 58, 237, 0.25);
    flex-shrink: 0;
  }

  .pp-creator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .pp-creator-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .pp-creator-initials {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
  }

  /* ── Description ── */
  .pp-description {
    padding: 0 24px 18px;
    background: #13131A;
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    color: #71717A;
    font-size: 0.9rem;
    line-height: 1.65;
  }

  /* ── Bottom border for header block ── */
  .pp-header-bottom {
    height: 1px;
    background: var(--border);
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    border-radius: 0 0 12px 12px;
  }

  /* ── Section label ── */
  .pp-section-label {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 24px 0 14px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #a78bfa;
  }

  .pp-section-label::before {
    content: '';
    display: block;
    width: 4px;
    height: 16px;
    background: var(--accent);
    border-radius: 2px;
    flex-shrink: 0;
  }

  /* ── Community card ── */
  .pp-community-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow);
  }

  /* ── Posts feed ── */
  .pp-feed {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ── Post item ── */
  .pp-post {
    display: flex;
    gap: 14px;
    padding: 16px 0;
    cursor: pointer;
    transition: background 0.2s ease;
    border-radius: 10px;
    margin: 0 -8px;
    padding-left: 8px;
    padding-right: 8px;
  }

  .pp-post:hover {
    background: #232328;
  }

  .pp-post + .pp-post {
    border-top: 1px solid rgba(42, 42, 47, 0.8);
    margin-top: 0;
    border-radius: 0 0 10px 10px;
  }

  .pp-post:first-child {
    border-radius: 10px 10px 0 0;
  }

  .pp-post-avatar-col {
    flex-shrink: 0;
    padding-top: 2px;
  }

  .pp-post-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
  }

  .pp-post-initials {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), #9333ea);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
  }

  .pp-post-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pp-post-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .pp-post-username {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .pp-post-time {
    font-size: 0.75rem;
    color: var(--text-secondary);
    flex-shrink: 0;
    opacity: 0.65;
  }

  .pp-post-text {
    font-size: 0.925rem;
    color: #D4D4D8;
    line-height: 1.6;
    font-weight: 400;
  }

  .pp-post-image {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    border-radius: 10px;
    border: 1px solid var(--border);
    display: block;
  }



  /* ── Empty feed ── */
  .pp-feed-empty {
    padding: 48px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: var(--text-secondary);
  }

  .pp-feed-empty .empty-icon {
    font-size: 2.5rem;
    opacity: 0.2;
    margin-bottom: 4px;
  }

  .pp-feed-empty p {
    font-size: 0.9rem;
    font-weight: 400;
    opacity: 0.55;
  }

  /* ── Composer ── */
  .pp-composer {
    border-top: 1px solid var(--border);
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #16161C;
  }

  .pp-composer-main {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #0F0F13;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 4px 4px 4px 16px;
    transition: border-color var(--transition);
  }

  .pp-composer-main:focus-within {
    border-color: rgba(124, 58, 237, 0.5);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08);
  }

  .pp-composer-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Inter', sans-serif;
    font-size: 0.925rem;
    color: var(--text-primary);
    font-weight: 400;
    padding: 10px 0;
  }

  .pp-composer-input::placeholder {
    color: #52525B;
  }

  .btn-post {
    flex-shrink: 0;
    background: var(--accent);
    color: #fff;
    border: none;
    padding: 9px 18px;
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: background var(--transition);
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .btn-post:hover { background: var(--accent-hover); }
  .btn-post:active { background: #5B21B6; }
  .btn-post:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-post svg {
    width: 14px;
    height: 14px;
    transform: rotate(-35deg);
    flex-shrink: 0;
  }

  /* ── Attach row ── */
  .pp-attach-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pp-file-label {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 0.825rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 7px;
    border: 1px solid var(--border);
    transition: all var(--transition);
    user-select: none;
    letter-spacing: 0.01em;
  }

  .pp-file-label:hover {
    color: #fff;
    border-color: var(--accent);
    background: rgba(124, 58, 237, 0.1);
  }

  .pp-file-label svg { width: 14px; height: 14px; flex-shrink: 0; }
  .pp-file-hidden { display: none; }

  /* ── Image preview ── */
  .pp-preview-wrap {
    position: relative;
    display: inline-flex;
    align-items: flex-start;
  }

  .pp-preview-img {
    height: 44px;
    width: 44px;
    object-fit: cover;
    border-radius: 7px;
    border: 1px solid var(--border);
  }

  .pp-preview-remove {
    position: absolute;
    top: -7px;
    right: -7px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #EF4444;
    color: #fff;
    border: none;
    font-size: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background var(--transition);
  }

  .pp-preview-remove:hover { background: #DC2626; }

  /* ── Loading ── */
  .pp-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    font-size: 1rem;
    color: var(--text-secondary);
    letter-spacing: 0.04em;
  }

  /* ── Posting state ── */
  .pp-posting-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: pp-spin 0.7s linear infinite;
  }

  @keyframes pp-spin {
    to { transform: rotate(360deg); }
  }
`;

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [msgText, setMsgText] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const fileInputRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { init(); }, [id]);

  const init = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", currentUser.id)
          .single();
        setUserProfile(profile);
      }

      fetchProject(currentUser);
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProject = async (currentUser) => {
    const { data } = await supabase
      .from("projects")
      .select("*, profiles(name, avatar_url)")
      .eq("id", id)
      .single();
    setProject(data);

    if (currentUser) {
      const { data: followData } = await supabase
        .from("project_followers")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", currentUser.id)
        .single();
      if (followData) setIsFollowing(true);
    }
  };

  const toggleFollow = async () => {
    if (!user) return;
    try {
      if (isFollowing) {
        await supabase.from("project_followers").delete().eq("project_id", id).eq("user_id", user.id);
        setIsFollowing(false);
      } else {
        await supabase.from("project_followers").insert([{ project_id: id, user_id: user.id }]);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch posts linked to this project (project_id column)
  // Falls back to project_messages if project_id column doesn't exist yet
  const fetchPosts = async () => {
    try {
      // Try fetching from posts table with project_id
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles(name, avatar_url)")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Parse content if JSON-encoded
        const formatted = (data || []).map((p) => {
          if (p.content && p.content.startsWith("{") && p.content.includes('"text"')) {
            try {
              const parsed = JSON.parse(p.content);
              return { ...p, content: parsed.text || "" };
            } catch (e) {}
          }
          return p;
        });
        setPosts(formatted);
      } else {
        // Fallback to project_messages (legacy)
        const { data: msgs } = await supabase
          .from("project_messages")
          .select("*, profiles(name, avatar_url)")
          .eq("project_id", id)
          .order("created_at", { ascending: false });
        // Map project_messages to a post-like shape (no real post ID for navigation)
        setPosts((msgs || []).map(m => ({
          ...m,
          content: m.message,
          _isLegacyMsg: true,
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendPost = async () => {
    if (!msgText.trim() && !image) return;
    if (!user) return;
    setIsPosting(true);

    try {
      let imageUrl = null;

      if (image) {
        const fileName = `${Date.now()}-${image.name}`;
        const { error: uploadError } = await supabase.storage
          .from("project-images")
          .upload(fileName, image);

        if (uploadError) { console.log(uploadError); setIsPosting(false); return; }

        const { data } = supabase.storage.from("project-images").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      // Insert into posts table with project_id
      // If the column doesn't exist yet, fallback to project_messages
      const { error: postError } = await supabase.from("posts").insert([{
        user_id: user.id,
        content: msgText,
        image_url: imageUrl,
        project_id: id,
      }]);

      if (postError) {
        // Fallback: insert into project_messages (legacy)
        await supabase.from("project_messages").insert([{
          project_id: id,
          user_id: user.id,
          message: msgText,
          image_url: imageUrl,
        }]);
      }

      setMsgText("");
      clearImage();
      fetchPosts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPost();
    }
  };

  const handlePostClick = (post) => {
    if (post._isLegacyMsg) return; // legacy messages can't navigate
    navigate(`/post/${post.id}`);
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="pp-root">
        <BackgroundParticles variant="split" />

        {project ? (
          <div className="pp-page">

            {/* ── 1. Banner ── */}
            <div className="pp-banner">
              {project.image_url ? (
                <img src={project.image_url} alt={`${project.title} banner`} />
              ) : (
                <div className="pp-banner-placeholder" />
              )}
            </div>

            {/* ── 2. Header row: title + track button ── */}
            <div className="pp-header-row">
              <h1 className="pp-project-title">{project.title}</h1>
              {project.user_id !== user?.id && (
                <button
                  className={`btn-track ${isFollowing ? "tracking" : ""}`}
                  onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
                >
                  {isFollowing ? "✓ Tracking" : "Track"}
                </button>
              )}
            </div>

            {/* ── 3. Meta row: status + creator + description ── */}
            <div className="pp-meta-row">
              {project.status && (
                <span className="pp-status-badge">{project.status}</span>
              )}
              <div className="pp-creator">
                {project.profiles?.avatar_url ? (
                  <img
                    src={project.profiles.avatar_url}
                    alt="creator"
                    className="pp-creator-avatar"
                  />
                ) : (
                  <div className="pp-creator-initials">
                    {project.profiles?.name
                      ? project.profiles.name.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                )}
                <span>{project.profiles?.name || "Unknown"}</span>
              </div>
            </div>

            {/* ── Description row ── */}
            {project.description && (
              <div className="pp-description">
                <p style={{ fontsize: '0.9rem', color: '#71717A', lineHeight: 1.65 }}>{project.description}</p>
              </div>
            )}

            {/* ── 4. Bottom border / divider ── */}
            <div className="pp-header-bottom" />

            {/* ── 5. COMMUNITY label ── */}
            <div className="pp-section-label">
              Community ({posts.length})
            </div>

            {/* ── 6. Community card ── */}
            <div className="pp-community-card">

              {/* ── 7. Posts feed ── */}
              <div className="pp-feed">
                {posts.length === 0 ? (
                  <div className="pp-feed-empty">
                    <div className="empty-icon">◻</div>
                    <p>No posts yet — be the first to share an update.</p>
                  </div>
                ) : (
                  posts.map((post) => {
                    // Determine image url
                    const imgUrl = post.image_url || (post.image_urls && post.image_urls[0]);
                    const isClickable = !post._isLegacyMsg;

                    return (
                      <div
                        key={post.id}
                        className="pp-post"
                        style={{ cursor: isClickable ? "pointer" : "default" }}
                        onClick={() => handlePostClick(post)}
                        role={isClickable ? "button" : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                        onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") handlePostClick(post); } : undefined}
                        aria-label={isClickable ? `View post by ${post.profiles?.name || "User"}` : undefined}
                      >
                        {/* Avatar */}
                        <div className="pp-post-avatar-col">
                          {post.profiles?.avatar_url ? (
                            <img
                              src={post.profiles.avatar_url}
                              alt="avatar"
                              className="pp-post-avatar"
                            />
                          ) : (
                            <div className="pp-post-initials">
                              {post.profiles?.name
                                ? post.profiles.name.charAt(0).toUpperCase()
                                : "U"}
                            </div>
                          )}
                        </div>

                        {/* Post body */}
                        <div className="pp-post-body">
                          <div className="pp-post-header">
                            <span className="pp-post-username">
                              {post.profiles?.name || "User"}
                            </span>
                            <span className="pp-post-time">
                              {formatTime(post.created_at)}
                            </span>
                          </div>
                          {post.content && (
                            <p className="pp-post-text">{post.content}</p>
                          )}
                          {imgUrl && (
                            <img
                              src={imgUrl}
                              alt="post"
                              className="pp-post-image"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── 8. Composer ── */}
              <div className="pp-composer">
                <div className="pp-composer-main">
                  <input
                    className="pp-composer-input"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={user ? "Share an update or ask a question…" : "Sign in to post in this community"}
                    disabled={!user || isPosting}
                  />
                  <button
                    className="btn-post"
                    onClick={sendPost}
                    disabled={!user || isPosting || (!msgText.trim() && !image)}
                  >
                    {isPosting ? (
                      <span className="pp-posting-spinner" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    )}
                    Post
                  </button>
                </div>
                <div className="pp-attach-row">
                  <label className="pp-file-label" onClick={(e) => e.stopPropagation()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    Attach Image
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="pp-file-hidden"
                      onChange={handleImageChange}
                      disabled={!user || isPosting}
                    />
                  </label>
                  {imagePreview && (
                    <div className="pp-preview-wrap">
                      <img src={imagePreview} alt="preview" className="pp-preview-img" />
                      <button className="pp-preview-remove" onClick={(e) => { e.stopPropagation(); clearImage(); }}>✕</button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="pp-page">
            <SkeletonLoader type="page" />
          </div>
        )}
      </div>
    </>
  );
}
