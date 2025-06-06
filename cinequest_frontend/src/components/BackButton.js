// PUBLIC_INTERFACE
// Simple "Back" button, original CineQuest v1.
import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * BackButton - styled back arrow and label, uses useNavigate to go back.
 */
export default function BackButton({ label = "Back", style = {}, className = "", ...props }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={`btn subtle-pop ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        background: "#973caa",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: "1.07rem",
        padding: "9px 18px 9px 14px",
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(151,60,170,0.10)",
        outline: "none",
        margin: "0 0 17px 0",
        ...style,
      }}
      onClick={() => navigate(-1)}
      aria-label="Go back"
      {...props}
    >
      <span style={{ marginRight: 6, fontSize: "1.15em", display: "inline-block" }} aria-hidden="true">
        <svg height="1em" width="1em" viewBox="0 0 22 22" fill="none">
          <path
            d="M12.7 17.3a1 1 0 0 1 0-1.4L16.6 12H5a1 1 0 1 1 0-2h11.6l-3.9-3.9a1 1 0 0 1 1.4-1.4l5.7 5.7a1 1 0 0 1 0 1.4l-5.7 5.7a1 1 0 0 1-1.4 0z"
            fill="#fff"
            opacity="0.92"
          />
        </svg>
      </span>
      {label}
    </button>
  );
}
