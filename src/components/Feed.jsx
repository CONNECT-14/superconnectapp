import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import PostCard from "./PostCard";
import ProjectFeedCard from "./ProjectFeedCard";
import SkeletonLoader from "./SkeletonLoader";

export default function Feed({ refresh, feedType, currentUser, search, category, topic, sort, globalMode = false }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState(null);

  // For empty states
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingProgress, setFollowingProgress] = useState({});

  
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  // Auto trigger pagination when sentinel intersects
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage(p => p + 1);
      }
    });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setPosts([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, feedType, currentUser, search, category, topic, sort, globalMode]);

  useEffect(() => {
    fetchPosts(page === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, refresh, feedType, currentUser, search, category, topic, sort, globalMode]);


  const fetchPosts = async (isInitial = true) => {
    if (isInitial) setLoading(true);
    const start = Date.now();
    await _fetchPostsInner(isInitial);
    const elapsed = Date.now() - start;
    if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
    if (isInitial) setLoading(false);
  };

  const _fetchPostsInner = async (isInitial) => {
    // if (isInitial) setLoading(true);
    setErrorObj(null);
    setSuggestedUsers([]);
    // setSuggestedProjects([]);

    try {
      // ─── Step 1: Get who the user follows ───────────────────────────────────
      let followingIds = [];
      if (currentUser) {
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", currentUser.id);
        followingIds = follows?.map(f => f.following_id) || [];
      }

      // ─── ALL TAB ─────────────────────────────────────────────────────────────
      if (feedType === 'All') {
        if (!globalMode && followingIds.length === 0) {
          // empty state: suggest users
          if (currentUser) {
            const { data: sUsers } = await supabase
              .from("profiles")
              .select("*")
              .neq("id", currentUser.id)
              .limit(3);
            setSuggestedUsers(sUsers || []);
          }
          setPosts([]);
          // if (isInitial) setLoading(false);
          return;
        }

        // fetch posts by followed users (or all if globalMode)
        let postQuery = supabase
          .from("posts")
          .select(`*, profiles(name, avatar_url, username)`)
          .order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (!globalMode) {
          postQuery = postQuery.in("user_id", followingIds);
        }

        if (search && search.trim() !== "") {
          const { data: users } = await supabase.from("profiles").select("id").ilike("name", `%${search}%`);
          const matchIds = (users?.map(u => u.id) || []).filter(id => followingIds.includes(id));
          if (matchIds.length === 0) { setPosts([]); /* if (isInitial) setLoading(false); */ return; }
          postQuery = postQuery.in("user_id", matchIds);
        }

        const { data: postData, error: postErr } = await postQuery;
        if (postErr) throw postErr;

        let posts = (postData || []).map(p => {
          if (p.content && p.content.startsWith("{") && p.content.includes('"text"')) {
            try {
              const parsed = JSON.parse(p.content);
              return { ...p, content: parsed.text || "", category: parsed.category, topic: parsed.topic, type: 'post' };
            } catch (e) {}
          }
          return { ...p, type: 'post' };
        });

        if (category && category !== "All") posts = posts.filter(p => p.category === category);
        if (topic && topic !== "All") posts = posts.filter(p => p.topic === topic);

        let mergedProjects = [];
if (isInitial) {
// fetch projects (source 2)
        let projQuery = supabase
          .from("projects")
          .select(`*, profiles(name, avatar_url, username)`)
          .order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (!globalMode) {
          projQuery = projQuery.in("user_id", followingIds);
        }

        if (search && search.trim() !== "") {
          projQuery = projQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data: projData } = await projQuery;
        const followedUserProjects = (projData || []).map(pr => ({ ...pr, type: 'project' }));

        // fetch directly followed projects from project_followers (source 3)
        let directFollowedProjects = [];
        if (currentUser) {
          const { data: pfData } = await supabase
            .from("project_followers")
            .select("project_id")
            .eq("user_id", currentUser.id);
          const directProjIds = pfData?.map(p => p.project_id) || [];

          if (directProjIds.length > 0) {
            let directProjQuery = supabase
              .from("projects")
              .select(`*, profiles(name, avatar_url, username)`)
              .in("id", directProjIds)
              .order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (search && search.trim() !== "") {
              directProjQuery = directProjQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
            }

            const { data: directData } = await directProjQuery;
            directFollowedProjects = (directData || []).map(pr => ({ ...pr, type: 'project' }));
          }
        }

        // merge all projects, deduplicate by id
        const allProjectsMap = new Map();
        [...followedUserProjects, ...directFollowedProjects].forEach(pr => {
          if (!allProjectsMap.has(pr.id)) allProjectsMap.set(pr.id, pr);
        });
        Array.from(allProjectsMap.values());
}

        // combine posts + merged projects, sort by created_at
        let combined = isInitial ? [...posts, ...mergedProjects].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : posts;

        if (sort === "top" || sort === "most_replies") {
          const [{ data: likesData }, { data: commentsData }] = await Promise.all([
            supabase.from("likes").select("post_id"),
            supabase.from("comments").select("post_id")
          ]);
          const likeCounts = {};
          likesData?.forEach(l => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
          const commentCounts = {};
          commentsData?.forEach(c => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });
          const postsOnly = combined.filter(i => i.type === 'post').map(p => ({
            ...p,
            _likes_count: likeCounts[p.id] || 0,
            _comments_count: commentCounts[p.id] || 0
          }));
          const projectsOnly = combined.filter(i => i.type === 'project');
          if (sort === "top") postsOnly.sort((a, b) => b._likes_count - a._likes_count);
          if (sort === "most_replies") postsOnly.sort((a, b) => b._comments_count - a._comments_count);
          combined = [...postsOnly, ...projectsOnly];
        }

        setPosts(prev => isInitial ? combined : [...prev, ...combined]);
        // if (isInitial) setLoading(false);
        return;
      }

      // ─── POSTS TAB ───────────────────────────────────────────────────────────
      if (feedType === 'Posts') {
        if (!globalMode && followingIds.length === 0) {
          if (currentUser) {
            const { data: sUsers } = await supabase
              .from("profiles")
              .select("*")
              .neq("id", currentUser.id)
              .limit(3);
            setSuggestedUsers(sUsers || []);
          }
          setPosts([]);
          // if (isInitial) setLoading(false);
          return;
        }

        let postQuery = supabase
          .from("posts")
          .select(`*, profiles(name, avatar_url, username)`)
          .order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (!globalMode) {
          postQuery = postQuery.in("user_id", followingIds);
        }

        if (search && search.trim() !== "") {
          const { data: users } = await supabase.from("profiles").select("id").ilike("name", `%${search}%`);
          const matchIds = (users?.map(u => u.id) || []).filter(id => followingIds.includes(id));
          if (matchIds.length === 0) { setPosts([]); /* if (isInitial) setLoading(false); */ return; }
          postQuery = postQuery.in("user_id", matchIds);
        }

        const { data: postData, error: postErr } = await postQuery;
        if (postErr) throw postErr;

        let result = (postData || []).map(p => {
          if (p.content && p.content.startsWith("{") && p.content.includes('"text"')) {
            try {
              const parsed = JSON.parse(p.content);
              return { ...p, content: parsed.text || "", category: parsed.category, topic: parsed.topic, type: 'post' };
            } catch (e) {}
          }
          return { ...p, type: 'post' };
        });

        if (category && category !== "All") result = result.filter(p => p.category === category);
        if (topic && topic !== "All") result = result.filter(p => p.topic === topic);

        if (sort === "top" || sort === "most_replies") {
          const [{ data: likesData }, { data: commentsData }] = await Promise.all([
            supabase.from("likes").select("post_id"),
            supabase.from("comments").select("post_id")
          ]);
          const likeCounts = {};
          likesData?.forEach(l => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
          const commentCounts = {};
          commentsData?.forEach(c => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });
          result = result.map(p => ({ ...p, _likes_count: likeCounts[p.id] || 0, _comments_count: commentCounts[p.id] || 0 }));
          if (sort === "top") result.sort((a, b) => b._likes_count - a._likes_count);
          if (sort === "most_replies") result.sort((a, b) => b._comments_count - a._comments_count);
        }

        setPosts(result);
        // if (isInitial) setLoading(false);
        return;
      }

      // ─── PROJECTS TAB ────────────────────────────────────────────────────────
      if (feedType === 'Projects') {
        let allProjectIds = [];
        
        if (!globalMode) {
          // Projects directly followed by user
          let directlyFollowedProjectIds = [];
          if (currentUser) {
            const { data: pf } = await supabase
              .from("project_followers")
              .select("project_id")
              .eq("user_id", currentUser.id);
            directlyFollowedProjectIds = pf?.map(p => p.project_id) || [];
          }

          // Projects created by people the user follows
          let followedUserProjectIds = [];
          if (followingIds.length > 0) {
            const { data: fp } = await supabase
              .from("projects")
              .select("id")
              .in("user_id", followingIds);
            followedUserProjectIds = fp?.map(p => p.id) || [];
          }

          allProjectIds = [...new Set([...directlyFollowedProjectIds, ...followedUserProjectIds])];

          if (allProjectIds.length === 0) {
            setPosts([]);
            // if (isInitial) setLoading(false);
            return;
          }
        }

        let projQuery = supabase
          .from("projects")
          .select(`*, profiles(name, avatar_url, username)`)
          .order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (!globalMode) {
          projQuery = projQuery.in("id", allProjectIds);
        }

        if (search && search.trim() !== "") {
          projQuery = projQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data: projData, error: projErr } = await projQuery;
        if (projErr) throw projErr;

        const projects = (projData || []).map(pr => ({ ...pr, type: 'project' }));
        setPosts(projects);
        // if (isInitial) setLoading(false);
        return;
      }

    } catch (err) {
      console.error("Feed error:", err);
      setErrorObj(err.message || "Failed to load feed.");
    } finally {
      // if (isInitial) setLoading(false);
    }
  };

  const handleDeletePost = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleFollowUser = async (targetId) => {
    if (!currentUser) return;
    setFollowingProgress(prev => ({ ...prev, [targetId]: true }));
    const { error } = await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: targetId });
    if (!error) {
      setSuggestedUsers(prev => prev.filter(u => u.id !== targetId));
    }
    setFollowingProgress(prev => ({ ...prev, [targetId]: false }));
  };

  // const handleFollowProject = async (targetId) => {
  //   if (!currentUser) return;
  //   const { error } = await supabase.from("project_followers").insert({ user_id: currentUser.id, project_id: targetId });
  //   if (!error) {
  //     setSuggestedProjects(prev => prev.filter(p => p.id !== targetId));
  //   }
  // };

  return (
    <div>
      <style>{`
        .empty-feed-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 32px 24px;
          text-align: center;
          margin-bottom: 24px;
        }
        .empty-feed-title {
          font-size: 16px;
          font-weight: bold;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .empty-feed-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }
        .suggestion-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }
        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: transparent;
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        .suggestion-item img, .suggestion-item .placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }
        .suggestion-item .placeholder {
          background: var(--accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .suggestion-info { flex: 1; }
        .suggestion-name { font-size: 14px; font-weight: bold; color: var(--text-primary); }
        .suggestion-meta { font-size: 12px; color: var(--text-secondary); }
        .suggestion-btn {
          background: var(--accent);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
      
      {loading ? (
        <div className="posts-list" style={{ marginTop: 24 }}>
          <SkeletonLoader type="post" />
          <SkeletonLoader type="post" />
          <SkeletonLoader type="post" />
        </div>
      ) : errorObj ? (
        <div style={{ color: "var(--accent)", textAlign: "center", padding: "20px", background: "rgba(200,68,26,0.1)", borderRadius: "8px", border: "1px solid var(--accent)" }}>
          <p style={{ fontWeight: "600", marginBottom: "8px" }}>Network Action Failed</p>
          <p style={{ fontSize: "0.9rem" }}>{errorObj}</p>
          <button onClick={fetchPosts} style={{ marginTop: "12px", background: "var(--accent)", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>Retry</button>
        </div>
      ) : (
        <>
        <div className="posts-list" style={{ marginTop: 24 }}>
          {/* ALL & POSTS empty state: not following anyone */}
          {(feedType === 'All' || feedType === 'Posts') && posts.length === 0 && !globalMode && suggestedUsers.length > 0 && (
            <div className="empty-feed-card">
              <div className="empty-feed-title">Follow people to see their feed</div>
              <div className="empty-feed-subtitle">Here are some suggested users you might know:</div>
              <div className="suggestion-list">
                {suggestedUsers.map(u => (
                  <div key={u.id} className="suggestion-item">
                    <Link to={`/profile/${u.username || u.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit', flex: 1 }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="Avatar" />
                      ) : (
                        <div className="placeholder">{u.name ? u.name.charAt(0) : "U"}</div>
                      )}
                      <div className="suggestion-info">
                        <div className="suggestion-name">{u.name || "User"}</div>
                        <div className="suggestion-meta">{u.occupation || "Member"}</div>
                      </div>
                    </Link>
                    <button className="suggestion-btn" onClick={() => handleFollowUser(u.id)} disabled={followingProgress[u.id]} style={{ opacity: followingProgress[u.id] ? 0.7 : 1 }}>
                      {followingProgress[u.id] ? <div className="btn-spinner"></div> : "Follow"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALL & POSTS: following someone but nothing to show */}
          {(feedType === 'All' || feedType === 'Posts') && posts.length === 0 && suggestedUsers.length === 0 && (
            <p style={{ color: "var(--ink-muted)", fontStyle: "italic", fontSize: "0.9rem", textAlign: "center", padding: "20px" }}>
              No posts yet from people you follow.
            </p>
          )}

          {/* PROJECTS empty state */}
          {feedType === 'Projects' && posts.length === 0 && !globalMode && (
            <div className="empty-feed-card">
              <div className="empty-feed-title">No projects yet</div>
              <div className="empty-feed-subtitle">Follow people and projects to see them here</div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <a href="/project-hub" style={{ padding: '8px 20px', background: 'var(--accent)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>Browse Projects</a>
              </div>
            </div>
          )}

          {/* GLOBAL empty states */}
          {posts.length === 0 && globalMode && (
            <p style={{ color: "var(--ink-muted)", fontStyle: "italic", fontSize: "0.9rem", textAlign: "center", padding: "20px" }}>
              No content found in the community yet.
            </p>
          )}

          {posts.map((item) => (
            item.type === 'project' ? (
              <ProjectFeedCard key={`proj-${item.id}`} project={item} />
            ) : (
              <PostCard
                key={`post-${item.id}`}
                post={item}
                onDelete={() => handleDeletePost(item.id)}
              />
            )
          ))}
        </div>
          {hasMore && <div ref={sentinelRef} style={{ height: "40px" }} />}
        </>
      )}
    </div>
  );
}