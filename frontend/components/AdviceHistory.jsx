import React, { useState, useEffect, useMemo } from "react";
import "../styles/globals.css";

// Floating animated background circle
function FloatingCircle({ style }) {
  return <div className="floating-circle" style={style} aria-hidden="true" />;
}

// Spinner with four rings
function Spinner() {
  return (
    <div
      className="spinner"
      aria-label="Loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div />
      <div />
      <div />
      <div />
    </div>
  );
}

// Modal wrapper showing detailed advice info
function Modal({ isOpen, onClose, title, children }) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal" tabIndex={-1}>
        <button className="modal-close" aria-label="Close modal" onClick={onClose} autoFocus type="button">
          &times;
        </button>
        <h2 id="modal-title">{title || "Advice Detail"}</h2>
        {children || <div style={{ minHeight: 80, color: 'var(--text-secondary)' }}>No detail available.</div>}
      </div>
    </div>
  );
}


// Helper: parse advice text into sections and bullets
function formatAdviceText(text) {
  if (!text) return [];
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const sections = [];
  lines.forEach((line) => {
    if (/^\*\*(.+)\*\*[:Ã¯Â¼Å¡]?/.test(line)) {
      sections.push({
        type: "header",
        content: line.replace(/^\*\*(.+?)\*\*[:Ã¯Â¼Å¡]?/, "$1"),
      });
    } else if (/^[-Ã¢â‚¬Â¢*]\s+/.test(line)) {
      sections.push({ type: "bullet", content: line.replace(/^[-Ã¢â‚¬Â¢*]\s+/, "") });
    } else {
      sections.push({ type: "text", content: line });
    }
  });
  return sections;
}

// Render formatted advice sections as readable content
function AdviceDetails({ advice }) {
  if (!advice || (!advice.summary && !advice.formatted)) {
    return (
      <p style={{ color: "var(--text-secondary)" }}>No advice details available.</p>
    );
  }
  const sections = advice.formatted || formatAdviceText(advice.summary || "");
  if (!sections.length) {
    return (
      <p style={{ color: "var(--text-secondary)" }}>
        No detailed advice content found.
      </p>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      {sections.map((section, i) =>
        section.type === "header" ? (
          <div
            key={i}
            style={{
              fontWeight: 700,
              fontSize: "1.1em",
              margin: "20px 0 8px",
              color: "var(--text-primary)",
            }}
          >
            {section.content}
          </div>
        ) : section.type === "bullet" ? (
          <li
            key={i}
            style={{
              marginLeft: 20,
              marginBottom: 6,
              color: "var(--text-secondary)",
              fontSize: "0.95rem",
            }}
          >
            {section.content}
          </li>
        ) : (
          <div
            key={i}
            style={{
              marginBottom: 8,
              color: "var(--text-primary)",
              fontSize: "1rem",
              lineHeight: 1.5,
            }}
          >
            {section.content}
          </div>
        )
      )}
    </div>
  );
}

// Single advice card with checkbox and tags
function AdviceCard({ advice, onSelect, selected, onOpenModal }) {
  const truncateLimit = 120;
  const summary =
    advice.summary && advice.summary.length > truncateLimit
      ? advice.summary.slice(0, truncateLimit) + "..."
      : advice.summary || "No summary available";

  return (
    <div
      className="card"
      tabIndex={0}
      role="button"
      aria-pressed={selected}
      aria-label={`Advice card: ${advice.title}`}
      onClick={() => onOpenModal(advice)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenModal(advice);
        }
      }}
    >
      <div className="card-header" style={{ justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>{advice.title || "Career Advice"}</h3>
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(advice.id);
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select advice titled ${advice.title}`}
        />
      </div>
      <p style={{ marginTop: 10 }}>{summary}</p>
      <div className="card-tags" aria-label="Advice categories">
        {advice.skills && advice.skills.length > 0 && (
          <span className="tag tag-skill" title="Skills">
            Ã°Å¸â€™Â¼ {advice.skills.join(", ")}
          </span>
        )}
        {advice.interests && advice.interests.length > 0 && (
          <span className="tag tag-interest" title="Interests">
            Ã°Å¸â€™Â¡ {advice.interests.join(", ")}
          </span>
        )}
        {advice.aiGuidance && (
          <span className="tag tag-ai" title="AI Guidance">
            Ã°Å¸Å½Â¯ AI Guidance
          </span>
        )}
      </div>
    </div>
  );
}

// Timeline item for timeline view
function TimelineItem({ advice }) {
  return (
    <div
      className="timeline-item"
      tabIndex={0}
      aria-label={`Timeline item: ${advice.title}`}
    >
      <div className="timeline-marker" aria-hidden="true" />
      <h3>{advice.title}</h3>
      <time dateTime={advice.date}>
        {new Date(advice.date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </time>
      <p>{advice.summary || "No summary available"}</p>
    </div>
  );
}

export default function AdviceHistory() {
  const [adviceData, setAdviceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' or 'timeline'
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAdvice, setModalAdvice] = useState(null);

  useEffect(() => {
    try {
      setLoading(true);
      const saved = JSON.parse(localStorage.getItem("advice-history") || "[]");
      setAdviceData(saved);
      setLoading(false);
    } catch {
      setError("Failed to load advice history");
      setLoading(false);
    }
  }, []);

  const totalSessions = adviceData.length;
  const lastMonthSessions = adviceData.filter((a) => {
    const d = new Date(a.date);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return d >= oneMonthAgo;
  }).length;
  const lastWeekSessions = adviceData.filter((a) => {
    const d = new Date(a.date);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return d >= oneWeekAgo;
  }).length;

  const filteredAdvice = useMemo(() => {
    if (!searchTerm) return adviceData;
    const term = searchTerm.toLowerCase();
    return adviceData.filter(
      (a) =>
        (a.title && a.title.toLowerCase().includes(term)) ||
        (a.summary && a.summary.toLowerCase().includes(term)) ||
        (a.skills && a.skills.some((s) => s.toLowerCase().includes(term))) ||
        (a.interests && a.interests.some((i) => i.toLowerCase().includes(term)))
    );
  }, [searchTerm, adviceData]);

  function toggleSelect(id) {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }

  function openModal(advice) {
    if (!advice) return;
    setModalAdvice({
      ...advice,
      formatted: formatAdviceText(advice.summary || ""),
    });
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setModalAdvice(null);
  }

  if (loading) {
    return (
      <main>
        <section className="hero" aria-live="polite">
          <FloatingCircle />
          <FloatingCircle style={{ left: "80%", top: "50%", animationDelay: "3s" }} />
          <Spinner />
          <p style={{ marginTop: "20px", fontWeight: "600" }}>
            Loading your career journey...
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <section className="hero" aria-live="assertive">
          <FloatingCircle />
          <FloatingCircle style={{ left: "80%", top: "50%", animationDelay: "3s" }} />
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setError(null);
              setLoading(true);
              setTimeout(() => {
                const saved = JSON.parse(localStorage.getItem("advice-history") || "[]");
                setAdviceData(saved);
                setLoading(false);
              }, 1000);
            }}
          >
            Retry
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
      <main>
        {/* Hero section */}
        <section className="hero" aria-label="Hero career journey overview">
          <FloatingCircle />
          <FloatingCircle style={{ left: "80%", top: "50%", animationDelay: "3s" }} />
          <h1>Your Career Journey Archive</h1>
          <p>
            Track your growth and insights over time. Use the controls below to
            search and explore your career advice.
          </p>
          <div
            className="trust-stats"
            role="list"
            aria-label="Career sessions statistics"
          >
            <div className="stat" role="listitem">
              <strong>{totalSessions}</strong>
              <small>Total Sessions</small>
            </div>
            <div className="stat" role="listitem">
              <strong>{lastMonthSessions}</strong>
              <small>This Month</small>
            </div>
            <div className="stat" role="listitem">
              <strong>{lastWeekSessions}</strong>
              <small>This Week</small>
            </div>
          </div>
        </section>

        {/* Controls */}
        <section
          aria-label="Search and view controls"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            padding: "20px",
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          <input
            type="search"
            className="form-input"
            placeholder="Search advice..."
            aria-label="Search advice"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flexGrow: 1 }}
          />
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setViewMode("cards")}
              className={`btn btn-secondary ${viewMode === "cards" ? "active" : ""}`}
              aria-pressed={viewMode === "cards"}
              aria-label="View as cards"
              type="button"
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`btn btn-secondary ${viewMode === "timeline" ? "active" : ""}`}
              aria-pressed={viewMode === "timeline"}
              aria-label="View as timeline"
              type="button"
            >
              Timeline
            </button>
          </div>
        </section>

        {/* Advice results */}
        {filteredAdvice.length === 0 ? (
          <div
            className="empty-state"
            role="region"
            aria-live="polite"
            aria-label="No results found"
            style={{ maxWidth: 900, margin: "40px auto" }}
          >
            No matching career advice found. Try adjusting your search.
          </div>
        ) : viewMode === "cards" ? (
          <section
            className="cards-container"
            role="list"
            aria-label="Career advice cards"
            style={{ maxWidth: 900, margin: "20px auto" }}
          >
            {filteredAdvice.map((advice) => (
              <AdviceCard
                key={advice.id}
                advice={advice}
                selected={selectedIds.includes(advice.id)}
                onSelect={toggleSelect}
                onOpenModal={openModal}
              />
            ))}
          </section>
        ) : (
          <section
            className="timeline"
            aria-label="Career advice timeline view"
            style={{ maxWidth: 900, margin: "20px auto" }}
          >
            {[...filteredAdvice]
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((advice) => (
                <TimelineItem key={advice.id} advice={advice} />
              ))}
          </section>
        )}
      </main>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={modalAdvice?.title}>
        {modalAdvice ? (
          <AdviceDetails advice={modalAdvice} />
        ) : (
          <div style={{ minHeight: 80, color: "var(--text-secondary)" }}>
            No advice detail available.
          </div>
        )}
      </Modal>
    </>
  );
}