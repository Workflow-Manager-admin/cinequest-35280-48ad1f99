import React from "react";
import GameCard from "../components/GameCard";
import { useNavigate } from "react-router-dom";

const games = [
  {
    id: "actor-combo",
    name: "Actor Combo Finder",
    section: "Hollywood",
    description: "Find all movies where two actors appeared together. No wrong guesses!",
  },
  {
    id: "film-detective",
    name: "Film Detective",
    section: "Hollywood",
    description: "Enter clues (actor, quote, year) and guess the movie.",
  },
  {
    id: "dialogue-quiz",
    name: "Movie Dialogue Quiz",
    section: "Hollywood",
    description: "Guess the movie from a famous quote.",
  },
  {
    id: "memory-trainer",
    name: "Movie Memory Trainer",
    section: "Kollywood",
    description: "Remember details from a quick glimpse of a movie still.",
  },
  {
    id: "iq-challenge",
    name: "Movie IQ Challenge",
    section: "Kollywood",
    description: "Timed trivia: given year and director, name the movie.",
  },
  {
    id: "object-movie-guess",
    name: "Object-Based Movie Guess",
    section: "Kollywood",
    description: "Identifiy the movie based on four object hints.",
  }
];

// Modern dashboard styles
const styles = {
  pageContainer: {
    maxWidth: 1084,
    margin: "0 auto",
    padding: "28px 10px 32px",
    animation: "fadeInPop 0.7s cubic-bezier(.41,.81,.52,1)",
  },
  columnsContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 36,
    margin: "32px 0 0",
    flexWrap: "wrap"
  },
  column: {
    flex: "1 1 320px",
    minWidth: 270,
    maxWidth: 440,
    background: "white",
    borderRadius: 22,
    padding: "32px 20px 30px",
    margin: "0 0 18px",
    boxShadow: "0 6px 36px 0 rgba(151,60,170,0.06)",
    border: "1.5px solid #edeafa",
    transition: "box-shadow 0.16s",
    animation: "fadeInPop 0.6s cubic-bezier(.41,.81,.52,1)",
  },
  sectionHeader: {
    fontSize: "1.43rem",
    fontWeight: 800,
    color: "#763195",
    margin: "0 0 18px 0",
    letterSpacing: ".016em"
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: 22
  },
  dashTitle: {
    margin: "22px 0 4px",
    color: "#973caa",
    fontWeight: 700,
    textShadow: "0 6px 28px rgba(151,60,170,0.07)"
  },
  brandBar: {
    display: "block",
    height: 5,
    background: "linear-gradient(92deg, #973caa, #f387c6 88%)",
    width: 82,
    borderRadius: 6,
    margin: "8px 0 28px 4px",
    opacity: .53,
  }
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const sectioned = {
    Hollywood: games.filter(g => g.section === "Hollywood"),
    Kollywood: games.filter(g => g.section === "Kollywood")
  };

  return (
    <div className="dashboard" style={styles.pageContainer}>
      <h1 className="title" style={styles.dashTitle}>
        CineQuest Dashboard
      </h1>
      <span style={styles.brandBar} />
      <div style={styles.columnsContainer} className="dashboard-columns-container">
        <section style={styles.column} className="dashboard-column">
          <h2 style={styles.sectionHeader}>Hollywood</h2>
          <div style={styles.cardList}>
            {sectioned.Hollywood.map(game => (
              <GameCard
                key={game.id}
                name={game.name}
                description={game.description}
                onClick={() => navigate(`/game/${game.id}`)}
              />
            ))}
          </div>
        </section>
        <section style={styles.column} className="dashboard-column">
          <h2 style={styles.sectionHeader}>Kollywood</h2>
          <div style={styles.cardList}>
            {sectioned.Kollywood.map(game => (
              <GameCard
                key={game.id}
                name={game.name}
                description={game.description}
                onClick={() => navigate(`/game/${game.id}`)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
