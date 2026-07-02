import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import useAuth from "../hooks/useAuth";
import { insertNotification } from "../utils/supabase-helpers";
import { formatTimestamp } from "../utils/format";
import PostCard from "../components/PostCard";
import SkeletonLoader from "../components/SkeletonLoader";
import BackgroundParticles from "../components/BackgroundParticles";

const styles = `
  .pd-root {
    min-height: 100vh;
    background: var(--bg-app);
    font-family: 'Inter', sans-serif;
    color: var(--text-primary);
    padding: 80px 24px 80px;
    position: relative;
    z-index: 1;
  }
  .pd-inner {
    max-width: 700px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
  }
  .back-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 24px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: inherit;
  }
  .back-btn:hover {
    color: var(--text-primary);
    border-color: var(--accent);
    background: rgba(124, 58, 237, 0.08);
  }
  .pd-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    max-width: 700px;
    margin: 0 auto;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }
  .comments-section {
    margin-top: 24px;
    background: transparent;
    border: none;
    padding: 0;
  }
  .comments-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 20px;
    color: var(--text-primary);
  }
  .comment-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }
  .detail-comment-item {
    display: flex;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .detail-comment-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .comment-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--bg-app);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    font-size: 1rem;
    flex-shrink: 0;
  }
  .comment-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .comment-content-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .comment-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .comment-author-name {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text-primary);
  }
  .comment-time {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  .comment-body-text {
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-primary);
  }
  .detail-comment-box {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
  }
  .detail-comment-box input {
    flex: 1;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg-app);
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s ease;
  }
  .detail-comment-box input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
  }
  .detail-comment-box button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 24px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s ease;
  }
  .detail-comment-box button:hover {
    background: var(--accent-hover);
  }
  .empty-comments {
    color: var(--text-secondary);
    font-style: italic;
    font-size: 0.95rem;
  }
  /* ── Project badge ── */
  .pd-project-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(124, 58, 237, 0.12);
    color: #A78BFA;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid rgba(124, 58, 237, 0.2);
    transition: background 0.2s ease, border-color 0.2s ease;
    margin-bottom: 16px;
    text-decoration: none;
    font-family: inherit;
    line-height: 1.4;
  }
  .pd-project-badge:hover {
    background: rgba(124, 58, 237, 0.2);
    border-color: rgba(124, 58, 237, 0.4);
  }
  .pd-project-badge svg {
    flex-shrink: 0;
    opacity: 0.85;
  }
`;

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const init = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPost(),
        fetchComments()
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(name, avatar_url, username), projects(id, title)")
      .eq("id", postId)
      .single();

    if (error) {
      console.error("Error fetching post:", error);
      return;
    }

    // Extract joined project info before formatting
    if (data.projects) {
      setProject(data.projects);
    }

    let formatted = data;
    if (data.content && data.content.startsWith("{") && data.content.includes('"text"')) {
      try {
        const parsed = JSON.parse(data.content);
        formatted = { ...data, content: parsed.text || "", category: parsed.category, topic: parsed.topic };
      } catch (e) {}
    }
    setPost(formatted);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles(name, avatar_url, username)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }
    setComments(data || []);
  };

  const handleAddComment = async () => {
    if (!currentUser || newComment.trim() === "") return;

    // 🛑 Rate Limit Check
    const { data: isAllowed, error: rlError } = await supabase.rpc('check_rate_limit', {
      p_user_id: currentUser.id,
      p_action: 'comments',
      p_max_count: 20,
      p_window_seconds: 60
    });

    if (rlError) {
      console.error("Rate limit check failed:", rlError);
    } else if (!isAllowed) {
      alert("You're commenting too fast — please wait a moment.");
      return;
    }

    const { error } = await supabase.from("comments").insert([
      {
        user_id: currentUser.id,
        post_id: postId,
        content: newComment,
      },
    ]);

    if (!error) {
      setNewComment("");
      await fetchComments();

      if (post && currentUser.id !== post.user_id) {
        await insertNotification(currentUser.id, post.user_id, 'comment', postId, 'commented on your post');
      }
    } else {
      alert(error.message);
    }
  };

  const handlePostDeleted = () => {
    navigate("/home");
  };

  if (loading) {
    return (
      <div className="pd-root">
        <style>{styles}</style>
        <div className="pd-inner">
          <SkeletonLoader type="post" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pd-root">
        <style>{styles}</style>
        <div className="pd-inner">
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Back
          </button>
          <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "40px 0" }}>
            Post not found or has been deleted.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="pd-root">
        <BackgroundParticles variant="split" />
        <div className="pd-inner">
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Back
          </button>

          <div className="pd-card">
            {/* Project badge — only shown when post belongs to a project */}
            {post.project_id && project && (
              <button
                className="pd-project-badge"
                onClick={() => navigate(`/project/${post.project_id}`)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Posted in {project.title}
              </button>
            )}

            <PostCard post={post} isDetail={true} onDelete={handlePostDeleted} />

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

            <div className="comments-section">
              <h3 className="comments-title">Comments ({comments.length})</h3>

              {comments.length === 0 ? (
                <div className="empty-comments">No comments yet — be the first to share your thoughts.</div>
              ) : (
                <div className="comment-list">
                  {comments.map((c) => (
                    <div key={c.id} className="detail-comment-item">
                      <Link 
                        to={`/profile/${c.profiles?.username || c.user_id}`} 
                        className="comment-avatar"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {c.profiles?.avatar_url ? (
                          <img src={c.profiles.avatar_url} alt="avatar" />
                        ) : (
                          c.profiles?.name ? c.profiles.name.charAt(0).toUpperCase() : "U"
                        )}
                      </Link>
                      <div className="comment-content-wrap">
                        <div className="comment-header-row">
                          <Link 
                            to={`/profile/${c.profiles?.username || c.user_id}`}
                            className="comment-author-name"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            {c.profiles?.name || "User"}
                          </Link>
                          <span className="comment-time">{formatTimestamp(c.created_at)}</span>
                        </div>
                        <div className="comment-body-text">{c.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentUser && (
                <div className="detail-comment-box">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddComment();
                    }}
                  />
                  <button onClick={handleAddComment}>Post</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
