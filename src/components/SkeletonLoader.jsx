export default function SkeletonLoader({ type = "post" }) {
  const shimmerStyle = {
    background: "linear-gradient(90deg, #1A1A1F 25%, #2A2A2F 50%, #1A1A1F 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite"
  };

  if (type === "profile" || type === "page") {
    // SKELETON FOR PROFILE
    return (
      <div style={{ padding: "80px 24px", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ height: "40px", width: "250px", borderRadius: "8px", marginBottom: "30px", ...shimmerStyle }} />
        
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: "48px" }}>
          {/* Banner */}
          <div style={{ height: "100px", width: "100%", ...shimmerStyle }} />
          {/* Avatar */}
          <div style={{ width: "88px", height: "88px", borderRadius: "50%", border: "3px solid #0F0F11", marginTop: "-40px", marginLeft: "24px", ...shimmerStyle }} />
          
          <div style={{ padding: "16px 24px 24px" }}>
            {/* Name and Email */}
            <div style={{ height: "24px", width: "200px", borderRadius: "6px", marginBottom: "12px", ...shimmerStyle }} />
            <div style={{ height: "16px", width: "150px", borderRadius: "6px", marginBottom: "24px", ...shimmerStyle }} />
            
            {/* Stats */}
            <div style={{ display: "flex", gap: "24px", marginTop: "24px", borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
              <div style={{ height: "36px", width: "60px", borderRadius: "6px", ...shimmerStyle }} />
              <div style={{ width: "1px", height: "32px", background: "var(--border)" }} />
              <div style={{ height: "36px", width: "60px", borderRadius: "6px", ...shimmerStyle }} />
              <div style={{ width: "1px", height: "32px", background: "var(--border)" }} />
              <div style={{ height: "36px", width: "60px", borderRadius: "6px", ...shimmerStyle }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "project") {
    // SKELETON FOR PROJECT CARDS
    return (
      <div style={{
        background: "#1A1A1F",
        border: "1px solid #2A2A2F",
        borderRadius: "12px",
        padding: "24px",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ width: "100%", height: "180px", borderRadius: "8px", marginBottom: "16px", ...shimmerStyle }} />
        <div style={{ width: "70%", height: "20px", borderRadius: "6px", marginBottom: "12px", ...shimmerStyle }} />
        <div style={{ width: "100%", height: "14px", borderRadius: "4px", marginBottom: "8px", ...shimmerStyle }} />
        <div style={{ width: "90%", height: "14px", borderRadius: "4px", ...shimmerStyle }} />
      </div>
    );
  }

  if (type === "block") {
    return (
      <div style={{
        background: "#1A1A1F",
        padding: "24px",
        borderRadius: "12px",
        marginBottom: "16px",
        border: "1px solid #2A2A2F",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        <div style={{ width: "60%", height: "24px", borderRadius: "6px", ...shimmerStyle }} />
        <div style={{ width: "100%", height: "12px", borderRadius: "4px", ...shimmerStyle }} />
        <div style={{ width: "80%", height: "12px", borderRadius: "4px", ...shimmerStyle }} />
      </div>
    );
  }

  // Default type: "post" or "card"
  return (
    <div style={{
      background: "#1A1A1F",
      border: "1px solid #2A2A2F",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "20px",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header: Avatar, Username, Date */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", ...shimmerStyle }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ width: "120px", height: "14px", borderRadius: "4px", ...shimmerStyle }} />
          <div style={{ width: "80px", height: "12px", borderRadius: "4px", ...shimmerStyle }} />
        </div>
      </div>
      
      {/* Content */}
      <div style={{ width: "100%", height: "12px", borderRadius: "4px", marginBottom: "8px", ...shimmerStyle }} />
      <div style={{ width: "90%", height: "12px", borderRadius: "4px", marginBottom: "8px", ...shimmerStyle }} />
      <div style={{ width: "60%", height: "12px", borderRadius: "4px", marginBottom: "16px", ...shimmerStyle }} />
      
      {/* Image Placeholder */}
      <div style={{ width: "100%", height: "200px", borderRadius: "8px", ...shimmerStyle }} />
    </div>
  );
}
