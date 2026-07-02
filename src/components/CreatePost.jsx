import { useState } from "react";
import { supabase } from "../supabaseClient";
import useAuth from "../hooks/useAuth";
import useImageUpload from "../hooks/useImageUpload";

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]); // 🔥 multiple images
  const [previews, setPreviews] = useState([]); // 🔥 multiple previews
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("Discussion");
  const [topic, setTopic] = useState("Design");

  const { user } = useAuth();
  const { upload: uploadImage } = useImageUpload('post-images');

  // 📸 Handle multiple image select
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (!files.length) return;

    setImages(files);

    const previewUrls = files.map((file) =>
      URL.createObjectURL(file)
    );
    setPreviews(previewUrls);
  };

  // 🚀 Handle post
  const handlePost = async () => {
    if (!content && images.length === 0) {
      alert("Please add content or image");
      return;
    }

    if (!user) {
      alert("User not logged in");
      return;
    }

    setLoading(true);

    // 🛑 Rate Limit Check
    const { data: isAllowed, error: rlError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_action: 'posts',
      p_max_count: 10,
      p_window_seconds: 60
    });

    if (rlError) {
      console.error("Rate limit check failed:", rlError);
    } else if (!isAllowed) {
      alert("You're posting too fast — please wait a moment.");
      setLoading(false);
      return;
    }

    let imageUrls = [];

    // ================= MULTIPLE IMAGE UPLOAD =================
    if (images.length > 0) {
      for (let img of images) {
        const url = await uploadImage(img, `${Date.now()}-`);
        if (!url) {
          setLoading(false);
          return;
        }
        imageUrls.push(url);
      }
    }

    // ================= INSERT POST =================
    const stringifiedContent = JSON.stringify({
      text: content,
      category,
      topic
    });

    const { error: insertError } = await supabase.from("posts").insert([
      {
        user_id: user.id,
        content: stringifiedContent,
        image_urls: imageUrls,
      },
    ]);

    if (insertError) {
      console.log("INSERT ERROR:", insertError.message);
      alert("Post failed");
    } else {
      // 🔥 Reset
      setContent("");
      setImages([]);
      setPreviews([]);

      if (onPostCreated) {
        onPostCreated();
      }
    }

    setLoading(false);
  };

  return (
    <div style={{
      marginBottom: "24px",
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "var(--shadow)"
    }}>
      {/* TEXT */}
      <textarea
        placeholder="Share your thoughts or project updates..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--bg-input)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.95rem",
          color: "var(--text-primary)",
          resize: "none",
          minHeight: "100px",
          outline: "none",
          transition: "border-color 200ms ease, box-shadow 200ms ease",
          boxSizing: "border-box"
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--accent)";
          e.target.style.boxShadow = "0 0 0 3px rgba(124, 58, 237, 0.15)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--border)";
          e.target.style.boxShadow = "none";
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "16px" }}>
        {/* 🔥 TAGS (Category & Topic) */}
        <div style={{ display: "flex", gap: "8px" }}>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.85rem",
              cursor: "pointer",
              outline: "none",
              transition: "border-color 200ms ease"
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          >
            <option value="Discussion">Discussion</option>
            <option value="Question">Question</option>
            <option value="Help Request">Help Request</option>
            <option value="Feedback">Feedback</option>
            <option value="Collaboration">Collaboration</option>
            <option value="Project Update">Project Update</option>
          </select>

          <select 
            value={topic} 
            onChange={(e) => setTopic(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.85rem",
              cursor: "pointer",
              outline: "none",
              transition: "border-color 200ms ease"
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          >
            <option value="Design">Design</option>
            <option value="Technology">Technology</option>
            <option value="Startups">Startups</option>
            <option value="Marketing">Marketing</option>
            <option value="AI">AI</option>
            <option value="Growth">Growth</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* MULTIPLE IMAGE INPUT */}
        <label style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--text-secondary)",
          cursor: "pointer",
          fontSize: "0.9rem",
          fontWeight: "500",
          fontFamily: "'Inter', sans-serif",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px dashed transparent",
          transition: "all 200ms ease"
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = "var(--accent)";
          e.currentTarget.style.backgroundColor = "rgba(124, 58, 237, 0.08)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = "var(--text-secondary)";
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: "16px", height: "16px"}}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Attach Images
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </label>

        {/* BUTTON */}
        <button
          onClick={handlePost}
          disabled={loading}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            fontWeight: "600",
            fontFamily: "'Inter', sans-serif",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 200ms ease",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            opacity: loading ? 0.7 : 1
          }}
          onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "var(--accent-hover)"; }}
          onMouseOut={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "var(--accent)"; }}
        >
          {loading ? <div className="btn-spinner"></div> : "Post"}
        </button>
        </div>
      </div>

      {/* 🔥 IMAGE PREVIEW GRID */}
      {previews.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "16px",
            flexWrap: "wrap",
            paddingTop: "16px",
            borderTop: "1px solid var(--border)"
          }}
        >
          {previews.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="preview"
              style={{
                width: "80px",
                height: "80px",
                objectFit: "cover",
                borderRadius: "8px",
                border: "1px solid var(--border)"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}