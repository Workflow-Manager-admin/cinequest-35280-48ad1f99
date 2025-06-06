import React from "react";

// Modern styled game splash page
export default function ActorComboFinder() {
  return (
    <div className="game-container" style={{
      maxWidth: 520, margin: "46px auto 0", background: "#fff",
      borderRadius: "22px", boxShadow: "0 6px 28px 0 rgba(151,60,170,.082)",
      padding: "38px 18px 32px", minHeight: 230, animation: "fadeInPop 0.5s"
    }}>
      <h2 className="title" style={{
        color: "#973caa", margin: "0 0 17px",
        textShadow: "0 2px 18px #973caa18"
      }}>Actor Combo Finder</h2>
      <p className="description" style={{
        fontSize: "1.16rem",
        color: "#573878",
        marginTop: 8,
        marginBottom: 0,
        letterSpacing: ".006em"
      }}>
        Enter two actors and find all movies they starred in together. <span style={{ color: "#f387c6", fontWeight: 600 }}>Game UI coming soon!</span>
      </p>
    </div>
  );
}
