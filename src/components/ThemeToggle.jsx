import { useState, useEffect } from "react";
import "./ThemeToggle.css";

/**
 * A reusable sun/moon theme toggle button.
 * Uses the same mechanism as the Sidebar toggle:
 *   - Reads / writes `localStorage.theme`
 *   - Adds / removes the `light-mode` class on `<html>`
 */
const ThemeToggle = () => {
  const [isLightMode, setIsLightMode] = useState(
    () =>
      document.documentElement.classList.contains("light-mode") ||
      localStorage.getItem("theme") === "light"
  );

  // Sync on mount (covers external changes, e.g. Sidebar toggle)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLightMode(document.documentElement.classList.contains("light-mode"));
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    setIsLightMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("light-mode");
        localStorage.setItem("theme", "light");
      } else {
        document.documentElement.classList.remove("light-mode");
        localStorage.setItem("theme", "dark");
      }
      return next;
    });
  };

  return (
    <button
      className="theme-toggle-floating"
      onClick={toggleTheme}
      title="Toggle Theme"
      aria-label="Toggle light/dark theme"
    >
      {isLightMode ? (
        /* Moon icon – click to go dark */
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        /* Sun icon – click to go light */
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
