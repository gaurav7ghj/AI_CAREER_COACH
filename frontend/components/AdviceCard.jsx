// src/components/AdviceCard.jsx
import React from "react";

export default function AdviceCard({ advice, selected, onSelect, onOpen }) {
  const truncatedSummary =
    advice.summary?.length > 120 ? advice.summary.slice(0, 117) + "..." : advice.summary || "No summary available";

  return (
    <article
      className="card cursor-pointer rounded-lg shadow-md p-4 bg-white dark:bg-gray-800 hover:shadow-lg focus:ring-2 focus:ring-indigo-500"
      tabIndex={0}
      role="button"
      aria-pressed={selected}
      aria-label={`Advice card titled ${advice.title}`}
      onClick={() => onOpen(advice)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(advice);
        }
      }}
    >
      <header className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {advice.title || "Career Advice"}
        </h3>
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
      </header>
      <p className="text-gray-700 dark:text-gray-300">{truncatedSummary}</p>
      <footer className="mt-3 flex flex-wrap gap-2">
        {advice.skills?.length > 0 && (
          <span className="tag bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
            💼 {advice.skills.join(", ")}
          </span>
        )}
        {advice.interests?.length > 0 && (
          <span className="tag bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
            💡 {advice.interests.join(", ")}
          </span>
        )}
        {advice.aiGuidance && (
          <span className="tag bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
            🎯 AI Guidance
          </span>
        )}
      </footer>
    </article>
  );
}
