import React from "react";

export default function GameCard({ name, description, onClick }) {
  return (
    <div
      className="game-card"
      onClick={onClick}
      style={{
        background: "#f9f9fb",
        color: "#151414",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgb(30,5,50,.07)",
        padding: "26px 17px",
        marginBottom: 14,
        cursor: "pointer",
        minWidth: 140,
        transition: "box-shadow .18s",
        border: "2px solid #eee"
      }}
      tabIndex={0}
      onKeyDown={e => (e.key === "Enter" ? onClick() : undefined)}
    >
      <div style={{ fontWeight: 600, fontSize: "1.18rem", color: "#973caa", marginBottom: 9 }}>{name}</div>
      <div style={{ fontSize: ".98rem", lineHeight: "1.3", color: "#151414" }}>{description}</div>
    </div>
  );
}
