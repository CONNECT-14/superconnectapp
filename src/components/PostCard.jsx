import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { supabase } from "../supabaseClient";
import { insertNotification } from "../utils/supabase-helpers";
import "./PostCard.css";

export default function PostCard({ post, onDelete, isDetail = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const [following, setFollowing] = useState(false);

  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  const [showComments, setShowComments] = useState(false);

  const [isLiking, setIsLiking] = useState(false);
  const [isFollowingAction, setIsFollowingAction] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  // ================= INIT =================
  useEffect(() => {
    if (user) {
      fetchLikes();
      checkLike(user);
      checkFollow(user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, user]);

  // ================= LIKE =================

  const fetchLikes = async () => {
    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", post.id);

    setLikeCount(data?.length || 0);
  };

  const checkLike = async (currentUser) => {
    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("post_id", post.id);

    setLiked(data?.length > 0);
  };

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    const start = Date.now();

    const previousLiked = liked;
    const previousLikeCount = likeCount;

    // Optimistic Update
    setLiked(!previousLiked);
    setLikeCount((prev) => previousLiked ? prev - 1 : prev + 1);

    if (previousLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", post.id);

      if (error) {
        setLiked(previousLiked);
        setLikeCount(previousLikeCount);
        alert("Failed to unlike post.");
      }
    } else {
      const { error } = await supabase.from("likes").insert([
        {
          user_id: user.id,
          post_id: post.id,
        },
      ]);

      if (error) {
        setLiked(previousLiked);
        setLikeCount(previousLikeCount);
        alert("Failed to like post.");
      } else {
        if (user.id !== post.user_id) {
          // Fire and forget notification
          insertNotification(user.id, post.user_id, 'like', post.id, 'liked your post').then();
        }
      }
    }
    
    const elapsed = Date.now() - start;
    if (elapsed < 1000) {
      setTimeout(() => setIsLiking(false), 1000 - elapsed);
    } else {
      setIsLiking(false);
    }
  };

  // ================= FOLLOW =================

  const checkFollow = async (currentUser) => {
  // ❌ prevent self follow check
  if (currentUser.id === post.user_id) {
    setFollowing(false);
    return;
  }

  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", currentUser.id)
    .eq("following_id", post.user_id);

  setFollowing(data?.length > 0);
};

  const handleFollow = async () => {
  if (!user || user.id === post.user_id || isFollowingAction) return;

  setIsFollowingAction(true);
  const start = Date.now();

  const previousFollowing = following;
  
  // Optimistic Update
  setFollowing(!previousFollowing);

  if (previousFollowing) {
    // 👉 UNFOLLOW
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", post.user_id);

    if (error) {
      setFollowing(previousFollowing);
      alert("Failed to unfollow user.");
    }
  } else {
    // 👉 FOLLOW
    const { error } = await supabase.from("follows").insert([
      {
        follower_id: user.id,
        following_id: post.user_id,
      },
    ]);

    if (error) {
      setFollowing(previousFollowing);
      alert("Failed to follow user.");
    }
  }
  
  const elapsed = Date.now() - start;
  if (elapsed < 1000) {
    setTimeout(() => setIsFollowingAction(false), 1000 - elapsed);
  } else {
    setIsFollowingAction(false);
  }
};
  // ================= DELETE =================

  const handleDelete = async () => {
    if (!user) return;

    const confirmDelete = window.confirm("Delete this post?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id);

    if (error) {
      alert(error.message);
    } else {
      if (onDelete) onDelete();
    }
  };

  // ================= COMMENTS =================

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(`*, profiles(name, avatar_url, username)`)
      .eq("post_id", post.id)
      .order("created_at", { ascending: false });

    setComments(data || []);
  };

  const handleComment = async () => {
    if (!user || comment.trim() === "") return;

    setIsCommenting(true);

    // 🛑 Rate Limit Check
    const { data: isAllowed, error: rlError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_action: 'comments',
      p_max_count: 20,
      p_window_seconds: 60
    });

    if (rlError) {
      console.error("Rate limit check failed:", rlError);
    } else if (!isAllowed) {
      alert("You're commenting too fast — please wait a moment.");
      setIsCommenting(false);
      return;
    }

    const { error } = await supabase.from("comments").insert([
      {
        user_id: user.id,
        post_id: post.id,
        content: comment,
      },
    ]);

    if (!error) {
      setComment("");
      fetchComments();
      
      if (user.id !== post.user_id) {
        await insertNotification(user.id, post.user_id, 'comment', post.id, 'commented on your post');
      }
    }
    
    setIsCommenting(false);
  };

  const toggleComments = async () => {
    if (!showComments) await fetchComments();
    setShowComments(!showComments);
  };

  // ================= IMAGE =================

  let images = [];

  if (post.image_urls?.length > 0) {
    images = post.image_urls;
  } else if (post.image_url) {
    images = [post.image_url];
  }

  // ================= 🔥 FINAL USERNAME FIX =================

  const username = post?.profiles?.name;

  // fallback ONLY if truly missing
  const displayName = username ? username : "User";

  // ================= UI =================

  const handleCardClick = () => {
    if (!isDetail) {
      navigate(`/post/${post.id}`);
    }
  };

  return (
    <div className={`post-card ${!isDetail ? 'clickable' : 'borderless'}`} onClick={handleCardClick}>

      {/* HEADER */}
      <div className="post-header">
        <div 
          className="user-info" 
          style={{ alignItems: 'center', cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${post.profiles?.username || post.user_id}`);
          }}
        >
          <div className="avatar" style={{ overflow: 'hidden' }}>
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              "👤"
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="username" style={{ lineHeight: '1.2' }}>{displayName}</span>
            {post.profiles?.username && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                @{post.profiles.username}
              </span>
            )}
          </div>
        </div>

        {user && user.id !== post.user_id && (
          <button className="follow-btn" onClick={(e) => { e.stopPropagation(); handleFollow(); }} disabled={isFollowingAction} style={{ opacity: isFollowingAction ? 0.7 : 1 }}>
            {isFollowingAction ? <div className="btn-spinner"></div> : following ? "Following" : "Follow"}
          </button>
        )}

        {user && user.id === post.user_id && (
          <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
            Delete
          </button>
        )}
      </div>

      {/* CONTENT */}
      <div className="post-content">
        <p>{post.content}</p>
      </div>

      {/* TAGS */}
      {(post.category || post.topic) && (
        <div className="post-tags">
          {post.category && <span className="post-tag category-tag">{post.category}</span>}
          {post.topic && <span className="post-tag topic-tag">{post.topic}</span>}
        </div>
      )}

      {/* IMAGE */}
      {images.length > 0 && (
        <div className="post-image-container">
          <img src={images[0]} alt="post" />
        </div>
      )}

      {/* LIKE */}
      <div className="post-actions">
        <button className="like-btn" onClick={(e) => { e.stopPropagation(); handleLike(); }} disabled={isLiking} style={{ opacity: isLiking ? 0.7 : 1 }}>
          {isLiking ? <div className="btn-spinner" style={{ borderColor: "rgba(124, 58, 237, 0.3)", borderTopColor: "var(--accent)" }}></div> : <>{liked ? "❤️" : "🤍"} {likeCount}</>}
        </button>
      </div>

      {/* COMMENTS */}
      {!isDetail && (
        <button className="view-comments-btn" onClick={(e) => { e.stopPropagation(); toggleComments(); }}>
          💬 {showComments ? "Hide comments" : "Show comments"}
        </button>
      )}

      {!isDetail && showComments && (
        <>
          <div className="comments-container" onClick={(e) => e.stopPropagation()}>
            {comments.slice(0, 4).map((c) => (
              <div key={c.id} className="comment-item">
                <span 
                  className="comment-user" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${c.profiles?.username || c.user_id}`);
                  }}
                >
                  {c.profiles?.avatar_url ? (
                    <img src={c.profiles.avatar_url} alt="avatar" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                      {c.profiles?.name ? c.profiles.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  {c.profiles?.name || "User"}
                </span>
                : {c.content}
              </div>
            ))}
          </div>

          <div className="comment-box" onClick={(e) => e.stopPropagation()}>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
            />
            <button onClick={(e) => { e.stopPropagation(); handleComment(); }} disabled={isCommenting} style={{ opacity: isCommenting ? 0.7 : 1 }}>
              {isCommenting ? <div className="btn-spinner"></div> : "Post"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}