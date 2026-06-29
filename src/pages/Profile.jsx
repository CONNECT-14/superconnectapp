import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import SkeletonLoader from "../components/SkeletonLoader";
import BackgroundParticles from "../components/BackgroundParticles";
import FollowModals from "../components/FollowModals";

const styles = `
  :root {
    --bg: #0F0F11;
    --surface: #1A1A1F;
    --border: #2A2A2F;
    --ink: #F4F4F5;
    --ink-muted: #A1A1AA;
    --accent: #7C3AED;
    --accent-hover: #6D28D9;
    --shadow: 0 4px 12px rgba(0,0,0,0.2);
    --radius: 12px;
    --transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .profile-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'Inter', sans-serif;
    color: var(--ink);
    padding: 80px 24px 80px;
  }

  .profile-inner {
    max-width: 760px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    background: #0F0F1180;
  }
  
  .profile-inner::before, .profile-inner::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 80px;
    pointer-events: none;
    z-index: -1;
  }
  
  .profile-inner::before {
    left: 0;
    background: linear-gradient(to right, #0F0F11, transparent);
  }
  
  .profile-inner::after {
    right: 0;
    background: linear-gradient(to left, #0F0F11, transparent);
  }

  .profile-header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 48px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }

  .profile-header h2 {
    font-family: 'Inter', sans-serif;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1;
    color: var(--ink);
  }

  .profile-header .dot {
    display: none;
  }

  .section-label {
    font-size: 15px;
    font-weight: bold;
    color: white;
    text-transform: uppercase;
    margin-bottom: 16px;
    border-left: 3px solid #7C3AED;
    padding-left: 8px;
  }

  .create-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px;
    margin-bottom: 48px;
    box-shadow: var(--shadow);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .form-field {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 16px;
    font-family: 'Inter', sans-serif;
    color: var(--ink);
    font-size: 0.95rem;
    transition: border-color var(--transition);
    outline: none;
  }
  
  .form-field:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
  }
  
  .form-field::placeholder {
    color: var(--ink-muted);
  }

  .btn-create {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    cursor: pointer;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    transition: background var(--transition);
  }

  .btn-create:hover { background: var(--accent-hover); }

  .projects-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .project-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    cursor: pointer;
    position: relative;
    transition: transform var(--transition), border-color var(--transition);
  }
  
  .project-card:hover { 
    transform: translateY(-2px); 
    border-color: var(--accent);
  }
  
  .delete-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 0.8rem;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    cursor: pointer;
    z-index: 10;
    transition: all var(--transition);
  }

  .delete-btn:hover { 
    background: #EF4444; 
    color: white; 
  }

  /* Project delete button: hover-only */
  .project-delete-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 0.8rem;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    cursor: pointer;
    z-index: 10;
    opacity: 0;
    transition: all 0.2s ease;
  }
  .project-card:hover .project-delete-btn {
    opacity: 1;
  }
  .project-delete-btn:hover {
    background: #EF4444;
    color: white;
  }

  /* ── My Posts Section ── */
  .my-posts-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .my-post-card {
    background: #1A1A1F;
    border: 1px solid #2A2A2F;
    border-radius: 12px;
    padding: 16px;
    position: relative;
    transition: border-color var(--transition);
  }

  .my-post-card:hover {
    border-color: var(--accent);
  }

  .my-post-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .my-post-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .my-post-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .my-post-username {
    font-weight: 600;
    font-size: 1rem;
    color: #F4F4F5;
  }

  .my-post-content {
    margin-top: 12px;
    font-size: 0.95rem;
    line-height: 1.6;
    color: #A1A1AA;
  }

  .my-post-tags {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    flex-wrap: wrap;
  }

  .my-post-tag {
    background: rgba(124, 58, 237, 0.12);
    padding: 4px 10px;
    font-size: 0.75rem;
    border-radius: 20px;
    color: #A855F7;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .my-post-image {
    width: 100%;
    max-height: 400px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid var(--border);
    margin-top: 12px;
  }

  .my-post-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 12px;
  }

  .my-post-like {
    background: #0F0F11;
    border: 1px solid var(--border);
    padding: 6px 14px;
    border-radius: 20px;
    color: var(--ink);
    font-size: 0.85rem;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    cursor: default;
  }

  .my-post-comments-btn {
    background: none;
    border: none;
    color: #A1A1AA;
    font-size: 13px;
    cursor: pointer;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: 'Inter', sans-serif;
    padding: 0;
    transition: color 0.2s ease;
  }

  .my-post-comments-btn:hover {
    color: #7C3AED;
  }

  .post-delete-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    border: 1px solid #ef4444;
    color: #ef4444;
    background: transparent;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 10;
  }
  .my-post-card:hover .post-delete-btn {
    opacity: 1;
  }
  .post-delete-btn:hover {
    background: #ef4444;
    color: white;
  }

  .my-post-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--ink-muted);
  }

  .my-post-empty p {
    font-size: 0.95rem;
    margin-bottom: 16px;
  }

  .btn-go-dashboard {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    transition: background var(--transition);
  }

  .btn-go-dashboard:hover {
    background: var(--accent-hover);
  }

  /* Comments section within my-post-card */
  .my-post-comments-container {
    max-height: 140px;
    overflow-y: auto;
    background: #0F0F11;
    padding: 12px 16px;
    border-radius: 8px;
    margin-top: 12px;
    border: 1px solid var(--border);
  }

  .my-post-comment-item {
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
    font-size: 0.9rem;
    line-height: 1.4;
    color: #A1A1AA;
  }

  .my-post-comment-item:last-child {
    border-bottom: none;
  }

  .my-post-comment-user {
    font-weight: 600;
    color: #A855F7;
    margin-right: 4px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .my-post-comment-box {
    display: flex;
    margin-top: 12px;
    gap: 8px;
  }

  .my-post-comment-box input {
    flex: 1;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: #0F0F11;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    color: #F4F4F5;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .my-post-comment-box input:focus {
    border-color: #7C3AED;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
  }

  .my-post-comment-box button {
    padding: 0 16px;
    background: #7C3AED;
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
    font-family: 'Inter', sans-serif;
  }

  .my-post-comment-box button:hover {
    background: #6D28D9;
  }

  .my-post-comments-container::-webkit-scrollbar {
    width: 4px;
  }
  .my-post-comments-container::-webkit-scrollbar-thumb {
    background: #2A2A2F;
    border-radius: 10px;
  }

  .file-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--ink-muted);
    cursor: pointer;
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px dashed var(--border);
    transition: all var(--transition);
    align-self: flex-start;
  }
  .file-label:hover { border-color: var(--accent); color: var(--accent); background: rgba(124, 58, 237, 0.05); }
  .file-input-hidden { display: none; }
  .cover-preview {
    width: 100%;
    max-width: 320px;
    height: 160px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid var(--border);
    margin-top: 12px;
  }
  .preview-wrap { position: relative; display: inline-block; }
  .remove-preview {
    position: absolute; top: 12px; right: 0;
    background: #EF4444; color: white;
    border: none; width: 24px; height: 24px;
    border-radius: 50%; cursor: pointer;
    font-size: 10px; display: flex; align-items: center; justify-content: center;
  }
  .project-list-img {
    width: 100%;
    height: 180px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid var(--border);
  }
  .project-tag {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
  .tag-idea { background: rgba(59, 130, 246, 0.15); color: #60A5FA; }
  .tag-in-progress { background: rgba(16, 185, 129, 0.15); color: #10B981; }
  .tag-live { background: rgba(245, 158, 11, 0.15); color: #FBBF24; }

  /* ── User Profile Area ── */
  .profile-info-section {
    margin-bottom: 48px;
  }
  .profile-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .profile-banner {
    position: relative;
    height: 100px;
    background: linear-gradient(135deg, #1A1A1F, #2D1B69);
    width: 100%;
    background-size: cover;
    background-position: center;
  }
  .banner-edit-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0,0,0,0.5);
    border: none;
    color: white;
    padding: 6px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .profile-banner:hover .banner-edit-btn {
    opacity: 1;
  }
  .banner-edit-btn:hover {
    background: rgba(0,0,0,0.7);
  }
  .avatar-wrapper {
    position: relative;
    width: 88px;
    height: 88px;
    border-radius: 50%;
    margin-top: -40px;
    margin-left: 24px;
    border: 3px solid #0F0F11;
    cursor: pointer;
    overflow: hidden;
    flex-shrink: 0;
  }
  .avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    color: white;
    font-size: 14px;
  }
  .avatar-wrapper:hover .avatar-overlay {
    opacity: 1;
  }
  .profile-avatar {
    width: 100%;
    height: 100%;
    background: var(--accent);
    color: white;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .profile-details {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .profile-details h3 {
    font-family: 'Inter', sans-serif;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 2px;
  }
  .profile-email {
    font-size: 1rem;
    color: var(--ink-muted);
  }
  .profile-meta {
    font-size: 0.95rem;
    color: var(--ink-muted);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ── Skill Tags ── */
  .skill-tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  .skill-tag {
    background: rgba(124, 58, 237, 0.125);
    border: 1px solid #7C3AED;
    color: #A78BFA;
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 13px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .skill-tag-remove {
    background: transparent;
    border: none;
    color: #A78BFA;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 0;
    display: flex;
    align-items: center;
  }
  .skill-tag-remove:hover { color: #EF4444; }
  .skill-input-row {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .skill-input-row input {
    flex: 1;
  }
  .btn-add-skill {
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .btn-add-skill:hover { background: var(--accent-hover); }
  .skill-limit-text {
    font-size: 12px;
    color: var(--ink-muted);
    margin-top: 4px;
  }

  @media (max-width: 768px) {
    .profile-banner {
      height: 80px;
    }
    .avatar-wrapper {
      width: 60px;
      height: 60px;
      margin-top: -30px;
      margin-left: 16px;
      border-width: 2px;
    }
    .profile-avatar {
      font-size: 24px;
    }
    .profile-header {
      margin-bottom: 32px;
    }
    .profile-header h2 {
      font-size: 24px;
    }
    .profile-stats {
      gap: 12px !important;
    }
    .profile-stats span {
      font-size: 14px !important;
    }
    .profile-stats span:first-child {
      font-size: 16px !important;
    }
    .create-section {
      padding: 16px;
    }
  }
`;

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editOccupation, setEditOccupation] = useState("");
  const [editSkills, setEditSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("idea");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [modalType, setModalType] = useState(null);

  // My Posts state
  const [myPosts, setMyPosts] = useState([]);
  const [postsCount, setPostsCount] = useState(0);
  const [postComments, setPostComments] = useState({});
  const [postLikes, setPostLikes] = useState({});
  const [showPostComments, setShowPostComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUser = async () => {
    const start = Date.now();
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      const user = session?.user;
      
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profile) {
          setProfileData(profile);
          setEditName(profile.name || "");
          setEditAge(profile.age || "");
          setEditOccupation(profile.occupation || "");
          setEditSkills(profile.skills || []);
        }
        
        await fetchProjects(user.id);
        await fetchMyPosts(user.id);
        await fetchFollowStats(user.id);
      }
    } catch (err) {
      console.error("Error fetching user:", err.message);
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
      setLoading(false);
    }
  };

  const fetchProjects = async (userId) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching projects:", error.message);
    else setProjects(data || []);
  };

  const fetchMyPosts = async (userId) => {
    const { data, error } = await supabase
      .from("posts")
      .select(`*, profiles(name, avatar_url)`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error.message);
      return;
    }

    // Parse content for category/topic like Feed does
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
    setPostsCount(parsed.length);

    // Fetch like counts for each post
    const likesMap = {};
    for (const post of parsed) {
      const { data: likes } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", post.id);
      likesMap[post.id] = likes?.length || 0;
    }
    setPostLikes(likesMap);
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
      setPostsCount(prev => prev - 1);
    }
  };

  const fetchPostComments = async (postId) => {
    const { data } = await supabase
      .from("comments")
      .select(`*, profiles(name, avatar_url)`)
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
    const { error } = await supabase.from("comments").insert([{
      user_id: user.id,
      post_id: postId,
      content: commentInputs[postId],
    }]);
    if (!error) {
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      await fetchPostComments(postId);
    }
  };

  const fetchFollowStats = async (userId) => {
    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);

    let avatarUrl = profileData?.avatar_url || null;

    if (avatarFile) {
      const fileName = `avatar-${Date.now()}-${avatarFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile);

      if (uploadError) {
        alert("Avatar upload failed: " + uploadError.message);
        setSavingProfile(false);
        return;
      }
      
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      avatarUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: editName,
        age: editAge ? parseInt(editAge) : null,
        occupation: editOccupation,
        avatar_url: avatarUrl,
        skills: editSkills
      })
      .eq("id", user.id);

    if (error) {
      alert("Error saving profile: " + error.message);
    } else {
      setProfileData({ ...profileData, name: editName, age: editAge, occupation: editOccupation, avatar_url: avatarUrl, skills: editSkills });
      setIsEditingProfile(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    }
    setSavingProfile(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleDirectBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setIsUploadingBanner(true);
    
    const fileName = `banner-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);

    if (uploadError) {
      alert("Banner upload failed: " + uploadError.message);
      setIsUploadingBanner(false);
      return;
    }
    
    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const bannerUrl = data.publicUrl;
    
    const { error } = await supabase.from("profiles").update({ banner_url: bannerUrl }).eq("id", user.id);
    if (error) alert("Error saving banner: " + error.message);
    else setProfileData(prev => ({ ...prev, banner_url: bannerUrl }));
    
    setIsUploadingBanner(false);
  };

  const handleDirectAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setIsUploadingAvatar(true);
    
    const fileName = `avatar-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);

    if (uploadError) {
      alert("Avatar upload failed: " + uploadError.message);
      setIsUploadingAvatar(false);
      return;
    }
    
    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const avatarUrl = data.publicUrl;
    
    const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
    if (error) alert("Error saving avatar: " + error.message);
    else {
      setProfileData(prev => ({ ...prev, avatar_url: avatarUrl }));
      setAvatarPreview(null);
      setAvatarFile(null);
    }
    
    setIsUploadingAvatar(false);
  };

  const createProject = async () => {
    if (!user) return alert("You must be logged in");
    if (!title.trim()) return alert("Enter project title");

    setUploading(true);
    let imageUrl = null;

    if (image) {
      const fileName = `covers-${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(fileName, image);

      if (uploadError) {
        alert("Image upload failed: " + uploadError.message);
        setUploading(false);
        return;
      }
      
      const { data } = supabase.storage
        .from("project-images")
        .getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const { data, error } = await supabase
      .from("projects")
      .insert([{ user_id: user.id, title, description, image_url: imageUrl, status }])
      .select(); // returns the created object

    if (error) {
      alert(error.message);
    } else {
      setProjects([data[0], ...projects]); // Update UI immediately
      setTitle("");
      setDescription("");
      setStatus("idea");
      setImage(null);
      setImagePreview(null);
    }
    setUploading(false);
  };

  const deleteProject = async (projectId) => {
    const confirmDelete = window.confirm(
      "Delete this project?\nThis action cannot be undone."
    );
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id); // Extra safety layer

    if (error) {
      alert("Could not delete: " + error.message);
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  };

  if (loading) return (
    <div className="profile-root">
      <BackgroundParticles variant="split" />
      <div className="profile-inner">
        <SkeletonLoader type="profile" />
      </div>
    </div>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="profile-root">
        <BackgroundParticles variant="split" />
        <div className="profile-inner">
          <div className="profile-header">
            <h2>My Profile</h2>
            <div className="dot" />
          </div>

          {/* USER PROFILE SECTION */}
          <div className="profile-info-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p className="section-label" style={{ marginBottom: 0 }}>User Info</p>
              {!isEditingProfile && (
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Edit Profile
                </button>
              )}
            </div>
            
            <div className="profile-card">
               <div className="profile-banner" style={profileData?.banner_url ? { backgroundImage: `url(${profileData.banner_url})` } : {}}>
                 <label className="banner-edit-btn">
                   <span>📷 {isUploadingBanner ? '...' : ''}</span>
                   <input type="file" accept="image/*" className="file-input-hidden" onChange={handleDirectBannerUpload} disabled={isUploadingBanner} />
                 </label>
               </div>
               
               <div className="avatar-wrapper">
                 <div className="profile-avatar">
                   {(avatarPreview || profileData?.avatar_url) ? (
                     <img src={avatarPreview || profileData?.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   ) : (
                     profileData?.name ? profileData.name.charAt(0).toUpperCase() : "U"
                   )}
                 </div>
                 <label className="avatar-overlay">
                   <span>📷 {isUploadingAvatar ? '...' : ''}</span>
                   <input type="file" accept="image/*" className="file-input-hidden" onChange={handleDirectAvatarUpload} disabled={isUploadingAvatar} />
                 </label>
               </div>
               
               {isEditingProfile ? (
                 <div className="profile-details" style={{ flex: 1, padding: '16px 24px 24px 24px' }}>
                   <label className="file-label" style={{ marginBottom: '12px', alignSelf: 'flex-start' }}>
                     + Change Avatar
                     <input type="file" accept="image/*" className="file-input-hidden" onChange={handleAvatarChange} />
                   </label>
                   <input className="form-field" placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ marginBottom: '8px' }} />
                   <input className="form-field" type="number" placeholder="Age" value={editAge} onChange={(e) => setEditAge(e.target.value)} style={{ marginBottom: '8px' }} />
                   <input className="form-field" placeholder="Occupation" value={editOccupation} onChange={(e) => setEditOccupation(e.target.value)} style={{ marginBottom: '8px' }} />
                    
                    {/* Skill Tags Editor */}
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
                     <button className="btn-create" onClick={handleSaveProfile} disabled={savingProfile}>
                       {savingProfile ? "Saving..." : "Save"}
                     </button>
                     <button onClick={() => setIsEditingProfile(false)} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '11px 22px', borderRadius: '7px', cursor: 'pointer', color: 'var(--ink)' }}>
                       Cancel
                     </button>
                   </div>
                 </div>
               ) : (
                 <div className="profile-details" style={{ padding: '16px 24px 24px 24px' }}>
                   <h3>{profileData?.name || "User"}</h3>
                   <p className="profile-email">{profileData?.email}</p>
                   {profileData?.occupation && <p className="profile-meta">💼 {profileData.occupation}</p>}
                   {profileData?.age && <p className="profile-meta">🎂 {profileData.age} years old</p>}
                    
                    {/* Skill Tags Display */}
                    {profileData?.skills?.length > 0 && (
                      <div className="skill-tags-container">
                        {profileData.skills.map((skill, i) => (
                          <span key={i} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    )}
                    
                   <div className="profile-stats" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setModalType('followers')}>
                       <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{followersCount}</span>
                       <span style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px' }}>Followers</span>
                     </div>
                     <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setModalType('following')}>
                       <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{followingCount}</span>
                       <span style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px' }}>Following</span>
                     </div>
                     <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                       <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{projects.length}</span>
                       <span style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px' }}>Projects</span>
                     </div>
                     <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                       <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{postsCount}</span>
                       <span style={{ color: '#A1A1AA', fontSize: '13px', marginTop: '4px' }}>Posts</span>
                     </div>
                   </div>
                 </div>
               )}
            </div>
          </div>

          {/* CREATE SECTION */}
          <div className="create-section">
            <p className="section-label">New Project</p>
            <div className="form-group">
              <input
                className="form-field"
                placeholder="Project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="form-field"
                placeholder="Description"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              
              <select
                className="form-field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="idea">Concept / Idea</option>
                <option value="in progress">In Progress</option>
                <option value="live">Live</option>
              </select>

              <label className="file-label">
                + Add Project Cover Image
                <input
                  type="file"
                  accept="image/*"
                  className="file-input-hidden"
                  onChange={handleImageChange}
                />
              </label>

              {imagePreview && (
                <div className="preview-wrap">
                  <img src={imagePreview} className="cover-preview" alt="preview" />
                  <button className="remove-preview" onClick={() => { setImage(null); setImagePreview(null); }}>✕</button>
                </div>
              )}
            </div>
            <button className="btn-create" onClick={createProject} disabled={uploading}>
              {uploading ? "Creating..." : "Create Project"}
            </button>
          </div>

          {/* PROJECTS LIST */}
          <div>
            <p className="section-label">My Projects ({projects.length})</p>
            <div className="projects-list">
              {projects.length === 0 ? (
                <p style={{ color: "var(--ink-muted)" }}>No projects yet.</p>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="project-card"
                    onClick={() => navigate(`/project/${proj.id}`)}
                  >
                    <button
                      className="project-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(proj.id);
                      }}
                    >
                      Delete
                    </button>
                    {proj.image_url && (
                      <img src={proj.image_url} alt="cover" className="project-list-img" />
                    )}
                    <div>
                      <span className={`project-tag tag-${(proj.status || 'idea').replace(' ', '-')}`}>
                        {proj.status || 'idea'}
                      </span>
                    </div>
                    <h4>{proj.title}</h4>
                    {proj.description && (
                      <p style={{ fontSize: "0.9rem", marginTop: "8px", color: "var(--ink-muted)" }}>
                        {proj.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MY POSTS SECTION */}
          <div style={{ marginTop: '48px' }}>
            <p className="section-label">My Posts ({postsCount})</p>
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
                        <span className="my-post-username">{profileData?.name || "User"}</span>
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
                            <button onClick={() => handlePostComment(post.id)}>Post</button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      <FollowModals 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)} 
        type={modalType} 
        userId={user?.id} 
      />
    </>
  );
}