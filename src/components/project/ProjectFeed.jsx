import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import useImageUpload from "../../hooks/useImageUpload";
import { timeAgo } from "../../utils/format";
import PostCard from "../PostCard";

export default function ProjectFeed({
  projectId,
  user,
  canView,
  canPost,
  showRequestJoin,
  handleRequestAccess,
  requestStatus,
  isRequestingAccess
}) {
  const { upload: uploadPostImage } = useImageUpload('post-images');
  
  const [posts, setPosts] = useState([]);
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const sentinelRef = useRef(null);

  const [msgText, setMsgText] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  // Auto trigger pagination when sentinel intersects
  useEffect(() => {
    if (!hasMore || isLoadingPosts) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage(p => p + 1);
      }
    });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingPosts]);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    // posts fetched below
  }, [projectId]);

  const fetchPosts = useCallback(async (isInitial = true) => {
    setIsLoadingPosts(true);
    try {
      const { data, error: postErr } = await supabase
        .from("posts")
        .select("*, profiles(name, avatar_url, username)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (!postErr && data) {
        if (data.length < PAGE_SIZE) setHasMore(false);
        else setHasMore(true);

        const formatted = (data || []).map((p) => {
          if (p.content && p.content.startsWith("{") && p.content.includes('"text"')) {
            try {
              const parsed = JSON.parse(p.content);
              return { ...p, content: parsed.text || "" };
            } catch (e) {}
          }
          return p;
        });
        setPosts(prev => isInitial ? formatted : [...prev, ...formatted]);
      } else {
        const { data: msgs } = await supabase
          .from("project_messages")
          .select("*, profiles(name, avatar_url, username)")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          
        if (msgs && msgs.length < PAGE_SIZE) setHasMore(false);
        else setHasMore(true);

        const formattedMsgs = (msgs || []).map(m => ({
          ...m,
          content: m.message,
          _isLegacyMsg: true,
        }));
        setPosts(prev => isInitial ? formattedMsgs : [...prev, ...formattedMsgs]);
      }
    } catch (err) {
      setError("Failed to fetch posts.");
    }
    setIsLoadingPosts(false);
  }, [projectId, page]);

  useEffect(() => {
    if (canView) {
      fetchPosts(page === 0);
    } else {
      setPosts([]);
    }
  }, [canView, fetchPosts, page]);

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
        imageUrl = await uploadPostImage(image, `${Date.now()}-`);
        if (!imageUrl) {
          setError("Failed to upload image.");
          setIsPosting(false);
          return;
        }
      }

      const { data: insertedData, error: postError } = await supabase.from("posts").insert([{
        user_id: user.id,
        content: msgText,
        image_url: imageUrl,
        project_id: projectId,
      }]).select("*, profiles(name, avatar_url, username)").single();

      if (postError) {
        await supabase.from("project_messages").insert([{
          project_id: projectId,
          user_id: user.id,
          message: msgText,
          image_url: imageUrl,
        }]);
      } else if (insertedData) {
        setPosts(prev => [insertedData, ...prev]);
      }

      setMsgText("");
      clearImage();
    } catch (err) {
      setError("Failed to post.");
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

  return (
    <>
      {error && (
        <div style={{ background: '#ef4444', color: 'white', padding: '12px 24px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {/* ── 5. COMMUNITY label ── */}
      <div className="pp-section-label">
        Community {canView && `(${posts.length})`}
      </div>

      {/* ── 6. Community card ── */}
      <div className="pp-community-card">
        {!canView ? (
          <div className="pp-restricted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <p>This project's community is restricted.</p>
            {showRequestJoin && (
              <button 
                className="btn-request" 
                onClick={handleRequestAccess}
                disabled={requestStatus === 'pending' || isRequestingAccess}
                style={{ opacity: isRequestingAccess ? 0.7 : 1, display: 'flex', justifyContent: 'center' }}
              >
                {isRequestingAccess ? <div className="btn-spinner" style={{ borderColor: "rgba(124,58,237,0.3)", borderTopColor: "var(--accent)" }}></div> : requestStatus === 'pending' ? 'Request pending — waiting for creator approval' : 'Request to Join'}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ── 7. Posts feed ── */}
            <div className="pp-feed">
              {posts.length === 0 && !isLoadingPosts ? (
                <div className="pp-feed-empty">
                  <div className="empty-icon">◻</div>
                  <p>No posts yet — be the first to share an update.</p>
                </div>
              ) : (
                posts.map((post) => {
                  // Legacy project_messages: render simple read-only card
                  if (post._isLegacyMsg) {
                    const imgUrl = post.image_url || (post.image_urls && post.image_urls[0]);
                    return (
                      <div key={post.id} className="pp-post" style={{ cursor: 'default' }}>
                        <div className="pp-post-avatar-wrap">
                          {post.profiles?.avatar_url ? (
                            <img src={post.profiles.avatar_url} alt="avatar" className="pp-post-avatar" />
                          ) : (
                            <div className="pp-post-initials">
                              {post.profiles?.name ? post.profiles.name.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}
                        </div>
                        <div className="pp-post-body">
                          <div className="pp-post-header">
                            <span className="pp-post-username">{post.profiles?.name || "User"}</span>
                            <span className="pp-post-time">{timeAgo(post.created_at)}</span>
                          </div>
                          {post.content && <p className="pp-post-text">{post.content}</p>}
                          {imgUrl && <img src={imgUrl} alt="post" className="pp-post-image" />}
                        </div>
                      </div>
                    );
                  }

                  // Real posts: use PostCard for identical click behavior as Explore
                  return (
                    <PostCard
                      key={post.id}
                      post={post}
                    />
                  );
                })
              )}
              
              {/* Pagination Sentinel */}
              {hasMore && (
                <div ref={sentinelRef} style={{ height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '16px' }}>
                  {isLoadingPosts && <div className="btn-spinner" style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--text-secondary)' }}></div>}
                </div>
              )}
            </div>

            {/* ── 8. Composer ── */}
            {!canPost ? (
              <div className="pp-composer-restricted">
                <span>You need access to post here.</span>
                {showRequestJoin && (
                  <button 
                    className="btn-request" 
                    onClick={handleRequestAccess}
                    disabled={requestStatus === 'pending' || isRequestingAccess}
                    style={{ opacity: isRequestingAccess ? 0.7 : 1, display: 'flex', justifyContent: 'center' }}
                  >
                    {isRequestingAccess ? <div className="btn-spinner" style={{ borderColor: "rgba(124,58,237,0.3)", borderTopColor: "var(--accent)" }}></div> : requestStatus === 'pending' ? 'Request pending — waiting for creator approval' : 'Request to Join'}
                  </button>
                )}
              </div>
            ) : (
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
            )}
          </>
        )}
      </div>
    </>
  );
}
