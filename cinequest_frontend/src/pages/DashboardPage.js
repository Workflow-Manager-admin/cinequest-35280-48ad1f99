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

export default function DashboardPage() {
  const navigate = useNavigate();
  const sectioned = {
    Hollywood: games.filter(g => g.section === "Hollywood"),
    Kollywood: games.filter(g => g.section === "Kollywood")
  };

  return (
    <div className="dashboard">
      <h1 className="title" style={{ margin: "32px 0 10px", color: "#973caa" }}>CineQuest Dashboard</h1>
      <div className="dashboard-columns-container">
        <section className="dashboard-column">
          <h2 style={{ color: "#151414" }}>Hollywood</h2>
          <div className="card-list">
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
        <section className="dashboard-column">
          <h2 style={{ color: "#151414" }}>Kollywood</h2>
          <div className="card-list">
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
