import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * BackButton - stylish back button for navigation.
 * Uses React Router's navigation (useNavigate) to go back in history.
 * Styles and icon match CineQuest's modern UI.
 */
export default function BackButton({ label = "Back", style = {}, className = "", ...props }) {
  const navigate = useNavigate();

  const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(92deg,#973caa,#c056d4 88%)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: "1.08rem",
    padding: "10px 23px 10px 17px",
    cursor: "pointer",
    boxShadow: "0 0.5px 2px rgba(151,60,170,0.11)",
    transition: "background 0.16s, box-shadow 0.18s, transform 0.12s",
    outline: "none",
    margin: "0 0 22px 0",
    ...style,
  };

  const iconStyle = {
    display: "inline-block",
    marginRight: 9,
    fontSize: "1.26em",
    color: "#fff",
    verticalAlign: "middle",
    transition: "color 0.17s",
  };

  return (
    <button
      type="button"
      className={`btn subtle-pop ${className}`}
      style={buttonStyle}
      onClick={() => navigate(-1)}
      aria-label="Go back"
      {...props}
    >
      <span style={iconStyle} aria-hidden="true">
        <svg height="1.15em" width="1.15em" viewBox="0 0 22 22" fill="none">
          <path
            d="M12.7 17.3a1 1 0 0 1 0-1.4L16.6 12H5a1 1 0 1 1 0-2h11.6l-3.9-3.9a1 1 0 0 1 1.4-1.4l5.7 5.7a1 1 0 0 1 0 1.4l-5.7 5.7a1 1 0 0 1-1.4 0z"
            fill="#fff"
            opacity="0.94"
          />
        </svg>
      </span>
      {label}
    </button>
  );
}
