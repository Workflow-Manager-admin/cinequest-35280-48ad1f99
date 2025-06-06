//
// CineQuest v1: "Film Detective" GAME (original simple version)
// Guess the movie from clues: blurred poster, actor, year.
// All lookup/filter and TMDB query logic is basic (no advanced language/region post-filtering).
//

import React, { useEffect, useRef, useState } from "react";
import BackButton from "../../components/BackButton";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import { fetchMoviesByRegion } from "../../tmdbApi";

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";
const MAX_ROUNDS = 18;

// PUBLIC_INTERFACE
function normalizeTitle(s) {
  return (s || "").toLowerCase().replace(/[^\w]+/g, "").trim();
}

export default function FilmDetective() {
  const [region, setRegion] = useState("US"); // "US" = Hollywood, "IN" = Kollywood
  const [question, setQuestion] = useState(null); // {movie, actor, year, poster}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);  // "correct"|"wrong"|null
  const [reveal, setReveal] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const answerInputRef = useRef();

  // Helper to get a random movie with poster, year, and actor name (very basic in v1)
  async function getMovie(region) {
    let tries = 0;
    while (tries < 8) {
      tries++;
      try {
        const res = await fetchMoviesByRegion(region, { page: 1 + Math.floor(Math.random() * 4) });
        if (!res.results || !res.results.length) continue;
        const filtered = res.results.filter(m => m.poster_path && m.title);
        if (!filtered.length) continue;
        const movie = filtered[Math.floor(Math.random() * filtered.length)];
        const year = (movie.release_date || "").slice(0, 4) || "????";
        const actorName = (movie.title || "").split(" ")[0] || "Unknown";
        if (movie && movie.poster_path && actorName && year) {
          return {
            movie,
            actor: actorName,
            year,
            poster: POSTER_BASE + movie.poster_path,
            movieTitle: movie.title
          };
        }
      } catch {}
    }
    throw new Error("Could not fetch movie");
  }

  function resetGame(section) {
    setRegion(section === "IN" ? "IN" : "US");
    setQuestion(null);
    setLoading(true);
    setError("");
    setAnswer("");
    setFeedback(null);
    setReveal(false);
    setRound(1);
    setScore(0);
    setFinished(false);
  }

  useEffect(() => {
    let cancelled = false;
    async function setup() {
      setLoading(true);
      setError("");
      setReveal(false);
      setFeedback(null);
      setAnswer("");
      try {
        const q = await getMovie(region);
        if (!cancelled) {
          setQuestion(q);
          setLoading(false);
          setTimeout(() => answerInputRef.current && answerInputRef.current.focus(), 100);
        }
      } catch (err) {
        setError("Error fetching movie. Try again.");
        setLoading(false);
      }
    }
    if (!finished) setup();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, [region, round, finished]);

  function checkAnswer() {
    if (!question) return false;
    return normalizeTitle(answer) === normalizeTitle(question.movieTitle);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!question || finished || feedback || loading) return;
    const correct = checkAnswer();
    setFeedback(correct ? "correct" : "wrong");
    setScore(s => correct ? s + 1 : s);
    setReveal(!correct);
    setTimeout(() => {
      if (round >= MAX_ROUNDS) {
        setFinished(true);
        setFeedback(null);
        setReveal(true);
      } else {
        setRound(r => r + 1);
        setFeedback(null);
        setAnswer("");
        setReveal(false);
      }
    }, correct ? 900 : 1400);
  }

  function handleReveal() {
    setReveal(true);
    setFeedback("skipped");
    setTimeout(() => {
      if (round >= MAX_ROUNDS) {
        setFinished(true);
        setFeedback(null);
      } else {
        setRound(r => r + 1);
        setFeedback(null);
        setAnswer("");
        setReveal(false);
      }
    }, 1100);
  }

  function handleReplay() {
    resetGame(region);
  }

  const styles = {
    container: {
      maxWidth: 400,
      margin: "40px auto 0",
      background: "#fff",
      borderRadius: 14,
      boxShadow: "0 4px 18px 0 rgba(151,60,170,.11)",
      padding: "28px 15px 32px",
      minHeight: 320,
      animation: "fadeInPop 0.5s"
    },
    btn: active => ({
      background: active ? "#973caa" : "#edeafa",
      color: active ? "#fff" : "#763195",
      fontWeight: active ? 700 : 600,
      border: active ? "2px solid #973caa" : "2px solid #edeafa",
      padding: "7px 15px",
      minWidth: 98,
      borderRadius: 6,
      cursor: active ? "default" : "pointer"
    }),
    viewer: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, margin: "24px 0 16px" },
    posterBlur: show =>
      show
        ? {
            width: 140,
            height: 190,
            objectFit: "cover",
            borderRadius: 13,
            filter: "blur(15px) brightness(1.06) grayscale(0.19)",
            boxShadow: "0 2.5px 12px 0 rgba(151,60,170,0.10)",
            margin: "0 auto"
          }
        : {
            width: 140,
            height: 190,
            objectFit: "cover",
            borderRadius: 13,
            filter: "none",
            boxShadow: "0 2.5px 12px 0 rgba(151,60,170,0.07)"
          },
    clue: {
      background: "#edeafa",
      color: "#481d77",
      fontWeight: 600,
      fontSize: "1rem",
      padding: "6px 11px",
      borderRadius: 8,
      letterSpacing: ".011em",
      margin: "7px 0"
    },
    form: { margin: "14px 0" },
    input: {
      width: 120,
      fontWeight: 590,
      fontSize: ".98rem",
      borderRadius: 6,
      padding: "8px 8px",
      border: "2px solid #e7e3f3"
    },
    feedback: flag => ({
      color: flag === "correct" ? "#24974e" : flag === "wrong" ? "#db3662" : "#c29817",
      fontWeight: 700,
      fontSize: "1.05rem",
      minHeight: 18,
      margin: "8px 0 0",
      textAlign: "center"
    }),
    revealBtn: {
      background: "#fffdfa",
      border: "1px dashed #c8b9db",
      color: "#973caa",
      padding: "5px 11px",
      borderRadius: 9,
      fontWeight: 700,
      fontSize: ".92rem",
      margin: "2px 0",
      cursor: "pointer"
    },
    score: {
      fontWeight: 700,
      color: "#973caa",
      fontSize: ".98rem",
      margin: "0 0 10px",
      letterSpacing: ".008em"
    }
  };

  const roundLabel = finished ? `Session Complete` : `Question ${round} of ${MAX_ROUNDS}`;

  return (
    <div className="game-container" style={styles.container}>
      <BackButton />
      <h2 className="title" style={{ color: "#973caa", margin: "0 0 12px" }}>Film Detective</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, marginTop: 2 }}>
        <button
          className="btn"
          style={styles.btn(region === "US")}
          onClick={() => resetGame("US")}
          disabled={region === "US" && !finished}
          type="button"
        >Hollywood</button>
        <button
          className="btn"
          style={styles.btn(region === "IN")}
          onClick={() => resetGame("IN")}
          disabled={region === "IN" && !finished}
          type="button"
        >Kollywood</button>
      </div>
      <div style={styles.score}>
        Score: {score} / {Math.max(round - (finished ? 0 : 1), 0)}
        &nbsp;&nbsp;{roundLabel}
      </div>
      {error && <ErrorToast message={error} />}
      {loading && (
        <div style={{ margin: "22px 0 12px", textAlign: "center" }}>
          <Loader size={30} />
        </div>
      )}
      {finished && (
        <div
          style={{
            background: "#edeafa",
            borderRadius: 11,
            padding: "28px 7px 18px",
            boxShadow: "0 1.2px 7px 0 rgba(151,60,170,0.09)",
            textAlign: "center",
            margin: "28px auto 13px",
            maxWidth: 280
          }}
          aria-label="Quiz End Score"
        >
          <div
            style={{
              fontSize: "1.18rem",
              fontWeight: 900,
              color: "#973caa",
              letterSpacing: ".012em",
              marginBottom: 4
            }}
          >
            🎬 All done!
          </div>
          <div style={{ fontWeight: 700, color: "#763195", fontSize: "1.07rem", margin: "12px 0" }}>
            Final Score: <span style={{ color: "#24974e" }}>{score}</span> / {MAX_ROUNDS}
          </div>
          <button className="btn btn-large" style={{ fontWeight: 700, marginBottom: 7, fontSize: ".98rem" }} onClick={handleReplay}>Play Again</button>
        </div>
      )}
      {!loading && question && !finished && (
        <div style={styles.viewer}>
          <div>
            {question.poster ? (
              <img
                src={question.poster}
                alt="Blurred movie poster"
                style={!reveal && !["correct", "wrong"].includes(feedback) ? styles.posterBlur(true) : styles.posterBlur(false)}
                aria-label="Movie Poster (blurred)"
              />
            ) : (
              <div style={{ ...styles.posterBlur(true), display: "flex", alignItems: "center", justifyContent: "center", color: "#c8b9db", fontSize: "1.7rem" }}>🎞️</div>
            )}
            {reveal && (
              <span style={{
                position: "absolute",
                top: 6,
                right: 7,
                background: "#973caa",
                color: "#fff",
                padding: "1.5px 5px",
                borderRadius: 7,
                fontWeight: 700,
                fontSize: ".91rem",
                boxShadow: "0 1.5px 7px 0 rgba(151,60,170,0.10)"
              }}>Reveal</span>
            )}
          </div>
          <div style={styles.clue}>
            <span style={{ color: "#763195" }}>Hero:</span> <span style={{ fontWeight: 700 }}>{question.actor}</span>
            {"  "} &bull; {"  "}
            <span style={{ color: "#c1961c" }}>Year:</span> <span style={{ fontWeight: 700 }}>{question.year}</span>
          </div>
          <form onSubmit={handleSubmit} style={styles.form} autoComplete="off">
            <input
              className="input"
              style={styles.input}
              ref={answerInputRef}
              disabled={!!feedback || !question || reveal}
              placeholder="Enter movie title"
              value={answer}
              onChange={e => { setAnswer(e.target.value); setFeedback(null); }}
              autoFocus
            />
            <button className="btn" type="submit" disabled={!!feedback || !answer.trim() || reveal} style={{ fontWeight: 700 }}>Submit</button>
            <button type="button" style={styles.revealBtn} onClick={handleReveal} disabled={reveal || !!feedback} aria-label="Reveal Answer">
              {!reveal ? "Reveal" : "Revealed"}
            </button>
          </form>
          {feedback && (
            <div style={styles.feedback(feedback)} aria-live="polite">
              {feedback === "correct" ? "🎉 Correct!" : feedback === "wrong" ? "❌ Wrong!" : feedback === "skipped" ? "⏭️ Revealed!" : null}
            </div>
          )}
          {reveal && (
            <div style={{
              background: "#edeafa",
              padding: "7px 9px",
              borderRadius: 7,
              color: "#481d77",
              fontWeight: 600,
              fontSize: ".94rem",
              textAlign: "center",
              marginTop: 4
            }}>
              <span style={{ color: "#973caa" }}>
                {question.movieTitle}
              </span>
            </div>
          )}
        </div>
      )}
      <div
        style={{
          marginTop: 10,
          color: "#a58cc2",
          fontSize: ".95rem",
          textAlign: "center"
        }}>
        Guess the movie by the blurred poster! Use reveal to see answer and skip.
      </div>
    </div>
  );
}
