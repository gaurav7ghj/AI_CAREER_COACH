import React, { useState } from "react";
import { useTheme } from "../App";

export default function CoverLetterGenerator() {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    jobTitle: "",
    company: "",
    jobDescription: "",
    personalInfo: "",
    resumeData: "",
  });
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateCoverLetter = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate cover letter: ${response.status}`);
      }

      const data = await response.json();
      setCoverLetter(data.coverLetter);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter);
    alert("Cover letter copied to clipboard!");
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
          <h1 style={{ fontWeight: 900, fontSize: 24, margin: 0 }}>✉️ Cover Letter Generator</h1>
          <p style={{ margin: "8px 0 0", opacity: 0.9 }}>Create personalized cover letters with AI</p>
        </div>
      </header>

      <main style={{ display: "flex", flex: 1, gap: 20, maxWidth: 1200, margin: "auto", padding: 16 }}>
        <section style={{ flex: 1 }}>
          <div style={{
            background: isDark ? "#23293a" : "#fff",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 12px #0002"
          }}>
            <h2 style={{ marginBottom: 20, color: "#374151" }}>Job & Personal Information</h2>
            
            {error && (
              <div style={{ background: "#fee2e2", color: "#be123c", padding: 12, borderRadius: 5, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <form onSubmit={generateCoverLetter}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: "600" }}>
                  Job Title *
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Senior Software Engineer"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px"
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: "600" }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Google"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px"
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: "600" }}>
                  Job Description
                </label>
                <textarea
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  placeholder="Paste the job description here..."
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: "600" }}>
                  Your Personal Info
                </label>
                <textarea
                  name="personalInfo"
                  value={formData.personalInfo}
                  onChange={handleInputChange}
                  placeholder="Your name, email, phone, and any personal details you want to include..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: "600" }}>
                  Resume/Experience Summary
                </label>
                <textarea
                  name="resumeData"
                  value={formData.resumeData}
                  onChange={handleInputChange}
                  placeholder="Brief summary of your key skills, experience, and achievements..."
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    resize: "vertical"
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !formData.jobTitle || !formData.company}
                style={{
                  width: "100%",
                  padding: "12px 24px",
                  background: loading ? "#9ca3af" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s"
                }}
              >
                {loading ? "Generating..." : "✨ Generate Cover Letter"}
              </button>
            </form>
          </div>
        </section>

        <section style={{ flex: 1 }}>
          <div style={{
            background: isDark ? "#23293a" : "#fff",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 12px #0002",
            height: "fit-content"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: "#374151" }}>Generated Cover Letter</h2>
              {coverLetter && (
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: "8px 16px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  📋 Copy
                </button>
              )}
            </div>
            
            {!coverLetter ? (
              <div style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#6b7280",
                fontStyle: "italic"
              }}>
                Fill in the form and click "Generate Cover Letter" to create your personalized cover letter.
              </div>
            ) : (
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "20px",
                whiteSpace: "pre-wrap",
                lineHeight: "1.6",
                fontSize: "14px",
                fontFamily: "Georgia, serif"
              }}>
                {coverLetter}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
