import React, { useState } from "react";
import { getCareerAdvice } from "../services/api";
import { isAuthenticated } from "../utils/auth";
import "../styles/globals.css";

// Utility for formatting advice content
function cleanSummary(summary) {
  if (!summary) return "";
  summary = summary.replace(/\n[\-*]?\s*$/, "");
  if (/Additional Tips:\s*$/i.test(summary)) summary += "\nNo additional tips at this time.";
  return summary.trim();
}

function formatText(text) {
  if (!text) return [];
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
  return lines.map(line => {
    if (/^\*\*(.+)\*\*:?$/.test(line))
      return { type: "header", content: line.replace(/^\*\*(.+)\*\*:?$/, "$1") };
    if (/^[-•*]\s+/.test(line))
      return { type: "bullet", content: line.replace(/^[-•*]\s+/, "") };
    return { type: "text", content: line };
  });
}

// Renders the formatted AI advice
function AdviceDetails({ advice }) {
  if (!advice) return <p>No advice details available.</p>;
  const formatted = advice.formatted || formatText(cleanSummary(advice.summary || ""));
  if (!formatted.length) return <p>No detailed content available.</p>;
  return (
    <div>
      {formatted.map((item, idx) => {
        if (item.type === "header")
          return (
            <h3 key={idx} style={{ fontWeight: "bold", margin: "1em 0 0.3em" }}>
              {item.content}
            </h3>
          );
        if (item.type === "bullet")
          return (
            <li key={idx} style={{ margin: "0.2em 0" }}>
              {item.content}
            </li>
          );
        return (
          <p key={idx} style={{ marginBottom: "0.5em" }}>
            {item.content}
          </p>
        );
      })}
    </div>
  );
}

export default function CareerForm() {
  const [config, setConfig] = useState({
    skills: "",
    interests: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [advice, setAdvice] = useState(null);

  // Controlled inputs
  const handleChange = e => {
    setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      setError("You must be logged in to get career advice.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await getCareerAdvice(config);
      const adviceText = data?.advice || "";
      setAdvice({ summary: adviceText });
    } catch (err) {
      setError(err.message || "Failed to get career advice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="gradient-center-container">
      <form className="form-outer-card" onSubmit={handleSubmit}>
        <h1>Get AI-Powered Career Advice</h1>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div className="input-group">
          <label>🦄 Your Skills</label>
          <textarea
            name="skills"
            value={config.skills}
            onChange={handleChange}
            rows={3}
            placeholder="Enter your skills here..."
          />
        </div>

        <div className="input-group">
          <label>🎯 Your Interests</label>
          <textarea
            name="interests"
            value={config.interests}
            onChange={handleChange}
            rows={3}
            placeholder="Enter your interests here..."
          />
        </div>

        <button className="gradient-btn" type="submit" disabled={loading}>
          {loading ? "Loading advice..." : "Get Career Advice ✨"}
        </button>

        {advice && (
          <section className="result-card" style={{ marginTop: "2em" }}>
            <h2>💡 Your Personalized Career Advice</h2>
            <AdviceDetails advice={advice} />
          </section>
        )}
      </form>
    </main>
  );
}
