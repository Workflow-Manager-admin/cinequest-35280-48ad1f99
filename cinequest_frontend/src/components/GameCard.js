import React from "react";

export default function GameCard({ name, description, onClick }) {
  // Card UI with modern lively polish
  const cardStyles = {
    background: "#fff",
    color: "#151414",
    borderRadius: 16,
    boxShadow: "var(--card-shadow)",
    padding: "24px 23px 18px",
    cursor: "pointer",
    minWidth: 170,
    minHeight: 92,
    margin: "0 0 0 0",
    position: "relative",
    transition: "box-shadow .2s, transform .16s",
    border: "1.2px solid #e7e3f3",
    animation: "fadeInPop 0.53s cubic-bezier(.41,.81,.52,1)",
    outline: "none"
  };
  const nameStyle = {
    fontWeight: 700,
    fontSize: "1.16rem",
    color: "#973caa",
    marginBottom: 7,
    letterSpacing: ".015em"
  };
  const descriptionStyle = {
    fontSize: ".99rem",
    color: "#454143",
    lineHeight: 1.33
  };
  const activeShadow = "var(--card-hover-shadow)";

  // State for hover effect
  const [isHovered, setHovered] = React.useState(false);

  return (
    <div
      className="game-card subtle-pop"
      onClick={onClick}
      style={{
        ...cardStyles,
        boxShadow: isHovered ? activeShadow : cardStyles.boxShadow,
        transform: isHovered ? "scale(1.04)" : "none",
        zIndex: isHovered ? 10 : 0
      }}
      tabIndex={0}
      onKeyDown={e => (e.key === "Enter" ? onClick() : undefined)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Game: ${name}`}
    >
      <div style={nameStyle}>{name}</div>
      <div style={descriptionStyle}>{description}</div>
      <span
        style={{
          position: "absolute",
          right: 23,
          top: 19,
          fontSize: "1.15rem",
          color: "#d3c1e6",
          opacity: isHovered ? 1 : 0.32,
          transition: "opacity .18s"
        }}
        aria-hidden="true"
      >🎥</span>
    </div>
  );
}
