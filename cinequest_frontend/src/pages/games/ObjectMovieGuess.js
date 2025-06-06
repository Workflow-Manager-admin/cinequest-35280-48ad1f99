import React, { useEffect, useState } from "react";
import { getObjectGuessRound } from "../../tmdbGameUtils";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import GameCard from "../../components/GameCard";

/**
 * PUBLIC_INTERFACE
 * ObjectMovieGuess - Guess the movie from four TMDB-powered object clues (drawn from genres/keywords/cast/title).
 * - Fetches a random movie using TMDB.
 * - Picks four "object" clues (genre names, cast members, keywords, title words, etc.).
 * - User guesses the title.
 */
export default function ObjectMovieGuess() {
  // State hooks
  const [region, setRegion] = useState("US"); // "US" (Hollywood) | "IN" (Kollywood)
  const [round, setRound] = useState(null); // { movie, objects }
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [hintReveal, setHintReveal] = useState(false);

  // Fetch a new round (movie + object clues)
  const loadRound = async () => {
    setLoading(true);
    setErrMsg("");
    setFeedback("");
    setAnswered(false);
    setInput("");
    setHintReveal(false);
    try {
      const res = await getObjectGuessRound(region);
      if (!res || !res.movie || !res.objects || res.objects.length < 2) {
        setErrMsg("Couldn't fetch enough clues—try again?");
        setLoading(false);
        setRound(null);
        return;
      }
      setRound(res);
    } catch (err) {
      setErrMsg("Failed to fetch a movie round. Try again?");
      setRound(null);
    }
    setLoading(false);
  };

  // Load new round on mount and region switch
  useEffect(() => {
    loadRound();
    // eslint-disable-next-line
  }, [region]);

  // Handle user's guess
  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setPlayed(p => p + 1);
    setAnswered(true);
    // Accept answer if the guess matches the movie title, ignoring punctuation/case
    const normalize = s =>
      (s || "")
        .toLowerCase()
        .replace(/[\W_]+/g, "")
        .trim();
    const correct =
      normalize(input) === normalize(round.movie.title) ||
      normalize(input) === normalize(round.movie.original_title);
    if (correct) {
      setFeedback("🎉 Correct!");
      setScore(s => s + 1);
    } else {
      setFeedback(
        <span>
          ❌ Wrong! The answer was: <span style={{ color: "#973caa" }}>{round.movie.title}</span>
        </span>
      );
    }
    // After feedback, auto-advance to next round
    setTimeout(() => {
      loadRound();
    }, correct ? 1600 : 2100);
  }

  // UI styles
  const styles = {
    container: {
      maxWidth: 530,
      margin: "46px auto 0",
      background: "#fff",
      borderRadius: 22,
      boxShadow: "0 6px 28px 0 rgba(151,60,170,.09)",
      padding: "38px 18px 32px",
      minHeight: 330,
      animation: "fadeInPop 0.56s cubic-bezier(.41,.81,.52,1)",
    },
    regionBar: {
      display: "flex",
      gap: 13,
      marginBottom: 12,
      marginTop: 2,
    },
    btn: isActive => ({
      background: isActive ? "#973caa" : "#edeafa",
      color: isActive ? "#fff" : "#763195",
      fontWeight: isActive ? 700 : 600,
      border: isActive ? "2px solid #973caa" : "2px solid #edeafa",
      padding: "8px 16px",
      minWidth: 108,
      borderRadius: 7,
      cursor: isActive ? "default" : "pointer",
    }),
    cluesGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18,
      margin: "18px 0 10px 0",
      justifyContent: "center",
    },
    clueBox: {
      background: "#edeafa",
      borderRadius: 13,
      textAlign: "center",
      fontSize: "1.15rem",
      fontWeight: 700,
      color: "#481d77",
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.09)",
      padding: "20px 12px",
      letterSpacing: ".011em",
      minHeight: 54,
      userSelect: "none",
    },
    form: {
      display: "flex",
      flexDirection: "row",
      gap: 12,
      margin: "15px 0",
      alignItems: "center",
    },
    score: {
      fontWeight: 700,
      color: "#973caa",
      fontSize: "1.07rem",
      margin: "0 0 12px",
      letterSpacing: ".009em",
    },
    revealBtn: {
      background: "#fffdfa",
      border: "1.6px dashed #c8b9db",
      color: "#973caa",
      padding: "7px 13px",
      borderRadius: 12,
      fontWeight: 700,
      fontSize: ".97rem",
      margin: "6px 0",
      cursor: "pointer",
      textDecoration: "underline",
    },
    posterThumb: {
      display: "block",
      width: 92,
      height: 138,
      borderRadius: 13,
      margin: "0 auto 0",
      background: "#e7e3f3",
      objectFit: "cover",
      boxShadow: "0 1.2px 8px 0 rgba(151,60,170,0.09)",
    },
    feedback: isRight => ({
      color: isRight ? "#24974e" : "#db3662",
      fontWeight: 700,
      fontSize: "1.11rem",
      textAlign: "center",
      minHeight: 28,
      letterSpacing: ".006em",
      marginTop: 9,
      marginBottom: 2,
      animation: "subtlePop 380ms cubic-bezier(.48,1.2,.64,1.05) 0.09s 1 both",
    }),
    hintText: {
      marginTop: 15,
      marginBottom: 8,
      color: "#a58cc2",
      fontSize: ".99rem",
      fontStyle: "italic",
      textAlign: "center",
    },
  };

  const posterBase = "https://image.tmdb.org/t/p/w185";

  return (
    <div className="game-container" style={styles.container}>
      <h2 className="title" style={{ color: "#973caa", margin: "0 0 14px" }}>
        Object-Based Movie Guess
      </h2>
      <div style={styles.regionBar}>
        <button
          className="btn"
          style={styles.btn(region === "US")}
          onClick={() => { setRegion("US"); setScore(0); setPlayed(0); }}
          disabled={region === "US"}
          type="button"
        >
          Hollywood
        </button>
        <button
          className="btn"
          style={styles.btn(region === "IN")}
          onClick={() => { setRegion("IN"); setScore(0); setPlayed(0); }}
          disabled={region === "IN"}
          type="button"
        >
          Kollywood
        </button>
      </div>
      <div style={styles.score}>Score: {score} / {played}</div>
      {errMsg && <ErrorToast message={errMsg} />}
      {loading && (
        <div style={{ margin: "26px 0 22px", textAlign: "center" }}>
          <Loader size={34} />
        </div>
      )}
      {!loading && round && (
        <>
          {/* Clues Grid */}
          <div style={styles.cluesGrid}>
            {round.objects.map((obj, idx) => (
              <div key={idx} style={styles.clueBox}>
                {obj}
              </div>
            ))}
          </div>
          <form style={styles.form} onSubmit={handleSubmit} autoComplete="off">
            <input
              className="input"
              placeholder="Enter movie title"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={answered}
              autoFocus
              style={{ width: 198, fontWeight: 590, fontSize: "1.09rem" }}
              aria-label="Your guess"
            />
            <button
              className="btn"
              type="submit"
              disabled={answered}
              style={{ padding: "10px 19px", fontWeight: 700 }}
            >
              {answered ? "✓" : "Submit"}
            </button>
            <button
              type="button"
              style={styles.revealBtn}
              onClick={() => setHintReveal(v => !v)}
              disabled={answered && hintReveal}
              tabIndex={-1}
              aria-label="Toggle More Hint"
            >
              {hintReveal ? "Hide Poster" : "Show Movie Poster"}
            </button>
          </form>
          {/* Show poster as additional hint */}
          {hintReveal && (
            <div style={{ margin: "6px 0 0", textAlign: "center" }}>
              {round.movie.poster_path ? (
                <img
                  src={posterBase + round.movie.poster_path}
                  alt="Poster hint"
                  style={styles.posterThumb}
                />
              ) : (
                <div
                  style={{
                    ...styles.posterThumb,
                    color: "#c8b9db",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.8rem",
                  }}
                >
                  🎬
                </div>
              )}
            </div>
          )}
          {/* Feedback */}
          {feedback && (
            <div style={styles.feedback(feedback.startsWith("🎉"))}>
              {feedback}
            </div>
          )}
          {/* Movie/Year Reveal after answer */}
          {answered && (
            <div
              style={{
                marginTop: 10,
                background: "#edeafa",
                padding: "10px 13px",
                borderRadius: 13,
                color: "#481d77",
                fontWeight: 600,
                boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.06)",
                fontSize: ".98rem",
                textAlign: "center",
              }}
            >
              <span style={{ color: "#973caa" }}>{round.movie.title}</span>{" "}
              {round.movie.release_date ? `(${round.movie.release_date.slice(0, 4)})` : ""}
            </div>
          )}
        </>
      )}
      {!loading && !round && !errMsg && (
        <div style={{ margin: "20px 0", color: "#c75e77" }}>
          Oops, unable to load a round.{" "}
          <button className="btn" onClick={loadRound}>
            Retry
          </button>
        </div>
      )}
      {/* Instructions */}
      <div style={styles.hintText}>
        Guess the movie based on four object clues: genres, co-stars, and more! Not sure? Reveal the poster for help.
      </div>
    </div>
  );
}
