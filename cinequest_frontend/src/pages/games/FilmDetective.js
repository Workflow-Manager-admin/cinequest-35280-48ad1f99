import React, { useEffect, useRef, useState } from "react";
import BackButton from "../../components/BackButton";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import {
  fetchMoviesByRegion,
  fetchMovieDetails,
  fetchMovieCredits
} from "../../tmdbApi";

/**
 * PUBLIC_INTERFACE
 * FilmDetective - Guess movies from blurred posters and clues.
 * - 18 rounds/session, Hollywood (English) or Kollywood (Tamil) per section.
 * - Each round: show blurred movie poster, hero (top-billed actor), release year.
 * - User types answer, Reveal/skips allowed, show correct/incorrect visual feedback.
 * - All movie/actor/poster data fetched dynamically from TMDB.
 * - Robust state handling and visual feedback.
 */

const MAX_ROUNDS = 18;
const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

function normalizeTitle(s) {
  // Lowercase, remove punctuation, excessive whitespace for forgiving answer check
  return (s || "")
    .toLowerCase()
    .replace(/[\W_]+/g, "")
    .trim();
}

export default function FilmDetective() {
  // "US" (Hollywood/English) vs. "IN" (Kollywood/Tamil) section selection
  const [region, setRegion] = useState("US");
  const [gameState, setGameState] = useState({
    loading: false,
    error: "",
    question: null,         // { movie, actor, year, poster }
    answer: "",
    feedback: null,         // "correct"|"wrong"|null
    reveal: false,
    round: 1,
    score: 0,
    finished: false,
    skipped: 0,
    usedMovieIds: []
  });
  const answerInputRef = useRef();

  // Loader for new round (private, robust to TMDB slowness/gaps)
  async function loadNextQuestion(prevState) {
    // Avoid replaying the same movie in a session
    let attempts = 0;
    let movie = null;
    let credits = null;
    let details = null;
    let actorName = "";
    let year = "";
    let movieLang = region === "US" ? "en" : "ta";

    while (attempts < 9 && (!movie || !movie.poster_path || !(movie.original_language === movieLang || movieLang === "en"))) {
      try {
        // Discover random movie, sorted by popularity, with poster
        const page = 1 + Math.floor(Math.random() * 4); // less common as round progresses
        const discover = await fetchMoviesByRegion(region, { page });
        if (!discover || !discover.results || !discover.results.length) {
          // Try next
          attempts++;
          continue;
        }
        let candidate = discover.results[
          Math.floor(Math.random() * discover.results.length)
        ];
        // Skip if no poster, title, or already played this one
        if (
          !candidate ||
          !candidate.poster_path ||
          !candidate.title ||
          prevState.usedMovieIds.includes(candidate.id)
        ) {
          attempts++;
          continue;
        }
        // Fetch details and credits for proper actor/year
        [details, credits] = await Promise.all([
          fetchMovieDetails(candidate.id, {
            language: region === "US" ? "en-US" : "ta-IN"
          }),
          fetchMovieCredits(candidate.id)
        ]);
        if (!details || !credits) {
          attempts++;
          continue;
        }
        // Extract release year & main actor if available
        year = (details.release_date || candidate.release_date || "").slice(0, 4);
        // Top-billed actor: first 'cast' person, or fallback to 2nd, or blank
        if (credits.cast && credits.cast.length) {
          actorName = credits.cast[0].name || "";
          // Ultra-rare: If the top-billed has a single Tamil name, fallback to next for Kollywood to avoid odd API picks
          if (
            region === "IN" &&
            actorName &&
            !actorName.includes(" ") &&
            credits.cast.length > 1
          ) {
            actorName += ` / ${credits.cast[1].name || ""}`;
          }
        } else {
          actorName = "";
        }
        // Accept only movies with a main actor and year, else retry
        if (actorName && year) {
          movie = candidate;
          break;
        }
      } catch {
        attempts++;
        continue;
      }
    }
    if (!movie) {
      throw new Error("Could not fetch a suitable movie for this round (try again)");
    }

    return {
      movie,
      actor: actorName,
      year,
      poster: movie.poster_path ? POSTER_BASE + movie.poster_path : null,
      movieTitle: movie.title,
      movieId: movie.id
    };
  }

  // Start/restart a fresh game
  function resetGame(section) {
    setRegion(section === "IN" ? "IN" : "US");
    setGameState({
      loading: true,
      error: "",
      question: null,
      answer: "",
      feedback: null,
      reveal: false,
      round: 1,
      score: 0,
      finished: false,
      skipped: 0,
      usedMovieIds: []
    });
  }

  // For each next/first round
  useEffect(() => {
    let cancelled = false;
    async function setupQuestion() {
      setGameState(g => ({ ...g, loading: true, error: "", reveal: false, feedback: null, answer: "" }));
      try {
        const q = await loadNextQuestion(gameState);
        if (!cancelled) {
          setGameState(g => ({
            ...g,
            loading: false,
            error: "",
            answer: "",
            reveal: false,
            feedback: null,
            question: q,
            usedMovieIds: [...(g.usedMovieIds || []), q.movieId]
          }));
          // Focus answer input on load
          setTimeout(() => answerInputRef.current && answerInputRef.current.focus(), 220);
        }
      } catch (err) {
        setGameState(g => ({
          ...g,
          loading: false,
          error: err.message || "Could not fetch movie. Try again?",
          question: null
        }));
      }
    }
    if (!gameState.finished) {
      setupQuestion();
    }
    // eslint-disable-next-line
    return () => { cancelled = true; };
    // Only reset on round/region change/start/replay
    // eslint-disable-next-line
  }, [region, gameState.round, gameState.finished]);

  // Check answer logic
  function checkAnswer() {
    if (!gameState.question) return false;
    const correct = gameState.question.movieTitle;
    // Accept title or original title, forgiving whitespace/punctuation/case
    return (
      normalizeTitle(gameState.answer) === normalizeTitle(correct) ||
      normalizeTitle(gameState.answer) === normalizeTitle(gameState.question.movie.original_title)
    );
  }

  // On answer submit
  function handleSubmit(e) {
    e.preventDefault();
    if (!gameState.question || gameState.finished || gameState.feedback || gameState.loading) return;

    const isCorrect = checkAnswer();
    setGameState(g => ({
      ...g,
      feedback: isCorrect ? "correct" : "wrong",
      score: isCorrect ? g.score + 1 : g.score,
      reveal: !isCorrect,
      skipped: g.skipped,
      finished: g.round >= MAX_ROUNDS,
    }));
    // After 700-1100ms show next, unless last round
    setTimeout(() => {
      if (gameState.round >= MAX_ROUNDS) {
        setGameState(g => ({ ...g, finished: true, feedback: null, reveal: true }));
      } else {
        setGameState(g => ({
          ...g,
          round: g.round + 1,
          feedback: null,
          answer: "",
          reveal: false,
        }));
      }
    }, isCorrect ? 900 : 1250);
  }

  // Reveal/skip button logic
  function handleReveal() {
    if (!gameState.question || gameState.reveal || gameState.finished) return;
    setGameState(g => ({
      ...g,
      reveal: true,
      feedback: "skipped",
      skipped: g.skipped + 1,
      finished: g.round >= MAX_ROUNDS
    }));
    setTimeout(() => {
      if (gameState.round >= MAX_ROUNDS) {
        setGameState(g => ({ ...g, finished: true, feedback: null, reveal: true }));
      } else {
        setGameState(g => ({
          ...g,
          round: g.round + 1,
          feedback: null,
          answer: "",
          reveal: false,
        }));
      }
    }, 1200);
  }

  // Start game or replay
  function handleReplay() {
    resetGame(region);
  }

  // UI styles
  const styles = {
    container: {
      maxWidth: 530,
      margin: "50px auto 0",
      background: "#fff",
      borderRadius: 22,
      boxShadow: "0 6px 28px 0 rgba(151,60,170,.08)",
      padding: "38px 18px 32px",
      minHeight: 350,
      animation: "fadeInPop 0.5s"
    },
    regionBar: {
      display: "flex",
      gap: 10,
      marginBottom: 15,
      marginTop: 2
    },
    btn: isActive => ({
      background: isActive ? "#973caa" : "#edeafa",
      color: isActive ? "#fff" : "#763195",
      fontWeight: isActive ? 700 : 600,
      border: isActive ? "2px solid #973caa" : "2px solid #edeafa",
      padding: "8px 16px",
      minWidth: 110,
      borderRadius: 6,
      cursor: isActive ? "default" : "pointer"
    }),
    viewer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 18,
      margin: "24px 0 16px"
    },
    posterBlur: show =>
      show
        ? {
            width: 170,
            height: 250,
            objectFit: "cover",
            borderRadius: 17,
            filter: "blur(17px) brightness(1.06) grayscale(0.23)",
            boxShadow: "0 4px 17px 0 rgba(151,60,170,0.09)",
            margin: "0 auto 0"
          }
        : {
            width: 170,
            height: 250,
            objectFit: "cover",
            borderRadius: 17,
            filter: "none",
            boxShadow: "0 4px 17px 0 rgba(151,60,170,0.07)"
          },
    clue: {
      background: "#edeafa",
      color: "#481d77",
      fontWeight: 650,
      fontSize: "1.09rem",
      padding: "8px 17px",
      borderRadius: 11,
      letterSpacing: ".011em",
      margin: "7px 0"
    },
    form: {
      display: "flex",
      flexDirection: "row",
      gap: 13,
      margin: "14px 0 7px"
    },
    input: {
      width: 170,
      fontWeight: 590,
      fontSize: "1.09rem",
      borderRadius: 7,
      padding: "10px 12px",
      border: "2px solid #e7e3f3"
    },
    feedback: flag => ({
      color:
        flag === "correct"
          ? "#24974e"
          : flag === "wrong"
          ? "#db3662"
          : flag === "skipped"
          ? "#c29817"
          : "#666",
      fontWeight: 700,
      fontSize: "1.11rem",
      minHeight: 26,
      margin: "8px 0 2px",
      textAlign: "center"
    }),
    revealBtn: {
      background: "#fffdfa",
      border: "1.5px dashed #c8b9db",
      color: "#973caa",
      padding: "7px 13px",
      borderRadius: 12,
      fontWeight: 700,
      fontSize: ".97rem",
      margin: "4px 0",
      cursor: "pointer",
      textDecoration: "underline"
    },
    score: {
      fontWeight: 700,
      color: "#973caa",
      fontSize: "1.05rem",
      margin: "0 0 10px",
      letterSpacing: ".009em"
    }
  };

  // Helper for plural
  const roundLabel =
    gameState.finished || gameState.round > MAX_ROUNDS
      ? `Session Complete`
      : `Question ${gameState.round} of ${MAX_ROUNDS}`;

  // Main render
  return (
    <div className="game-container" style={styles.container}>
      <BackButton />
      <h2 className="title" style={{ color: "#973caa", margin: "0 0 12px" }}>
        Film Detective
      </h2>
      {/* Section switcher */}
      <div style={styles.regionBar}>
        <button
          className="btn"
          style={styles.btn(region === "US")}
          onClick={() => resetGame("US")}
          disabled={region === "US" && !gameState.finished}
          type="button"
        >
          Hollywood
        </button>
        <button
          className="btn"
          style={styles.btn(region === "IN")}
          onClick={() => resetGame("IN")}
          disabled={region === "IN" && !gameState.finished}
          type="button"
        >
          Kollywood
        </button>
      </div>
      <div style={styles.score} aria-live="polite">
        Score: {gameState.score} / {Math.max(gameState.round - (gameState.finished ? 0 : 1), 0)}
        &nbsp;&nbsp;{roundLabel}
      </div>
      {gameState.error && <ErrorToast message={gameState.error} />}
      {gameState.loading && (
        <div style={{ margin: "26px 0 22px", textAlign: "center" }}>
          <Loader size={34} />
        </div>
      )}
      {/* Game Complete screen */}
      {gameState.finished && (
        <div
          style={{
            background: "#edeafa",
            borderRadius: 15,
            padding: "36px 11px 28px",
            boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.095)",
            textAlign: "center",
            margin: "36px auto 17px",
            maxWidth: 390,
            animation: "fadeInPop 0.51s cubic-bezier(.41,.81,.52,1)",
          }}
          className="subtle-pop"
          aria-label="Quiz End Score"
        >
          <div
            style={{
              fontSize: "1.48rem",
              fontWeight: 900,
              color: "#973caa",
              letterSpacing: ".012em",
              marginBottom: 5,
            }}
          >
            🎬 All rounds done!
          </div>
          <div style={{ fontWeight: 700, color: "#763195", fontSize: "1.19rem", margin: "13px 0" }}>
            Final Score: <span style={{ color: "#24974e" }}>{gameState.score}</span> / {MAX_ROUNDS}
          </div>
          <div style={{ margin: "10px 0 18px", color: "#8e83a2", fontSize: ".99rem" }}>
            {gameState.score === MAX_ROUNDS
              ? "Detective-level expertise! 🔍"
              : gameState.score >= 13
              ? "Impressive eye for movies!"
              : gameState.score >= 7
              ? "Solid effort – train your cinematic skills!"
              : "Try again to crack more clues."}
          </div>
          <button
            className="btn btn-large"
            style={{ fontWeight: 700, marginBottom: 7, fontSize: "1.13rem" }}
            onClick={handleReplay}
          >
            Play Again
          </button>
        </div>
      )}
      {/* Active round */}
      {!gameState.loading && gameState.question && !gameState.finished && (
        <div style={styles.viewer}>
          {/* Poster, blurred or clear depending on reveal/feedback */}
          <div style={{ position: "relative" }}>
            {gameState.question.poster ? (
              <img
                src={gameState.question.poster}
                alt="Blurred movie poster clue"
                style={
                  !gameState.reveal && !["correct", "wrong"].includes(gameState.feedback)
                    ? styles.posterBlur(true)
                    : styles.posterBlur(false)
                }
                aria-label="Movie Poster (blurred)"
              />
            ) : (
              <div
                style={{
                  ...styles.posterBlur(true),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c8b9db",
                  fontSize: "2.1rem"
                }}
                aria-label="No Movie Poster"
              >
                🎞️
              </div>
            )}
            {/* reveal badge */}
            {gameState.reveal && (
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  right: 13,
                  background: "#973caa",
                  color: "#fff",
                  padding: "2.5px 7px",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: ".97rem",
                  boxShadow: "0 2px 10px 0 rgba(151,60,170,0.10)"
                }}
              >
                Reveal
              </span>
            )}
          </div>
          {/* Clue: Hero/actor, year */}
          <div style={styles.clue}>
            <span style={{ color: "#763195" }}>Hero:</span>{" "}
            <span style={{ fontWeight: 780 }}>{gameState.question.actor}</span>
            {"  "} &bull; {"  "}
            <span style={{ color: "#c1961c" }}>Year:</span>{" "}
            <span style={{ fontWeight: 780 }}>{gameState.question.year}</span>
          </div>
          {/* Answer form */}
          <form onSubmit={handleSubmit} style={styles.form} autoComplete="off">
            <input
              className="input"
              style={styles.input}
              ref={answerInputRef}
              disabled={
                !!gameState.feedback || !gameState.question || gameState.reveal
              }
              placeholder="Enter movie title"
              aria-label="Type your answer"
              value={gameState.answer}
              onChange={e =>
                setGameState(g => ({
                  ...g,
                  answer: e.target.value,
                  feedback: null
                }))
              }
              autoFocus
            />
            <button
              className="btn"
              type="submit"
              disabled={
                !!gameState.feedback ||
                !gameState.answer.trim() ||
                gameState.reveal
              }
              style={{ padding: "10px 19px", fontWeight: 700 }}
            >
              {gameState.feedback === "correct"
                ? "✓"
                : gameState.feedback === "wrong"
                ? "✗"
                : "Submit"}
            </button>
            <button
              type="button"
              style={styles.revealBtn}
              onClick={handleReveal}
              disabled={gameState.reveal || !!gameState.feedback}
              aria-label="Reveal Answer"
            >
              {!gameState.reveal ? "Reveal Answer" : "Revealed"}
            </button>
          </form>
          {/* Feedback & correct answer */}
          {(gameState.feedback || gameState.reveal) && (
            <div style={styles.feedback(gameState.feedback)} aria-live="polite">
              {gameState.feedback === "correct"
                ? "🎉 Correct!"
                : gameState.feedback === "wrong"
                ? `❌ Wrong! The answer was: ${gameState.question.movieTitle}`
                : gameState.feedback === "skipped"
                ? `⏭️ Revealed! The answer was: ${gameState.question.movieTitle}`
                : null}
            </div>
          )}
        </div>
      )}
      {/* Session stats and instructions */}
      <div
        style={{
          marginTop: 14,
          color: "#a58cc2",
          fontSize: ".97rem",
          textAlign: "center"
        }}
      >
        Guess the movie by its blurred poster! Clues: hero/top-billed actor and release year.
        Need help? Use "Reveal Answer" to skip to the next round (max 18).
      </div>
    </div>
  );
}
