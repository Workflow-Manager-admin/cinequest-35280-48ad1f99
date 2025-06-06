import React from "react";

export default function ErrorToast({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        backgroundColor: "#ffe2e2",
        color: "#af1813",
        padding: "10px 18px",
        borderRadius: 6,
        margin: "8px 0",
        fontWeight: 500,
        textAlign: "center",
        border: "1px solid #af1813",
        fontSize: "1rem"
      }}
    >
      {message}
    </div>
  );
}
