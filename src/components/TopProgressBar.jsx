import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function TopProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show the progress bar and start animation when location changes
    setVisible(true);
    setProgress(0);

    // Simulate progress
    const timer1 = setTimeout(() => setProgress(30), 10);
    const timer2 = setTimeout(() => setProgress(70), 150);
    const timer3 = setTimeout(() => {
      setProgress(100);
      // Hide after reaching 100%
      setTimeout(() => setVisible(false), 300);
    }, 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "3px",
        background: "#7C3AED",
        zIndex: 9999,
        width: `${progress}%`,
        boxShadow: "0 0 8px #7C3AED",
        transition: "width 300ms ease-out, opacity 300ms ease-in",
        opacity: progress === 100 ? 0 : 1,
      }}
    />
  );
}
