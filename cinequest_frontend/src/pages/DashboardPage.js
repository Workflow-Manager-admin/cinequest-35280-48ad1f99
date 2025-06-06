import React from "react";
import { useNavigate } from "react-router-dom";
import GameCard from "../components/GameCard";
import Header from "../components/Header";

const GAMES = [
  {
    title: "Actor Combo Finder",
    description: "Find all movies two actors worked in together.",
    route: "/game/actor-combo",
  },
  {
    title: "Film Detective",
    description: "Given clues (actor, year), guess the movie.",
    route: "/game/film-detective",
  },
  {
    title: "Movie Dialogue Quiz",
    description: "Guess the movie from famous dialogues.",
    route: "/game/dialogue-quiz",
  },
  {
    title: "Movie Memory Trainer",
    description: "Recall details after seeing a movie image.",
    route: "/game/memory-trainer",
  },
  {
    title: "Movie IQ Challenge",
    description: "Guess the movie with director and year as clue.",
    route: "/game/iq-challenge",
  },
  {
    title: "Object-Based Movie Guess",
    description: "Guess the movie from props/objects.",
    route: "/game/object-movie-guess",
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ paddingTop: 38, paddingBottom: 32, minHeight: 530 }}>
      <Header />
      <h1 className="title" style={{ textAlign: "center", color: "#973caa" }}>CineQuest Dashboard</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center", marginTop: 18 }}>
        {GAMES.map((game) => (
          <GameCard
            key={game.route}
            title={game.title}
            description={game.description}
            onClick={() => navigate(game.route)}
          />
        ))}
      </div>
    </div>
  );
}
