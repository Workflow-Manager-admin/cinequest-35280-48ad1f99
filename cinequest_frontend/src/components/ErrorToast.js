import React from "react";

// PUBLIC_INTERFACE
// ErrorToast - simple error display (original version), strong background.
export default function ErrorToast({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        background: "#ffe8ee",
        color: "#aa1645",
        padding: "10px 17px",
        borderRadius: 8,
        margin: "7px 0",
        fontWeight: 600,
        textAlign: "center",
        border: "1.1px solid #d34b4b",
        fontSize: "1.01rem",
      }}
      aria-live="polite"
    >
      {message}
    </div>
  );
}
