import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function ProfilePosts({ user, profileData, setPostsCount }) {
  const navigate = useNavigate();
  const [myPosts, setMyPosts] = useState([]);
  const [postComments, setPostComments] = useState({});
  const [postLikes, setPostLikes] = useState({});
  const [showPostComments, setShowPostComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [isCommenting, setIsCommenting] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyPosts(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMyPosts = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(`*, profiles(name, avatar_url, username)`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error.message);
      setLoading(false);
      return;
    }

    const parsed = (data || []).map(p => {
      if (p.content && p.content.startsWith("{") && p.content.includes('"text"')) {
        try {
          const obj = JSON.parse(p.content);
          return { ...p, content: obj.text || "", category: obj.category, topic: obj.topic };
        } catch (e) {}
      }
      return p;
    });

    setMyPosts(parsed);
    if (setPostsCount) setPostsCount(parsed.length);

    const likesMap = {};
    for (const post of parsed) {
      const { data: likes } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", post.id);
      likesMap[post.id] = likes?.length || 0;
    }
    setPostLikes(likesMap);
    setLoading(false);
  };

  const deleteMyPost = async (postId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      alert("Could not delete: " + error.message);
    } else {
      setMyPosts(prev => prev.filter(p => p.id !== postId));
      if (setPostsCount) setPostsCount(prev => prev - 1);
    }
  };

  const fetchPostComments = async (postId) => {
    const { data } = await supabase
      .from("comments")
      .select(`*, profiles(name, avatar_url, username)`)
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    setPostComments(prev => ({ ...prev, [postId]: data || [] }));
  };

  const togglePostComments = async (postId) => {
    const isShowing = showPostComments[postId];
    if (!isShowing) await fetchPostComments(postId);
    setShowPostComments(prev => ({ ...prev, [postId]: !isShowing }));
  };

  const handlePostComment = async (postId) => {
    if (!user || !commentInputs[postId]?.trim()) return;
    setIsCommenting(prev => ({ ...prev, [postId]: true }));
    const { error } = await supabase.from("comments").insert([{
      user_id: user.id,
      post_id: postId,
      content: commentInputs[postId],
    }]);
    if (!error) {
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      await fetchPostComments(postId);
    }
    setIsCommenting(prev => ({ ...prev, [postId]: false }));
  };

  return (
    <div style={{ marginTop: '48px' }}>
      <p className="section-label">My Posts ({myPosts.length})</p>
      {loading ? (
         <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '16px 0' }}>Loading posts...</div>
      ) : (
        <div className="my-posts-list">
          {myPosts.length === 0 ? (
            <div className="my-post-empty">
              <p>You haven't posted anything yet</p>
              <button className="btn-go-dashboard" onClick={() => navigate('/home')}>Go to Dashboard</button>
            </div>
          ) : (
            myPosts.map(post => {
              let images = [];
              if (post.image_urls?.length > 0) images = post.image_urls;
              else if (post.image_url) images = [post.image_url];

              return (
                <div key={post.id} className="my-post-card">
                  <button className="post-delete-btn" onClick={() => deleteMyPost(post.id)}>Delete</button>
                  <div className="my-post-header">
                    <div className="my-post-avatar">
                      {profileData?.avatar_url ? (
                        <img src={profileData.avatar_url} alt="avatar" />
                      ) : (
                        profileData?.name ? profileData.name.charAt(0).toUpperCase() : "U"
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span className="my-post-username" style={{ lineHeight: '1.2' }}>{profileData?.name || "User"}</span>
                      {profileData?.username && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          @{profileData.username}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="my-post-content">
                    <p>{post.content}</p>
                  </div>
                  {(post.category || post.topic) && (
                    <div className="my-post-tags">
                      {post.category && <span className="my-post-tag">{post.category}</span>}
                      {post.topic && <span className="my-post-tag">{post.topic}</span>}
                    </div>
                  )}
                  {images.length > 0 && (
                    <img src={images[0]} alt="post" className="my-post-image" />
                  )}
                  <div className="my-post-actions">
                    <span className="my-post-like">❤️ {postLikes[post.id] || 0}</span>
                    <button className="my-post-comments-btn" onClick={() => togglePostComments(post.id)}>
                      💬 {showPostComments[post.id] ? "Hide comments" : "Show comments"}
                    </button>
                  </div>
                  {showPostComments[post.id] && (
                    <>
                      <div className="my-post-comments-container">
                        {(postComments[post.id] || []).length === 0 ? (
                          <p style={{ color: 'var(--ink-muted)', fontSize: '13px' }}>No comments yet.</p>
                        ) : (
                          (postComments[post.id] || []).slice(0, 4).map(c => (
                            <div key={c.id} className="my-post-comment-item">
                              <span className="my-post-comment-user">
                                {c.profiles?.avatar_url ? (
                                  <img src={c.profiles.avatar_url} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--border)', color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                    {c.profiles?.name ? c.profiles.name.charAt(0).toUpperCase() : "U"}
                                  </span>
                                )}
                                {c.profiles?.name || "User"}
                              </span>
                              : {c.content}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="my-post-comment-box">
                        <input
                          value={commentInputs[post.id] || ""}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="Write a comment..."
                          onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(post.id); }}
                        />
                        <button onClick={() => handlePostComment(post.id)} disabled={isCommenting[post.id]} style={{ opacity: isCommenting[post.id] ? 0.7 : 1 }}>
                          {isCommenting[post.id] ? <div className="btn-spinner"></div> : "Post"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
