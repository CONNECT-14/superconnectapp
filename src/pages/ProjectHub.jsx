import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import useAuth from "../hooks/useAuth";
import useImageUpload from "../hooks/useImageUpload";
import SkeletonLoader from "../components/SkeletonLoader";
import BackgroundParticles from "../components/BackgroundParticles";
import ErrorBoundary from "../components/ErrorBoundary";

const styles = `

  .page-root {
    min-height: 100vh;
    background: var(--bg-input);
    font-family: 'Inter', sans-serif;
    color: var(--text-primary);
    padding: 80px 24px 80px;
  }

  .page-inner {
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    background: transparent;
  }
  
  .page-inner::before, .page-inner::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 80px;
    pointer-events: none;
    z-index: -1;
  }
  
  .page-inner::before {
    left: 0;
    background: linear-gradient(to right, var(--bg-app), transparent);
  }
  
  .page-inner::after {
    right: 0;
    background: linear-gradient(to left, var(--bg-app), transparent);
  }

  .page-subtitle {
    color: var(--text-secondary);
    font-size: 15px;
    margin-top: 4px;
  }

  .page-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }

  .page-header h2 {
    font-family: 'Inter', sans-serif;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1;
    color: var(--text-primary);
  }

  /* 🔥 3 Column Grid for Project Cards */
  .projects-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  
  @media (max-width: 1024px) {
    .projects-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .page-root {
      padding: 80px 16px 80px;
    }
    .projects-grid {
      grid-template-columns: 1fr;
    }
  }

  .project-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    margin-bottom: 0; /* Removing bottom margin as grid handles gap */
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .project-card.clickable {
    cursor: pointer;
  }

  .project-card:hover {
    border-color: #7C3AED;
    transform: scale(1.02);
    box-shadow: 0 0 15px rgba(124, 58, 237, 0.2);
  }

  .project-cover {
    width: 100%;
    height: 200px;
    object-fit: cover;
    background: var(--bg-input);
  }
  
  .project-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .project-tag {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
  .tag-idea { background: rgba(59, 130, 246, 0.15); color: #60A5FA; }
  .tag-in-progress { background: rgba(16, 185, 129, 0.15); color: #10B981; }
  .tag-live { background: rgba(245, 158, 11, 0.15); color: #FBBF24; }

  .project-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .project-desc {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 16px;
    line-height: 1.5;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .project-owner {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-follow {
    background: transparent;
    border: 1px solid var(--accent);
    color: var(--accent);
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: auto;
    width: 100%;
  }

  .btn-follow:hover {
    background: var(--accent);
    color: #fff;
  }

  .btn-follow.active {
    background: var(--accent);
    color: #fff;
  }

  .empty-msg {
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-style: italic;
  }

  /* Controls */
  .controls-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 32px;
    width: 100%;
  }
  .controls-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }
  .search-input {
    flex: 1;
    max-width: 400px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 16px;
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    outline: none;
    transition: border-color var(--transition);
  }
  .search-input:focus {
    border-color: #7C3AED;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
  }
  .search-input::placeholder {
    color: var(--text-secondary);
  }
  .status-dropdown {
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 16px;
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    outline: none;
    cursor: pointer;
  }
  .btn-new-project {
    background: #7C3AED;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }
  .btn-new-project:hover {
    background: #6D28D9;
  }
  @media (max-width: 600px) {
    .controls-row {
      flex-direction: column;
      align-items: stretch;
    }
    .controls-left {
      flex-direction: column;
      align-items: stretch;
    }
    .search-input {
      max-width: none;
    }
  }

  /* Empty State */
  .empty-state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    text-align: center;
    background: rgba(26, 26, 31, 0.5);
    border: 1px dashed var(--border);
    border-radius: 12px;
  }
  .empty-state-title {
    color: var(--text-secondary);
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .empty-state-subtitle {
    color: #A1A1AA;
    font-size: 0.95rem;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 24px;
  }
  .modal-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 32px;
    max-width: 500px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .modal-heading {
    color: var(--text-primary);
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  .modal-label {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }
  .modal-input {
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 16px;
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    outline: none;
    width: 100%;
  }
  .modal-input:focus { border-color: #7C3AED; }
  .modal-textarea {
    resize: vertical;
    min-height: 100px;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }
  .btn-cancel {
    background: transparent;
    border: 1px solid #A1A1AA;
    color: #A1A1AA;
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    font-weight: 600;
  }
  .btn-cancel:hover { background: rgba(161, 161, 170, 0.1); }
  .btn-submit {
    background: #7C3AED;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    font-weight: 600;
  }
  .btn-submit:hover { background: #6D28D9; }
`;

export default function ProjectHub() {
  const [projects, setProjects] = useState([]);
  const { user } = useAuth(); 
  const { upload: uploadImage } = useImageUpload("project-images");
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState({}); // { [projectId]: boolean }
  const [followingProgress, setFollowingProgress] = useState({});
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", description: "", status: "Idea", imageFile: null });
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      init();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const init = async () => {
    const start = Date.now();
    try {
      if (user) {
        await fetchProjects(user, start);
      }
    } catch(err) {
      console.error(err);
      const elapsed = Date.now() - start;
      if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
      setLoading(false);
    }
  };

  // Fetch all projects and build follow status map per project ID
  const fetchProjects = async (currentUser, start = Date.now()) => {
    const { data: projectsData } = await supabase
      .from("projects")
      .select(`*, profiles(name, avatar_url, username)`)
      .order("created_at", { ascending: false });

    const { data: follows } = await supabase
      .from("project_followers")
      .select("project_id")
      .eq("user_id", currentUser.id);

    const followedIds = follows?.map((f) => f.project_id) || [];

    // Build a map of { projectId: bool } instead of embedding in each object
    const statusMap = {};
    (projectsData || []).forEach((proj) => {
      statusMap[proj.id] = followedIds.includes(proj.id);
    });

    setProjects(projectsData || []);
    setFollowStatus(statusMap);
    
    const elapsed = Date.now() - start;
    if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
    setLoading(false);
  };

  const followProject = async (e, projectId) => {
    if (e) e.stopPropagation();
    if (!user) return;

    const proj = projects.find((p) => p.id === projectId);
    if (!proj || proj.user_id === user.id) return;

    const currently = followStatus[projectId] || false;

    setFollowingProgress((prev) => ({ ...prev, [projectId]: true }));
    // Optimistic update — flip the status for this project ID only
    setFollowStatus((prev) => ({ ...prev, [projectId]: !currently }));

    let error;
    if (currently) {
      ({ error } = await supabase
        .from("project_followers")
        .delete()
        .eq("user_id", user.id)
        .eq("project_id", projectId));
    } else {
      ({ error } = await supabase
        .from("project_followers")
        .insert([{ user_id: user.id, project_id: projectId }]));
    }

    if (error) {
      // Revert on failure
      setFollowStatus((prev) => ({ ...prev, [projectId]: currently }));
      console.error(error);
    }
    setFollowingProgress((prev) => ({ ...prev, [projectId]: false }));
  };

  const handleProjectClick = (proj) => {
    navigate(`/project/${proj.id}`);
  };

  const createProject = async () => {
    if (!user) return alert("You must be logged in");
    if (!newProject.title.trim()) return alert("Enter project title");

    setIsCreating(true);
    let imageUrl = null;

    if (newProject.imageFile) {
      imageUrl = await uploadImage(newProject.imageFile, `covers-${Date.now()}-`);
      if (!imageUrl) {
        alert("Image upload failed");
        setIsCreating(false);
        return;
      }
    }

    const { error } = await supabase
      .from("projects")
      .insert([{ 
        user_id: user.id, 
        title: newProject.title, 
        description: newProject.description, 
        image_url: imageUrl, 
        status: newProject.status 
      }]);

    if (error) {
      alert(error.message);
    } else {
      setIsModalOpen(false);
      setNewProject({ title: "", description: "", status: "Idea", imageFile: null });
      fetchProjects(user); // Refresh the list
    }
    setIsCreating(false);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const statusVal = (p.status || "idea").toLowerCase();
    let matchesStatus = true;
    if (statusFilter === "Idea") matchesStatus = statusVal === "idea";
    if (statusFilter === "In Progress") matchesStatus = statusVal === "in progress" || statusVal === "in-progress";
    if (statusFilter === "Live") matchesStatus = statusVal === "live";

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <style>{styles}</style>
      <div className="page-root">
        <BackgroundParticles variant="split" />
        <ErrorBoundary>
        <div className="page-inner">
          <div className="page-header">
            <h2>Project Hub</h2>
            <p className="page-subtitle">Discover and track projects</p>
          </div>

          <div className="controls-row">
            <div className="controls-left">
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search projects..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <select className="status-dropdown" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="Idea">Idea</option>
                <option value="In Progress">In Progress</option>
                <option value="Live">Live</option>
              </select>
            </div>
            <button className="btn-new-project" onClick={() => setIsModalOpen(true)}>
              + New Project
            </button>
          </div>

          {loading ? (
              <div className="projects-grid">
                <SkeletonLoader type="project" />
                <SkeletonLoader type="project" />
                <SkeletonLoader type="project" />
              </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state-container">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '16px'}}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <div className="empty-state-title">No projects found</div>
              <div className="empty-state-subtitle">Try a different search term</div>
            </div>
          ) : (
            <div className="projects-grid">
            {filteredProjects.map((proj) => {
              return (
              <div 
                key={proj.id} 
                className="project-card clickable"
                onClick={() => handleProjectClick(proj)}
              >
                {proj.image_url && (
                  <img src={proj.image_url} alt="Cover" className="project-cover" />
                )}
                <div className="project-content">
                  <div>
                    <span className={`project-tag tag-${(proj.status || 'idea').replace(' ', '-')}`}>
                      {proj.status || 'idea'}
                    </span>
                  </div>
                <div className="project-title">
                  🚀 {proj.title}
                </div>
                
                <p className="project-desc">{proj.description}</p>

                <Link 
                  to={`/profile/${proj.profiles?.username || proj.user_id}`}
                  className="project-owner" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', textDecoration: 'none' }} 
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  {proj.profiles?.avatar_url ? (
                    <img src={proj.profiles.avatar_url} alt="avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                      {proj.profiles?.name ? proj.profiles.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  {proj.profiles?.name || "User"}
                </Link>

                {proj.user_id !== user?.id && (
                  <button
                    className={`btn-follow ${followStatus[proj.id] ? "active" : ""}`}
                    onClick={(e) => followProject(e, proj.id)}
                    disabled={followingProgress[proj.id]}
                    style={{ opacity: followingProgress[proj.id] ? 0.7 : 1 }}
                  >
                    {followingProgress[proj.id] ? <div className="btn-spinner" style={{ borderColor: followStatus[proj.id] ? "rgba(255,255,255,0.3)" : "rgba(124,58,237,0.3)", borderTopColor: followStatus[proj.id] ? "white" : "var(--accent)", margin: '0 auto' }}></div> : followStatus[proj.id] ? "Tracking" : "Track"}
                  </button>
                )}
                </div>
              </div>
              );
            })}
            </div>
          )}
        </div>
        </ErrorBoundary>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-heading">Create New Project</div>
            
            <div>
              <div className="modal-label">Project Title</div>
              <input 
                className="modal-input" 
                value={newProject.title} 
                onChange={e => setNewProject({...newProject, title: e.target.value})} 
                placeholder="e.g. NextGen API"
              />
            </div>

            <div>
              <div className="modal-label">Description</div>
              <textarea 
                className="modal-input modal-textarea" 
                value={newProject.description} 
                onChange={e => setNewProject({...newProject, description: e.target.value})}
                placeholder="What is your project about?"
              />
            </div>

            <div>
              <div className="modal-label">Status</div>
              <select 
                className="modal-input" 
                value={newProject.status} 
                onChange={e => setNewProject({...newProject, status: e.target.value})}
              >
                <option value="Idea">Idea</option>
                <option value="In Progress">In Progress</option>
                <option value="Live">Live</option>
              </select>
            </div>

            <div>
              <div className="modal-label">Cover Image (Optional)</div>
              <input 
                type="file" 
                accept="image/*" 
                style={{color: 'var(--text-primary)'}}
                onChange={e => setNewProject({...newProject, imageFile: e.target.files[0]})}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-submit" onClick={createProject} disabled={isCreating} style={{ opacity: isCreating ? 0.7 : 1 }}>
                {isCreating ? <div className="btn-spinner" style={{ margin: '0 auto' }}></div> : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}