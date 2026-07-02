import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function PrivateRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F11' }}>
        <style>{`
          @keyframes appSpin { to { transform: rotate(360deg); } }
          .app-loading-spinner {
            width: 40px; height: 40px;
            border: 4px solid rgba(255,255,255,0.1);
            border-top-color: #7C3AED;
            border-radius: 50%;
            animation: appSpin 1s linear infinite;
          }
        `}</style>
        <div className="app-loading-spinner"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
