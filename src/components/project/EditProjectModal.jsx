import { useState } from "react";
import { supabase } from "../../supabaseClient";
import useImageUpload from "../../hooks/useImageUpload";

export default function EditProjectModal({ project, onClose, onUpdateProject }) {
  const [editTitle, setEditTitle] = useState(project.title || "");
  const [editDesc, setEditDesc] = useState(project.description || "");
  const [editStatus, setEditStatus] = useState(project.status || "idea");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(project.image_url || null);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [error, setError] = useState(null);
  
  const { upload: uploadProjectImage } = useImageUpload('project-images');

  const saveProject = async () => {
    setIsSavingProject(true);
    let imageUrl = project.image_url;
    
    if (editImageFile) {
      const uploadedUrl = await uploadProjectImage(editImageFile, `covers-${Date.now()}-`);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        setError("Error uploading cover image.");
        setIsSavingProject(false);
        return;
      }
    }
    
    const { error: saveError } = await supabase.from("projects").update({
      title: editTitle,
      description: editDesc,
      status: editStatus,
      image_url: imageUrl
    }).eq("id", project.id);
    
    if (saveError) {
      setError("Error saving project.");
      setIsSavingProject(false);
      return;
    }
    
    onUpdateProject({ title: editTitle, description: editDesc, status: editStatus, image_url: imageUrl });
    onClose();
    setIsSavingProject(false);
  };

  return (
    <div className="pp-modal-overlay" onClick={onClose}>
      <div className="pp-modal" onClick={e => e.stopPropagation()}>
        <div className="pp-modal-header">
          <h2>Edit Project</h2>
          <button className="pp-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="pp-modal-body">
          {error && (
            <div style={{ background: '#ef4444', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}>
              {error}
            </div>
          )}
          
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
                >✕</button>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="btn-post" style={{ flex: 1, justifyContent: 'center', opacity: isSavingProject ? 0.7 : 1 }} onClick={saveProject} disabled={isSavingProject}>
              {isSavingProject ? <div className="btn-spinner" style={{ margin: '0 auto' }}></div> : 'Save Changes'}
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '11px 22px', borderRadius: '7px', cursor: 'pointer', color: 'var(--text-primary)' }}>
              Cancel
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
