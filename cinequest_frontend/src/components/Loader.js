import React from "react";

export default function Loader({ size = 24 }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: "3px solid #f3f3f3",
        borderTop: `3px solid #973caa`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        verticalAlign: "middle"
      }}
      aria-label="Loading spinner"
    />
  );
}

// CSS animation for original v1 loader (append only once)
if (typeof window !== "undefined" && !window.__cinequest_loader_css) {
  window.__cinequest_loader_css = true;
  const style = document.createElement("style");
  style.innerHTML = `
@keyframes spin {
  0% { transform:rotate(0deg);}
  100% { transform:rotate(360deg);}
}`;
  document.head.appendChild(style);
}
