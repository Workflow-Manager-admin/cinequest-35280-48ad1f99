import React from "react";

// Lively error toast for forms and feedback
export default function ErrorToast({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        background: "var(--error-bg)",
        color: "var(--error-text)",
        padding: "11px 20px",
        borderRadius: 9,
        margin: "8px 0",
        fontWeight: 600,
        textAlign: "center",
        border: "1.5px solid var(--error-text)",
        fontSize: "1.02rem",
        boxShadow: "0 2px 16px 0 rgba(198,42,88,0.06)"
      }}
      aria-live="polite"
      className="fade-in subtle-pop"
    >
      {message}
    </div>
  );
}
