import React, { useState } from "react";
import { getInterviewQuestions, getFeedback } from "../services/api";
import "../styles/globals.css";


function formatAsBullets(fb) {
  if (!fb) return <li>No feedback received.</li>;
    if (Array.isArray(fb)) return fb.map((item, i) => <li key={i}>{item}</li>);

     if (typeof fb === "string" && fb.includes("\n"))
    return fb.split("\n").map((txt, i) =>
      txt.trim() && <li key={i}>{txt.trim()}</li>
    );

    return <li>{typeof fb === "object" ? fb.feedback || JSON.stringify(fb) : fb}</li>;
}
export default function MockInterview() {
  const [config, setConfig] = useState({ role: "", skills: "", num: 5 });
  const [stage, setStage] = useState("config");
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setConfig((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const startInterview = async (e) => {
    e.preventDefault();

    if (!config.role.trim() || !config.skills.trim()) {
      setError("Please fill in both Role/Domain and Skills.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const qs = await getInterviewQuestions(config.role, config.skills, config.num);

      const filteredQuestions = qs.filter(
        (q) =>
          q &&
          !q.toLowerCase().includes("start the interview") &&
          !q.toLowerCase().startsWith("here are")
      );

      setQuestions(filteredQuestions);
      setStage("interview");
      setCurrent(0);
      setAnswers([]);
      setFeedbacks([]);
    } catch (err) {
      setError(err.message || "Failed to generate questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (e) => {
    e.preventDefault();

    const ans = e.target.answer.value.trim();
    if (!ans) return;

    setLoading(true);
    try {
      const fb = await getFeedback(questions[current], ans, config.role, config.skills);
      setAnswers((a) => [...a, ans]);
      setFeedbacks((f) => [...f, fb]);

      if (current + 1 < questions.length) setCurrent(current + 1);
      else setStage("complete");

      e.target.answer.value = "";
    } catch (err) {
      setError(err.message || "Failed to get feedback.");
    } finally {
      setLoading(false);
    }
  };

  if (stage === "config")
    return (
      <main className="gradient-center-container">
        <form className="form-outer-card" onSubmit={startInterview}>
          <h1>Mock Interview</h1>
          {error && <p style={{ color: "red" }}>{error}</p>}

          <div className="input-group">
            <label htmlFor="role">Role/Domain</label>
            <input
              id="role"
              name="role"
              type="text"
              value={config.role}
              onChange={handleChange}
              placeholder="E.g., Software Engineer"
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label htmlFor="skills">Key Skills</label>
            <input
              id="skills"
              name="skills"
              type="text"
              value={config.skills}
              onChange={handleChange}
              placeholder="E.g., React, Java, Communication"
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label htmlFor="num">Number of Questions</label>
            <input
              id="num"
              name="num"
              type="number"
              min="1"
              max="30"
              value={config.num}
              onChange={handleChange}
            />
          </div>

          <button className="gradient-btn" type="submit" disabled={loading}>
            {loading ? "Loading questions..." : "Start Interview"}
          </button>
        </form>
      </main>
    );

  if (stage === "interview")
    return (
      <main className="gradient-center-container">
        <div className="form-outer-card">
          <h2>
            Question {current + 1} of {questions.length}
          </h2>
          <p>{questions[current]}</p>

          <form onSubmit={handleAnswer}>
            <div className="input-group">
              <label htmlFor="answer">Your Answer</label>
              <textarea
                id="answer"
                name="answer"
                rows={4}
                placeholder="Type your answer here..."
                autoComplete="off"
              />
            </div>
            <button className="gradient-btn" type="submit" disabled={loading}>
              {loading ? "Getting feedback..." : "Submit Answer"}
            </button>
          </form>

          {feedbacks[current] && (
            <section style={{ marginTop: "1.5em" }}>
              <h3>Feedback:</h3>
              <p>
                {typeof feedbacks[current] === "object"
                  ? feedbacks[current]?.feedback || JSON.stringify(feedbacks[current])
                  : feedbacks[current]}
              </p>
            </section>
          )}

          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </main>
    );

 if (stage === "complete")
  return (
    <main className="mock-center-container">
      <div className="mock-interview-result-card">
        <h1 className="mock-title">Mock Interview Complete</h1>
        {questions.map((q, i) => (
          <div key={i} className="mock-question-block">
            <h3>
              <span className="mock-qno">Q{i + 1}</span> {q}
            </h3>
            <ul className="mock-summary-list">
              <li>
                <strong>Your Answer:</strong> <span>{answers[i]}</span>
              </li>
              <li>
                <strong>Feedback:</strong>
                <ul className="mock-bullet-feedback">
                  {formatAsBullets(feedbacks[i])}
                </ul>
              </li>
            </ul>
          </div>
        ))}

        <button className="gradient-btn" onClick={() => setStage("config")}>
          Practice again to improve your responses!
        </button>
      </div>
    </main>
  );


  return null;
}
