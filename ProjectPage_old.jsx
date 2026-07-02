import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient";
import SkeletonLoader from "../components/SkeletonLoader";
import BackgroundParticles from "../components/BackgroundParticles";
import PostCollabModal from "../components/PostCollabModal";
import { useDebounce } from "../hooks/useDebounce";
import imageCompression from 'browser-image-compression';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  /* Global CSS variables inherited from index.css for Light/Dark mode */

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pp-root {
    --radius: 16px;
    --shadow: 0 4px 24px rgba(0,0,0,0.08);
    --transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
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

  /* ΓöÇΓöÇ Banner ΓöÇΓöÇ */
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

  /* ΓöÇΓöÇ Header row: title + track button ΓöÇΓöÇ */
  .pp-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: var(--bg-card);
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    gap: 16px;
  }
  
  .pp-header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pp-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #EF4444;
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 5px;
    border-radius: 10px;
    line-height: 1;
    border: 2px solid var(--bg-card);
  }

  .pp-project-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
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
  
  .btn-settings {
    flex-shrink: 0;
    padding: 9px;
    border-radius: 8px;
    cursor: pointer;
    transition: all var(--transition);
    border: 1px solid var(--border);
    background: var(--bg-card);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-settings:hover {
    border-color: var(--text-secondary);
    color: var(--text-primary);
  }

  /* ΓöÇΓöÇ Meta row ΓöÇΓöÇ */
  .pp-meta-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 24px;
    background: var(--bg-card);
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

  /* ΓöÇΓöÇ Description ΓöÇΓöÇ */
  .pp-description {
    padding: 0 24px 18px;
    background: var(--bg-card);
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.65;
  }

  /* ΓöÇΓöÇ Bottom border for header block ΓöÇΓöÇ */
  .pp-header-bottom {
    height: 1px;
    background: var(--border);
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    border-radius: 0 0 12px 12px;
  }
  
  .pp-access-info {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 24px 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  
  .pp-access-info svg {
    opacity: 0.7;
  }

  /* ΓöÇΓöÇ Section label ΓöÇΓöÇ */
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

  /* ΓöÇΓöÇ Community card ΓöÇΓöÇ */
  .pp-community-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow);
  }

  /* ΓöÇΓöÇ Posts feed ΓöÇΓöÇ */
  .pp-feed {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ΓöÇΓöÇ Post item ΓöÇΓöÇ */
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
    background: var(--bg-app);
  }

  .pp-post + .pp-post {
    border-top: 1px solid var(--border);
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
    color: var(--text-primary);
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



  /* ΓöÇΓöÇ Empty feed ΓöÇΓöÇ */
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
  
  .pp-restricted {
    padding: 60px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: var(--text-secondary);
  }
  
  .pp-restricted svg {
    width: 48px;
    height: 48px;
    opacity: 0.5;
    margin-bottom: 8px;
  }

  /* ΓöÇΓöÇ Composer ΓöÇΓöÇ */
  .pp-composer {
    border-top: 1px solid var(--border);
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--bg-card);
  }
  
  .pp-composer-restricted {
    border-top: 1px solid var(--border);
    padding: 24px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #16161C;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .pp-composer-main {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg-app);
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
    color: var(--text-secondary);
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
  
  .btn-request {
    background: transparent;
    color: var(--accent);
    border: 1px solid var(--accent);
    padding: 8px 16px;
    border-radius: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
  }
  .btn-request:hover:not(:disabled) {
    background: rgba(124, 58, 237, 0.1);
  }
  .btn-request:disabled {
    border-color: var(--border);
    color: var(--text-secondary);
    cursor: not-allowed;
  }

  /* ΓöÇΓöÇ Attach row ΓöÇΓöÇ */
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
    color: var(--text-primary);
    border-color: var(--accent);
    background: rgba(124, 58, 237, 0.1);
  }

  .pp-file-label svg { width: 14px; height: 14px; flex-shrink: 0; }
  .pp-file-hidden { display: none; }

  /* ΓöÇΓöÇ Image preview ΓöÇΓöÇ */
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

  /* ΓöÇΓöÇ Loading ΓöÇΓöÇ */
  .pp-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    font-size: 1rem;
    color: var(--text-secondary);
    letter-spacing: 0.04em;
  }

  /* ΓöÇΓöÇ Posting state ΓöÇΓöÇ */
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
  
  /* ΓöÇΓöÇ Settings Modal ΓöÇΓöÇ */
  .pp-modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    backdrop-filter: blur(4px);
  }
  .pp-modal {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  }
  .pp-modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .pp-modal-header h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
  }
  .pp-modal-close {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 1.5rem;
    line-height: 1;
  }
  .pp-modal-close:hover {
    color: #fff;
  }
  .pp-modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .pp-settings-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .pp-settings-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .pp-settings-help {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 2px;
  }
  .pp-settings-select {
    background: #0F0F13;
    border: 1px solid var(--border);
    color: var(--text-primary);
    padding: 10px 12px;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.95rem;
    outline: none;
  }
  .pp-settings-select:focus {
    border-color: var(--accent);
  }
  
  .pp-member-search {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  .pp-member-search input {
    flex: 1;
    background: #0F0F13;
    border: 1px solid var(--border);
    color: var(--text-primary);
    padding: 8px 12px;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.9rem;
    outline: none;
  }
  .pp-member-search button {
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text-primary);
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }
  .pp-member-search button:hover {
    background: #2A2A2F;
  }
  
  .pp-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
  }
  .pp-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #0F0F13;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .pp-list-item-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pp-list-item-info img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
  }
  .pp-list-item-actions {
    display: flex;
    gap: 6px;
  }
  .pp-list-item-actions button {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    cursor: pointer;
  }
  .pp-list-item-actions button:hover {
    color: var(--text-primary);
    border-color: var(--text-secondary);
  }
  .pp-list-item-actions .btn-approve:hover {
    color: #10B981;
    border-color: #10B981;
  }
  .pp-list-item-actions .btn-reject:hover {
    color: #EF4444;
    border-color: #EF4444;
  }
`;

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const sentinelRef = useRef(null);

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
  }, [id]);


  const [msgText, setMsgText] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Access state
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); // 'pending', 'approved', 'rejected'
  const [pendingCount, setPendingCount] = useState(0);
  
  const [isPosting, setIsPosting] = useState(false);

  // Settings Modal state
  const [showSettings, setShowSettings] = useState(false);
  const [viewAccess, setViewAccess] = useState('all');
  const [postAccess, setPostAccess] = useState('all');
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const runSearch = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, username')
        .ilike('name', `%${debouncedSearch}%`)
        .limit(5);
      if (!error) setSearchResults(data || []);
    };
    runSearch();
  }, [debouncedSearch]);

  // Edit Project state
  const [showEditProject, setShowEditProject] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("idea");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUpdatingRequest, setIsUpdatingRequest] = useState({});

  const fileInputRef = useRef(null);

  // Collab state
  const [showPostCollabModal, setShowPostCollabModal] = useState(false);
  const [collabToast, setCollabToast] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { init(); }, [id]);

  const init = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // userProfile was unused, removed fetch
      }

      await fetchProject(currentUser);
      // Posts fetch moved to a useEffect that depends on project load and access checks
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProject = async (currentUser) => {
    const { data } = await supabase
      .from("projects")
      .select("*, profiles(name, avatar_url, username)")
      .eq("id", id)
      .single();
      
    if (data) {
      setProject(data);
      setViewAccess(data.view_access || 'all');
      setPostAccess(data.post_access || 'all');
    }

    if (currentUser && data) {
      // Check tracker status
      const { data: followData } = await supabase
        .from("project_followers")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", currentUser.id)
        .single();
      if (followData) setIsFollowing(true);
      
      // Check member status
      const { data: memberData } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", currentUser.id)
        .single();
      if (memberData) setIsMember(true);
      
      // Check request status - fetch the most recent request for this user
      const { data: requestData } = await supabase
        .from("project_access_requests")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (requestData && requestData.length > 0) {
        if (requestData[0].status === 'pending') {
          setRequestStatus('pending');
        } else {
          setRequestStatus(null); // allow requesting again if approved but not member, or rejected
        }
      }
      
      if (currentUser.id === data.user_id) {
        const { count } = await supabase
          .from("project_access_requests")
          .select("*", { count: 'exact', head: true })
          .eq("project_id", id)
          .eq("status", "pending");
        setPendingCount(count || 0);
      }
    }
  };
  
  const isCreator = user && project && user.id === project.user_id;

  const checkAccess = (accessLevel) => {
    if (!project) return false;
    if (isCreator) return true;
    if (accessLevel === 'all') return true;
    if (accessLevel === 'members') return isMember;
    if (accessLevel === 'trackers') return isMember || isFollowing;
    return false;
  };

  const canView = checkAccess(project?.view_access || 'all');
  const canPost = checkAccess(project?.post_access || 'all');
  
  const showRequestJoin = user && !isCreator && !isMember && (project?.view_access === 'members' || project?.post_access === 'members');

  // Refetch posts when access logic changes
  useEffect(() => {
    if (project) {
       if (canView) {
         fetchPosts();
       } else {
         setPosts([]);
       }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, isFollowing, isMember]);

  const handleRequestAccess = async () => {
    if (!user) return;
    setIsRequestingAccess(true);
    try {
      const { error } = await supabase.from('project_access_requests').insert({
        project_id: id,
        user_id: user.id,
        status: 'pending'
      });
      if (!error) {
        setRequestStatus('pending');
        // Fetch the user's name for the notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        // Add notification for creator
        await supabase.from('notifications').insert({
          user_id: project.user_id,
          from_user_id: user.id,
          type: 'access_request',
          project_id: id,
          message: `${profile?.name || 'A user'} requested member access to your project ${project.title}`
        });
      }
    } catch (err) {
      console.error(err);
    }
    setIsRequestingAccess(false);
  };

  const toggleFollow = async () => {
    if (!user) return;
    setIsTogglingFollow(true);
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
    setIsTogglingFollow(false);
  };

  const fetchPosts = useCallback(async (isInitial = true) => {
    setIsLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles(name, avatar_url, username)")
        .eq("project_id", id)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (!error && data) {
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
          .eq("project_id", id)
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
      console.error(err);
    }
    setIsLoadingPosts(false);
  }, [id, page]);

  useEffect(() => {
    if (id) fetchPosts(page === 0);
  }, [page, id, fetchPosts]);

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
  
  // Settings Logic
  const openSettings = async () => {
    setShowSettings(true);
    fetchSettingsData();
  };
  
  const fetchSettingsData = async () => {
    // Fetch members
    const { data: memData, error: memError } = await supabase
      .from('project_members')
      .select('*, profiles!project_members_user_id_fkey(name, avatar_url)')
      .eq('project_id', id);
    if (memError) console.error("Error fetching members:", memError);
    setMembers(memData || []);
    
    // Fetch pending requests
    const { data: reqData } = await supabase
      .from('project_access_requests')
      .select('*, profiles(name, avatar_url)')
      .eq('project_id', id)
      .eq('status', 'pending');
    setPendingRequests(reqData || []);
    setPendingCount((reqData || []).length);
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    await supabase.from('projects').update({
      view_access: viewAccess,
      post_access: postAccess
    }).eq('id', id);
    
    setProject({ ...project, view_access: viewAccess, post_access: postAccess });
    setShowSettings(false);
    setIsSavingSettings(false);
  };
  
  const openEditProject = () => {
    setEditTitle(project.title || "");
    setEditDesc(project.description || "");
    setEditStatus(project.status || "idea");
    setEditImagePreview(project.image_url || null);
    setEditImageFile(null);
    setShowEditProject(true);
  };
  
  const saveProject = async () => {
    setIsSavingProject(true);
    let imageUrl = project.image_url;
    
    if (editImageFile) {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
      let finalFile = editImageFile;
      try { finalFile = await imageCompression(editImageFile, options); } catch(e) { console.error(e); }

      const fileName = `covers-${Date.now()}-${finalFile.name}`;
      const { error: uploadError } = await supabase.storage.from("project-images").upload(fileName, finalFile);
      if (!uploadError) {
        const { data } = supabase.storage.from("project-images").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }
    
    const { error } = await supabase.from("projects").update({
      title: editTitle,
      description: editDesc,
      status: editStatus,
      image_url: imageUrl
    }).eq("id", id);
    
    if (!error) {
      setProject({ ...project, title: editTitle, description: editDesc, status: editStatus, image_url: imageUrl });
      setShowEditProject(false);
    } else {
      console.error("Error saving project:", error);
    }
    setIsSavingProject(false);
  };
  
  const addMember = async (userId) => {
    const { error } = await supabase.from('project_members').insert({
      project_id: id,
      user_id: userId,
      added_by: user.id
    });
    
    if (error) {
      console.error("Error adding member:", error);
    } else {
      await fetchSettingsData();
      setSearchResults([]);
      setSearchQuery('');
    }
  };
  
  const removeMember = async (userId) => {
    const { error } = await supabase.from('project_members').delete().eq('project_id', id).eq('user_id', userId);
    if (error) {
      console.error("Error removing member:", error);
    } else {
      await fetchSettingsData();
    }
  };
  
  const updateRequest = async (requestId, userId, newStatus) => {
    setIsUpdatingRequest(prev => ({ ...prev, [requestId]: newStatus }));
    const { error: updateError } = await supabase.from('project_access_requests').update({ status: newStatus }).eq('id', requestId);
    if (updateError) {
      console.error("Error updating request:", updateError);
      setIsUpdatingRequest(prev => ({ ...prev, [requestId]: null }));
      return;
    }
    
    if (newStatus === 'approved') {
      const { error: insertError } = await supabase.from('project_members').insert({
        project_id: id,
        user_id: userId,
        added_by: user.id
      });
      if (insertError) {
        console.error("Error adding approved member:", insertError);
      } else {
        await supabase.from('notifications').insert({
          user_id: userId,
          from_user_id: user.id,
          type: 'access_approved',
          project_id: id,
          message: `Your request to join ${project.title} was approved!`
        });
      }
    }
    await fetchSettingsData();
    setIsUpdatingRequest(prev => ({ ...prev, [requestId]: null }));
  };

  return (
    <>
      <style>{styles}</style>
      <div className="pp-root">
        <BackgroundParticles variant="split" />

        {project ? (
          <div className="pp-page">

            {/* ΓöÇΓöÇ 1. Banner ΓöÇΓöÇ */}
            <div className="pp-banner">
              {project.image_url ? (
                <img src={project.image_url} alt={`${project.title} banner`} />
              ) : (
                <div className="pp-banner-placeholder" />
              )}
            </div>

            {/* ΓöÇΓöÇ 2. Header row: title + track button ΓöÇΓöÇ */}
            <div className="pp-header-row">
              <h1 className="pp-project-title">{project.title}</h1>
              <div className="pp-header-actions">
                {project.user_id !== user?.id && (
                  <button
                    className={`btn-track ${isFollowing ? "tracking" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
                    disabled={isTogglingFollow}
                    style={{ opacity: isTogglingFollow ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isTogglingFollow ? <div className="btn-spinner" style={{ borderColor: isFollowing ? "rgba(255,255,255,0.3)" : "var(--border)", borderTopColor: isFollowing ? "white" : "var(--text-primary)" }}></div> : isFollowing ? "Γ£ô Tracking" : "Track"}
                  </button>
                )}
                {isCreator && (
                  <>
                    <button
                      onClick={() => setShowPostCollabModal(true)}
                      title="Post Collab Request"
                      style={{
                        background: 'rgba(124,58,237,0.12)',
                        border: '1px solid rgba(168,85,247,0.3)',
                        color: '#A855F7',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif",
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'background 0.2s'
                      }}
                    >
                      ≡ƒñ¥ Post Collab
                    </button>
                    <button className="btn-settings" onClick={openEditProject} title="Edit Project">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
                    <button className="btn-settings" onClick={openSettings} title="Settings" style={{ position: 'relative' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                      {pendingCount > 0 && <span className="pp-badge">{pendingCount}</span>}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ΓöÇΓöÇ 3. Meta row: status + creator + description ΓöÇΓöÇ */}
            <div className="pp-meta-row">
              {project.status && (
                <span className="pp-status-badge">{project.status}</span>
              )}
              <div className="pp-creator" style={{ alignItems: 'center' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontWeight: '600', lineHeight: 1.2 }}>{project.profiles?.name || "Unknown"}</span>
                  {project.profiles?.username && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      @{project.profiles.username}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ΓöÇΓöÇ Description row ΓöÇΓöÇ */}
            {project.description && (
              <div className="pp-description">
                <p style={{ fontSize: '0.9rem', color: '#71717A', lineHeight: 1.65 }}>{project.description}</p>
              </div>
            )}

            {/* ΓöÇΓöÇ 4. Bottom border / divider ΓöÇΓöÇ */}
            <div className="pp-header-bottom" />
            
            {/* ΓöÇΓöÇ Access Info Row ΓöÇΓöÇ */}
            <div className="pp-access-info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Viewing: {project.view_access === 'all' ? 'Everyone' : project.view_access === 'members' ? 'Members Only' : project.view_access === 'trackers' ? 'Trackers Only' : 'Creator Only'} &middot; Posting: {project.post_access === 'all' ? 'Everyone' : project.post_access === 'members' ? 'Members Only' : project.post_access === 'trackers' ? 'Trackers Only' : 'Creator Only'}
            </div>

            {/* ΓöÇΓöÇ 5. COMMUNITY label ΓöÇΓöÇ */}
            <div className="pp-section-label">
              Community {canView && `(${posts.length})`}
            </div>

            {/* ΓöÇΓöÇ 6. Community card ΓöÇΓöÇ */}
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
                      {isRequestingAccess ? <div className="btn-spinner" style={{ borderColor: "rgba(124,58,237,0.3)", borderTopColor: "var(--accent)" }}></div> : requestStatus === 'pending' ? 'Request pending ΓÇö waiting for creator approval' : 'Request to Join'}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* ΓöÇΓöÇ 7. Posts feed ΓöÇΓöÇ */}
                  <div className="pp-feed">
                    {posts.length === 0 ? (
                      <div className="pp-feed-empty">
                        <div className="empty-icon">Γù╗</div>
                        <p>No posts yet ΓÇö be the first to share an update.</p>
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

                  {/* ΓöÇΓöÇ 8. Composer ΓöÇΓöÇ */}
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
                          {isRequestingAccess ? <div className="btn-spinner" style={{ borderColor: "rgba(124,58,237,0.3)", borderTopColor: "var(--accent)" }}></div> : requestStatus === 'pending' ? 'Request pending ΓÇö waiting for creator approval' : 'Request to Join'}
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
                          placeholder={user ? "Share an update or ask a questionΓÇª" : "Sign in to post in this community"}
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
                            <button className="pp-preview-remove" onClick={(e) => { e.stopPropagation(); clearImage(); }}>Γ£ò</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="pp-page">
            <SkeletonLoader type="page" />
          </div>
        )}
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="pp-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="pp-modal" onClick={e => e.stopPropagation()}>
            <div className="pp-modal-header">
              <h2>Project Settings</h2>
              <button className="pp-modal-close" onClick={() => setShowSettings(false)}>&times;</button>
            </div>
            <div className="pp-modal-body">
              
              <div className="pp-settings-group">
                <label>Who can VIEW posts</label>
                <select className="pp-settings-select" value={viewAccess} onChange={e => setViewAccess(e.target.value)}>
                  <option value="creator">Creator Only</option>
                  <option value="members">Members Only</option>
                  <option value="trackers">Trackers Only</option>
                  <option value="all">Everyone</option>
                </select>
                {viewAccess === 'members' && <div className="pp-settings-help">Only approved members can do this ΓÇö others can request access.</div>}
              </div>
              
              <div className="pp-settings-group">
                <label>Who can POST</label>
                <select className="pp-settings-select" value={postAccess} onChange={e => setPostAccess(e.target.value)}>
                  <option value="creator">Creator Only</option>
                  <option value="members">Members Only</option>
                  <option value="trackers">Trackers Only</option>
                  <option value="all">Everyone</option>
                </select>
                {postAccess === 'members' && <div className="pp-settings-help">Only approved members can do this ΓÇö others can request access.</div>}
              </div>
              
              <div className="pp-settings-group">
                <label>Manage Members</label>
                <div className="pp-member-search">
                  <input 
                    placeholder="Search by name..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="pp-list" style={{ marginBottom: 12 }}>
                    {searchResults.map(res => (
                      <div key={res.id} className="pp-list-item">
                        <div className="pp-list-item-info">
                          {res.avatar_url ? <img src={res.avatar_url} alt="" /> : <div style={{width: 24, height: 24, borderRadius: '50%', background: 'var(--border)'}}></div>}
                          <span style={{ fontSize: '0.85rem' }}>{res.name}</span>
                        </div>
                        <div className="pp-list-item-actions">
                          <button onClick={() => addMember(res.id)}>Add as Member</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="pp-list">
                  {members.map(m => (
                    <div key={m.id} className="pp-list-item">
                      <div className="pp-list-item-info">
                        {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} alt="" /> : <div style={{width: 24, height: 24, borderRadius: '50%', background: 'var(--border)'}}></div>}
                        <span style={{ fontSize: '0.85rem' }}>{m.profiles?.name}</span>
                      </div>
                      <div className="pp-list-item-actions">
                        <button onClick={() => removeMember(m.user_id)}>Remove</button>
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)'}}>No members added.</div>}
                </div>
              </div>
              
              <div className="pp-settings-group">
                <label>Pending Requests</label>
                <div className="pp-list">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="pp-list-item">
                      <div className="pp-list-item-info">
                        {req.profiles?.avatar_url ? <img src={req.profiles.avatar_url} alt="" /> : <div style={{width: 24, height: 24, borderRadius: '50%', background: 'var(--border)'}}></div>}
                        <span style={{ fontSize: '0.85rem' }}>{req.profiles?.name}</span>
                      </div>
                      <div className="pp-list-item-actions">
                        <button className="btn-approve" onClick={() => updateRequest(req.id, req.user_id, 'approved')} disabled={isUpdatingRequest[req.id]} style={{ opacity: isUpdatingRequest[req.id] === 'approved' ? 0.7 : 1, width: '60px', display: 'flex', justifyContent: 'center' }}>
                          {isUpdatingRequest[req.id] === 'approved' ? <div className="btn-spinner" style={{ borderColor: "rgba(16,185,129,0.3)", borderTopColor: "#10B981" }}></div> : "Approve"}
                        </button>
                        <button className="btn-reject" onClick={() => updateRequest(req.id, req.user_id, 'rejected')} disabled={isUpdatingRequest[req.id]} style={{ opacity: isUpdatingRequest[req.id] === 'rejected' ? 0.7 : 1, width: '60px', display: 'flex', justifyContent: 'center' }}>
                          {isUpdatingRequest[req.id] === 'rejected' ? <div className="btn-spinner" style={{ borderColor: "rgba(239,68,68,0.3)", borderTopColor: "#EF4444" }}></div> : "Reject"}
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingRequests.length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)'}}>No pending requests.</div>}
                </div>
              </div>
              
              <button className="btn-post" style={{ justifyContent: 'center', marginTop: 12, opacity: isSavingSettings ? 0.7 : 1 }} onClick={saveSettings} disabled={isSavingSettings}>
                {isSavingSettings ? <div className="btn-spinner" style={{ margin: '0 auto' }}></div> : "Save Settings"}
              </button>
              
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProject && (
        <div className="pp-modal-overlay" onClick={() => setShowEditProject(false)}>
          <div className="pp-modal" onClick={e => e.stopPropagation()}>
            <div className="pp-modal-header">
              <h2>Edit Project</h2>
              <button className="pp-modal-close" onClick={() => setShowEditProject(false)}>&times;</button>
            </div>
            <div className="pp-modal-body">
              
              <div className="pp-settings-group">
                <label>Title</label>
                <input 
                  type="text" 
                  className="pp-settings-select" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)} 
                />
              </div>
              
              <div className="pp-settings-group">
                <label>Description</label>
                <textarea 
                  className="pp-settings-select" 
                  value={editDesc} 
                  onChange={e => setEditDesc(e.target.value)} 
                  rows={3} 
                  style={{ resize: 'vertical' }}
                />
              </div>
              
              <div className="pp-settings-group">
                <label>Status</label>
                <select className="pp-settings-select" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  <option value="idea">Concept / Idea</option>
                  <option value="in progress">In Progress</option>
                  <option value="live">Live</option>
                </select>
              </div>

              <div className="pp-settings-group">
                <label>Cover Image</label>
                <label className="pp-settings-select" style={{ cursor: 'pointer', textAlign: 'center', color: 'var(--accent)' }}>
                  Upload New Image
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditImageFile(file);
                        setEditImagePreview(URL.createObjectURL(file));
                      }
                    }} 
                  />
                </label>
                {editImagePreview && (
                  <div style={{ marginTop: '12px', position: 'relative' }}>
                    <img src={editImagePreview} alt="preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    <button 
                      onClick={() => { setEditImageFile(null); setEditImagePreview(null); }}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                    >Γ£ò</button>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn-post" style={{ flex: 1, justifyContent: 'center', opacity: isSavingProject ? 0.7 : 1 }} onClick={saveProject} disabled={isSavingProject}>
                  {isSavingProject ? <div className="btn-spinner" style={{ margin: '0 auto' }}></div> : 'Save Changes'}
                </button>
                <button onClick={() => setShowEditProject(false)} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '11px 22px', borderRadius: '7px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Cancel
                </button>
              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* POST COLLAB MODAL */}
      {showPostCollabModal && (
        <PostCollabModal
          currentUser={user}
          preselectedProjectId={project?.id}
          onClose={() => setShowPostCollabModal(false)}
          onSuccess={() => {
            setCollabToast('≡ƒÄë Collab request posted!');
            setTimeout(() => setCollabToast(null), 2700);
          }}
        />
      )}

      {/* COLLAB TOAST */}
      {collabToast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#22C55E', color: 'white', padding: '12px 24px',
          borderRadius: '20px', fontSize: '13px', fontWeight: '600',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 9999,
          animation: 'toastIn 0.3s ease', whiteSpace: 'nowrap'
        }}>
          {collabToast}
        </div>
      )}
    </>
  );
}

