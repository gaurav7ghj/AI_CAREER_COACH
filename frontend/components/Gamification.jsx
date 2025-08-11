import React, { useState, useEffect } from "react";
import { useTheme } from "../App";

export default function Gamification() {
  const { isDark } = useTheme();
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({
    totalChats: 0,
    resumesGenerated: 0,
    coverLettersCreated: 0,
    mockInterviews: 0,
  });

  useEffect(() => {
    // Load gamification data from localStorage
    const savedStreak = parseInt(localStorage.getItem('chat-streak') || '0');
    const savedBadges = JSON.parse(localStorage.getItem('user-badges') || '[]');
    const savedStats = JSON.parse(localStorage.getItem('user-stats') || '{}');
    
    setStreak(savedStreak);
    setBadges(savedBadges);
    setStats(prev => ({ ...prev, ...savedStats }));
  }, []);

  const motivationalQuotes = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Don't be afraid to give up the good to go for the great. - John D. Rockefeller",
    "The future depends on what you do today. - Mahatma Gandhi",
    "Success is walking from failure to failure with no loss of enthusiasm. - Winston Churchill",
    "Opportunities don't happen. You create them. - Chris Grosser",
  ];

  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  const badgeIcons = {
    'first-chat': '💬',
    'chat-10': '🗣️',
    'chat-50': '👑',
    'streak-3': '🔥',
    'streak-7': '⚡',
    'streak-30': '🏆',
    'file-upload': '📎',
    'resume-master': '📄',
    'cover-letter-pro': '✉️',
    'interview-ace': '🎤',
  };

  const getBadgeColor = (badgeType) => {
    const colors = {
      'first-chat': '#10b981',
      'chat-10': '#3b82f6',
      'chat-50': '#8b5cf6',
      'streak-3': '#f59e0b',
      'streak-7': '#ef4444',
      'streak-30': '#ec4899',
      'file-upload': '#6366f1',
      'resume-master': '#059669',
      'cover-letter-pro': '#0ea5e9',
      'interview-ace': '#dc2626',
    };
    return colors[badgeType] || '#6b7280';
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: isDark ? "#181b22" : "#f9fafb",
      display: "flex",
      flexDirection: "column",
    }}>
      <header style={{
        background: "linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)",
        padding: "20px",
        color: "#fff",
        boxShadow: "0 4px 12px #0002"
      }}>
        <div style={{ maxWidth: 1200, margin: "auto" }}>
          <h1 style={{ fontWeight: 900, fontSize: 24, margin: 0 }}>🏆 Your Progress</h1>
          <p style={{ margin: "8px 0 0", opacity: 0.9 }}>Track your career development journey</p>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "auto", padding: 16, flex: 1 }}>
        {/* Streak & Motivation */}
        <div style={{
          background: isDark ? "#23293a" : "#fff",
          padding: 24,
          borderRadius: 10,
          boxShadow: "0 4px 12px #0002",
          marginBottom: 20,
          textAlign: "center"
        }}>
          <div style={{ fontSize: "48px", marginBottom: 16 }}>
            {streak > 0 ? "🔥" : "💫"}
          </div>
          <h2 style={{ margin: 0, fontSize: "32px", fontWeight: "700", color: "#374151" }}>
            {streak} Day Streak
          </h2>
          <p style={{ margin: "8px 0 16px", color: "#6b7280" }}>
            {streak === 0 ? "Start your journey today!" : `You're on fire! Keep it up!`}
          </p>
          <blockquote style={{
            fontStyle: "italic",
            color: "#4f46e5",
            fontSize: "14px",
            lineHeight: "1.6",
            maxWidth: "600px",
            margin: "16px auto 0",
            padding: "16px",
            background: "#f0f9ff",
            borderLeft: "4px solid #3b82f6",
            borderRadius: "0 8px 8px 0"
          }}>
            "{randomQuote}"
          </blockquote>
        </div>

        {/* Stats Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: 16, 
          marginBottom: 20 
        }}>
          <div style={{
            background: isDark ? "#23293a" : "#fff",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 12px #0002",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", marginBottom: 8 }}>💬</div>
            <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#374151" }}>
              {stats.totalChats || 0}
            </h3>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>
              AI Conversations
            </p>
          </div>

          <div style={{
            background: isDark ? "#23293a" : "#fff",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 12px #0002",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", marginBottom: 8 }}>📄</div>
            <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#374151" }}>
              {stats.resumesGenerated || 0}
            </h3>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>
              Resumes Created
            </p>
          </div>

          <div style={{
            background: isDark ? "#23293a" : "#fff",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 12px #0002",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", marginBottom: 8 }}>✉️</div>
            <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#374151" }}>
              {stats.coverLettersCreated || 0}
            </h3>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>
              Cover Letters
            </p>
          </div>

          <div style={{
            background: isDark ? "#23293a" : "#fff",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 12px #0002",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", marginBottom: 8 }}>🎤</div>
            <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#374151" }}>
              {stats.mockInterviews || 0}
            </h3>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>
              Mock Interviews
            </p>
          </div>
        </div>

        {/* Badges */}
        <div style={{
          background: isDark ? "#23293a" : "#fff",
          padding: 24,
          borderRadius: 10,
          boxShadow: "0 4px 12px #0002"
        }}>
          <h2 style={{ marginBottom: 20, color: "#374151" }}>🏅 Your Badges</h2>
          
          {badges.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}>
              <p>No badges earned yet. Start using the platform to unlock achievements!</p>
            </div>
          ) : (
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", 
              gap: 16 
            }}>
              {badges.map((badge, index) => (
                <div
                  key={index}
                  style={{
                    background: `linear-gradient(135deg, ${getBadgeColor(badge.type)}, ${getBadgeColor(badge.type)}dd)`,
                    color: "white",
                    padding: 16,
                    borderRadius: 10,
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: 8 }}>
                    {badgeIcons[badge.type] || "🏆"}
                  </div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>
                    {badge.name}
                  </h4>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.9 }}>
                    {new Date(badge.earned).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
