import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import useImageUpload from "../../hooks/useImageUpload";

export default function ProfileProjects({ user, projects, setProjects }) {
  const navigate = useNavigate();
  const { upload: uploadProjectImage } = useImageUpload("project-images");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("idea");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const createProject = async () => {
    if (!user) return alert("You must be logged in");
    if (!title.trim()) return alert("Enter project title");

    setUploading(true);
    let imageUrl = null;

    if (image) {
      imageUrl = await uploadProjectImage(image, `covers-${Date.now()}-`);
      if (!imageUrl) {
        alert("Image upload failed");
        setUploading(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from("projects")
      .insert([{ user_id: user.id, title, description, image_url: imageUrl, status }])
      .select();

    if (error) {
      alert(error.message);
    } else {
      setProjects([data[0], ...projects]);
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
      .eq("user_id", user.id);

    if (error) {
      alert("Could not delete: " + error.message);
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  };

  return (
    <>
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
        <button className="btn-create" onClick={createProject} disabled={uploading} style={{ opacity: uploading ? 0.7 : 1 }}>
          {uploading ? <div className="btn-spinner" style={{ margin: '0 auto' }}></div> : "Create Project"}
        </button>
      </div>

      <div>
        <p className="section-label">My Projects ({projects.length})</p>
        <div className="projects-list">
          {projects.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No projects yet.</p>
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
                  <p style={{ fontSize: "0.9rem", marginTop: "8px", color: "var(--text-secondary)" }}>
                    {proj.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
