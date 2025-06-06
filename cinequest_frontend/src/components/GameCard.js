// Simple Card for Game Dashboard (original CineQuest v1)
import React from "react";

/**
 * PUBLIC_INTERFACE
 * GameCard - simple styled clickable card for each game.
 */
export default function GameCard({ title, description, onClick }) {
  return (
    <div
      className="game-card"
      style={{
        background: "#f9f9fb",
        border: "2px solid #e7e3f3",
        borderRadius: 13,
        minWidth: 195,
        minHeight: 105,
        maxWidth: 260,
        margin: "10px",
        boxShadow: "0 1px 8px 0 rgba(151,60,170,0.07)",
        padding: "16px 12px",
        cursor: "pointer",
        transition: "box-shadow 0.17s",
        textAlign: "left"
      }}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`Play ${title}`}
    >
      <h3 style={{ color: "#973caa", fontSize: "1.12rem", margin: "0 0 7px" }}>{title}</h3>
      <div style={{ color: "#7b698a", fontSize: ".96rem" }}>{description}</div>
    </div>
  );
}
