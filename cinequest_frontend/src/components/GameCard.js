import React from "react";

/**
 * PUBLIC_INTERFACE
 * GameCard - versatile card for games or movies.
 * 
 * If 'movie' prop is true, renders as a TMDB-style MovieCard with poster, info and modern visuals.
 * Otherwise, fallback to original GameCard design.
 */
export default function GameCard({
  name,            // Game name (for game card)
  description,     // Game/moviedesc
  onClick,
  // MovieCard mode extra props:
  movie = false,
  poster,
  title,
  year,
}) {
  // Card UI - modern, lively
  const cardStyles = {
    background: "#fff",
    color: "#151414",
    borderRadius: 16,
    boxShadow: "var(--card-shadow)",
    padding: movie ? "13px 14px 8px" : "24px 23px 18px",
    cursor: "pointer",
    minWidth: movie ? 138 : 170,
    minHeight: movie ? 258 : 92,
    width: movie ? 150 : undefined,
    margin: "0 0 0 0",
    position: "relative",
    transition: "box-shadow .2s, transform .16s",
    border: "1.2px solid #e7e3f3",
    animation: "fadeInPop 0.53s cubic-bezier(.41,.81,.52,1)",
    outline: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    overflow: "hidden",
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
  const movieTitleStyle = {
    fontWeight: 700,
    fontSize: "1.08rem",
    color: "#481d77",
    margin: "6px 0 3px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  };
  const movieYearStyle = {
    color: "#973caa",
    fontWeight: 500,
    fontSize: ".97rem",
    marginLeft: 7,
  };
  const movieDescStyle = {
    fontSize: ".91rem",
    color: "#6d5b77",
    margin: "2px 0 0",
    lineHeight: 1.27,
    minHeight: 36,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical"
  };

  const activeShadow = "var(--card-hover-shadow)";
  // Card hover effect
  const [isHovered, setHovered] = React.useState(false);

  if (movie) {
    return (
      <div
        className="movie-card subtle-pop"
        onClick={onClick}
        onKeyDown={e => (e.key === "Enter" ? onClick() : undefined)}
        tabIndex={0}
        aria-label={`Movie: ${title || "Movie"}`}
        style={{
          ...cardStyles,
          boxShadow: isHovered ? activeShadow : cardStyles.boxShadow,
          transform: isHovered ? "scale(1.04)" : "none",
          zIndex: isHovered ? 10 : 0
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ width: "100%", flex: "0 0 auto" }}>
          {poster ? (
            <img
              src={poster}
              alt={title}
              style={{
                borderRadius: 8,
                width: "100%",
                height: 178,
                objectFit: "cover",
                boxShadow: "0 1.5px 6px 0 #e7e3f3",
                background: "#eee"
              }}
              loading="lazy"
            />
          ) : (
            <div
              style={{
                height: 178,
                background: "#e7e3f3",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#a899b6",
                fontSize: "2.22rem",
                fontWeight: "bold"
              }}
            >🎬</div>
          )}
        </div>
        <div style={{ flex: "1 1 auto", padding: "7px 2px 1px 1px", minHeight: 49 }}>
          <div style={movieTitleStyle}>
            {title || name}
            {year && <span style={movieYearStyle}>({year})</span>}
          </div>
          <div style={movieDescStyle}>{description}</div>
        </div>
        <span
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            fontSize: "1.27rem",
            color: "#d3c1e6",
            opacity: isHovered ? 1 : 0.32,
            transition: "opacity .18s"
          }}
          aria-hidden="true"
        >🎥</span>
      </div>
    );
  }

  // fallback: classic GameCard mode
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
