// Simple Card for Game Dashboard (original version)
import React from "react";

export default function GameCard({ title, description, onClick }) {
  return (
    <div
      className="game-card"
      style={{
        background: "#f9f9fb",
        border: "2px solid #e7e3f3",
        borderRadius: 13,
        minWidth: 195,
        minHeight: 110,
        maxWidth: 260,
        margin: "10px",
        boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.07)",
        padding: "16px 12px",
        cursor: "pointer",
        transition: "box-shadow 0.19s",
        textAlign: "left"
      }}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`Play ${title}`}
    >
      <h3 style={{ color: "#973caa", fontSize: "1.15rem", margin: "0 0 6px" }}>{title}</h3>
      <div style={{ color: "#7b698a", fontSize: ".97rem" }}>{description}</div>
    </div>
  );
}
