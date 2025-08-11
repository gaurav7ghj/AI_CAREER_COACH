import React, { useState, createContext, useContext, useMemo, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Homepage from "./components/HomePage";
import CareerForm from "./components/CareerForm";
import AdviceHistory from "./components/AdviceHistory";
import Login from "./components/Login";
import RemotiveJobs from "./components/RemotiveJobs";
import SavedJobs from "./components/SavedJobs";
import ResumeBuilder from "./components/ResumeBuilder";
import AIChatbotPanel from "./components/AIChatbotPanel"; // NEW IMPORT
import { isAuthenticated, clearToken, getUserFromToken } from "./utils/auth";
import "./styles/globals.css";
import MockInterview from "./components/MockInterview";




const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider.');
  return context;
};

const ThemeProvider = React.memo(({ children }) => {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const toggleTheme = () => {
    setIsDark(prev => {
      const newTheme = !prev;
      if(newTheme) document.body.classList.add('dark-theme');
      else document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  useEffect(() => {
    if(isDark) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
});

const Navigation = React.memo(() => {
  const location = useLocation();
  const authenticated = isAuthenticated();
  const userInfo = getUserFromToken();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to logout?")) {
      clearToken();
      navigate("/login", { replace: true });
    }
  };

  const navStyle = {
    background: 'var(--bg-card)',
    borderBottom: `1px solid var(--border-color)`,
    boxShadow: 'var(--shadow)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56
  };

  const linkStyle = (path) => ({
    color: location.pathname === path ? '#6366f1' : 'var(--text-secondary)',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    fontWeight: 600,
    transition: 'background-color 0.2s ease',
    backgroundColor: location.pathname === path ? 'rgba(99, 102, 241, 0.15)' : 'transparent'
  });

  return (
    <nav style={navStyle}>
      <Link to="/" style={{ fontSize: 20, fontWeight: 900, textDecoration: 'none', color: 'var(--text-primary)' }}>
        🚀 AI Career Coach
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {authenticated && <>
          <Link to="/" style={linkStyle('/')}>🏠 Home</Link>
          <Link to="/advice" style={linkStyle('/advice')}>💡 Advice</Link>
          <Link to="/advice-history" style={linkStyle('/advice-history')}>📚 History</Link>
          <Link to="/remotive-jobs" style={linkStyle('/remotive-jobs')}>💼 Jobs</Link>
          <Link to="/saved-jobs" style={linkStyle('/saved-jobs')}>⭐ Saved</Link>
          <Link to="/resume-builder" style={linkStyle('/resume-builder')}>📄 Résumé</Link>
          <Link to="/mock-interview" style={linkStyle('/mock-interview')}>mock-interview</Link>

          

        </>}
        {/* <button onClick={toggleTheme} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>
          {isDark ? '☀️' : '🌙'}
        </button> */}
        {!authenticated ? 
          <Link to="/login" style={linkStyle('/login')}>Sign In</Link> :
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
              {userInfo?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{userInfo?.email?.split('@')[0] || 'User'}</span>
            <button onClick={handleLogout} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Sign Out</button>
          </div>
        }
      </div>
    </nav>
  );
});

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Navigation />
        <AIChatbotPanel /> {/* ADD THIS LINE - Chatbot available on all pages */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
          <Route path="/advice" element={<ProtectedRoute><CareerForm /></ProtectedRoute>} />
          <Route path="/advice-history" element={<ProtectedRoute><AdviceHistory /></ProtectedRoute>} />
          <Route path="/remotive-jobs" element={<ProtectedRoute><RemotiveJobs /></ProtectedRoute>} />
          <Route path="/saved-jobs" element={<ProtectedRoute><SavedJobs /></ProtectedRoute>} />
          <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
          <Route path="/mock-interview" element={<MockInterview />} />
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: 40 }}>
              <h1>404 - Page Not Found</h1>
              <p>The page you are looking for does not exist.</p>
              <Link to="/">Back to Home</Link>
            </div>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
