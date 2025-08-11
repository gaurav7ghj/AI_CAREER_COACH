// src/components/Spinner.jsx
import React from "react";

export default function Spinner() {
  return (
    <div
      className="spinner"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="ring" />
      <div className="ring" />
      <div className="ring" />
      <div className="ring" />
      <style jsx>{`
        .spinner {
          position: relative;
          width: 40px;
          height: 40px;
        }
        .ring {
          box-sizing: border-box;
          display: block;
          position: absolute;
          width: 32px;
          height: 32px;
          margin: 4px;
          border: 4px solid #6366f1;
          border-radius: 50%;
          animation: ring-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          border-color: #6366f1 transparent transparent transparent;
        }
        .ring:nth-child(1) {
          animation-delay: -0.45s;
        }
        .ring:nth-child(2) {
          animation-delay: -0.3s;
        }
        .ring:nth-child(3) {
          animation-delay: -0.15s;
        }
        @keyframes ring-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
