import React, { useEffect, useState } from "react";
import GameCard from "../components/GameCard";
import { useNavigate } from "react-router-dom";
import { fetchMoviesByRegion } from "../tmdbApi";

// Static game cards as before
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

// Modern dashboard styles (unchanged)
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
  movieRow: {
    marginTop: 16,
    marginLeft: -6,
    marginBottom: 6,
    display: "flex",
    flexDirection: "row",
    gap: 14,
    overflowX: "auto",
    paddingBottom: 3,
    scrollbarWidth: "thin"
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
  },
  movieTitle: {
    fontWeight: 700,
    fontSize: "1.04rem"
  }
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [hollywoodMovies, setHollywoodMovies] = useState([]);
  const [kollywoodMovies, setKollywoodMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const sectioned = {
    Hollywood: games.filter(g => g.section === "Hollywood"),
    Kollywood: games.filter(g => g.section === "Kollywood")
  };

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setErrMsg("");
    Promise.all([
      fetchMoviesByRegion("US", { page: 1 }),
      fetchMoviesByRegion("IN", { page: 1 })
    ])
      .then(([us, ind]) => {
        if (!isActive) return;
        setHollywoodMovies(us.results || []);
        setKollywoodMovies(ind.results || []);
      })
      .catch((err) => {
        if (!isActive) return;
        setErrMsg("Unable to fetch movies. Please try again.");
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  // MovieCard renderer
  function renderMovies(movies, region) {
    const posterBase = "https://image.tmdb.org/t/p/w342";
    return (
      <div style={styles.movieRow}>
        {movies.slice(0, 8).map((movie) => (
          <GameCard
            key={movie.id}
            movie
            poster={movie.poster_path ? posterBase + movie.poster_path : null}
            title={movie.title}
            year={movie.release_date ? String(movie.release_date).slice(0, 4) : ""}
            description={movie.overview}
            onClick={() => window.open(`https://www.themoviedb.org/movie/${movie.id}`, "_blank")}
          />
        ))}
      </div>
    );
  }

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
            {sectioned.Hollywood.map((game) => (
              <GameCard
                key={game.id}
                name={game.name}
                description={game.description}
                onClick={() => navigate(`/game/${game.id}`)}
              />
            ))}
          </div>
          <h3 style={{ ...styles.sectionHeader, fontSize: "1.07rem", color: "#973caa", marginTop: 28, marginBottom: 7, letterSpacing: ".008em", opacity: 0.95 }}>Now Trending</h3>
          {loading ? (
            <div style={{ margin: "22px 0 12px", color: "#a58cc2", fontWeight: 600 }}>Loading movies...</div>
          ) : errMsg ? (
            <div style={{ color: "#c75e77", margin: "10px 0" }}>{errMsg}</div>
          ) : (
            renderMovies(hollywoodMovies, "US")
          )}
        </section>
        <section style={styles.column} className="dashboard-column">
          <h2 style={styles.sectionHeader}>Kollywood</h2>
          <div style={styles.cardList}>
            {sectioned.Kollywood.map((game) => (
              <GameCard
                key={game.id}
                name={game.name}
                description={game.description}
                onClick={() => navigate(`/game/${game.id}`)}
              />
            ))}
          </div>
          <h3 style={{ ...styles.sectionHeader, fontSize: "1.07rem", color: "#973caa", marginTop: 28, marginBottom: 7, letterSpacing: ".008em", opacity: 0.95 }}>Kollywood Picks</h3>
          {loading ? (
            <div style={{ margin: "22px 0 12px", color: "#a58cc2", fontWeight: 600 }}>Loading movies...</div>
          ) : errMsg ? (
            <div style={{ color: "#c75e77", margin: "10px 0" }}>{errMsg}</div>
          ) : (
            renderMovies(kollywoodMovies, "IN")
          )}
        </section>
      </div>
    </div>
  );
}
