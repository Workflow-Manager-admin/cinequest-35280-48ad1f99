import React, { useEffect, useState, useRef } from "react";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import { getMemoryTrainerRound } from "../../tmdbGameUtils";
import BackButton from "../../components/BackButton";

// PUBLIC_INTERFACE
// Movie Memory Trainer – User sees a movie still for 5 seconds, then must answer a challenging recall question (no immediate answer reveal, never just 'year', genre-based questions disabled, answer only revealed on button click, and such rounds do not count for score).

const TIMER_DISPLAY = 5; // seconds to show image before quiz

/**
 * Helper: select a challenging recall question (e.g. actor, director, or plot).
 * Ensures NO genre-based questions, NO easy/repetitive "release year" questions, prefers "who starred", "who directed", etc.
 * Never reveals answer until user actively requests it.
 */
function extractChallengingQuestion(round) {
  // Prefer: main actor, director, tagline (NEVER genre or just year)
  if (!round || !round.movie) return null;
  const movie = round.movie;
  // Use director if present
  if (
    round.recallType === "director" &&
    round.answer &&
    round.answer.split(",").join("").trim()
  ) {
    return {
      recallQ: "Who is the director of this movie?",
      answer: round.answer,
      recallType: "director",
      placeholder: "Enter director's name",
    };
  }
  // DISABLE genre-based questions entirely!
  // Use main actor if available
  if (movie.credits && movie.credits.cast && movie.credits.cast.length > 0) {
    return {
      recallQ: "Who plays a starring role in this movie?",
      answer: movie.credits.cast[0].name,
      recallType: "actor",
      placeholder: "Enter actor name",
    };
  }
  // Fallback: director/year (but not genre)
  if (
    round.recallType === "year" &&
    round.answer &&
    round.answer.trim()
  ) {
    return {
      recallQ: "What is the exact release year of this movie?",
      answer: round.answer,
      recallType: "year",
      placeholder: "Enter year (e.g. 2001)",
    };
  }
  // Fallback: generic
  return {
    recallQ: "Recall a key detail from the image you just saw.",
    answer: round.answer,
    recallType: "general",
    placeholder: "Type your answer",
  };
}

export default function MemoryTrainer() {
  const MAX_ROUNDS = 18;
  const [region, setRegion] = useState("US");
  const [round, setRound] = useState(null);
  const [showImage, setShowImage] = useState(false);
  const [timer, setTimer] = useState(TIMER_DISPLAY);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [answered, setAnswered] = useState(false);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [recallMeta, setRecallMeta] = useState(null);
  const [showScore, setShowScore] = useState(false);
  // Track revealed/skipped round (for Reveal Answer)
  const [revealed, setRevealed] = useState(false);

  const timerRef = useRef();

  // Helper to reset all gameplay state for replay/region switch
  function resetGameState(nextRegion = region) {
    setScore(0);
    setPlayed(0);
    setShowScore(false);
    setErrMsg("");
    setRecallMeta(null);
    setAnswered(false);
    setInput("");
    setFeedback("");
    setTimer(TIMER_DISPLAY);
    setShowImage(false);
    setRound(null);
    setLoading(false);
    setRevealed(false);
    if (nextRegion === region) {
      loadRound(nextRegion, true);
    }
  }

  // Load a new round unless max rounds reached or showScore is active
  async function loadRound(targetRegion = region, force = false) {
    if (showScore && !force) return;
    if (played >= MAX_ROUNDS && !force) {
      setShowScore(true);
      setRound(null);
      setShowImage(false);
      setLoading(false);
      setRevealed(false);
      return;
    }
    setLoading(true);
    setErrMsg("");
    setRound(null);
    setShowImage(false);
    setAnswered(false);
    setInput("");
    setFeedback("");
    setTimer(TIMER_DISPLAY);
    setRecallMeta(null);
    setRevealed(false);
    try {
      const res = await getMemoryTrainerRound(targetRegion);
      if (!res) {
        setErrMsg("Couldn't fetch a movie round. Try again?");
        setLoading(false);
        return;
      }
      // fetch extra data for more challenging recall, if available (e.g. main actor)
      if (res.movie && !res.movie.genres) {
        // Try to get actual genres and credits for harder question
        const movieDetails = await fetch(
          `https://api.themoviedb.org/3/movie/${res.movie.id}?api_key=${process.env.REACT_APP_TMDB_API_KEY}&append_to_response=credits`
        )
          .then((r) => (r.ok ? r.json() : res.movie))
          .catch(() => res.movie);
        res.movie.genres = movieDetails.genres || res.movie.genres;
        res.movie.credits = movieDetails.credits || {};
      }
      const qMeta = extractChallengingQuestion(res);
      setRecallMeta(qMeta);
      setRound(res);
      setShowImage(true);
      setLoading(false);
      setTimer(TIMER_DISPLAY);
      setRevealed(false);
    } catch (e) {
      setErrMsg("Failed to get a movie round. Retry.");
      setLoading(false);
    }
  }

  // Show image for `TIMER_DISPLAY` seconds, then hide/show question
  useEffect(() => {
    if (showImage && round) {
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setShowImage(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    // eslint-disable-next-line
  }, [showImage, round]);

  // On mount or region change, reset to fresh state and load a new round
  useEffect(() => {
    resetGameState(region);
    // eslint-disable-next-line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  // Whenever showScore changes to false (replay), reset everything and start round 0
  useEffect(() => {
    if (!showScore && played === 0 && !round && !loading) {
      loadRound(region, true);
    }
    // eslint-disable-next-line
  }, [showScore]);

  // Answer submission + feedback (only reveal correct answer after submit, but cannot submit if revealed)
  function handleSubmit(e) {
    e.preventDefault();
    if (answered || showScore || revealed) return;
    setAnswered(true);
    setPlayed((p) => p + 1);

    let normalizedGuess = (input || "").trim().toLowerCase();
    let correct = false;
    if (!round) return;
    const expected =
      (recallMeta && recallMeta.answer ? recallMeta.answer : round.answer) || "";

    if (recallMeta) {
      if (recallMeta.recallType === "director") {
        correct = expected.toLowerCase().includes(normalizedGuess);
      } else if (recallMeta.recallType === "actor") {
        correct = expected.toLowerCase().includes(normalizedGuess);
      } else if (recallMeta.recallType === "year") {
        correct = normalizedGuess === expected.toString();
      } else {
        correct = expected.toLowerCase().includes(normalizedGuess);
      }
    }

    if (correct) {
      setFeedback("🎉 Correct!");
      setScore((s) => s + 1);
    } else {
      setFeedback(
        `❌ Wrong! Correct answer: ${
          expected && typeof expected === "string" ? expected : JSON.stringify(expected)
        }`
      );
    }

    // If reached max, trigger final screen after feedback, else new round
    if (played + 1 >= MAX_ROUNDS) {
      setTimeout(() => {
        setShowScore(true);
        setRound(null);
        setShowImage(false);
      }, correct ? 1100 : 1700);
    } else {
      setTimeout(() => {
        loadRound();
      }, correct ? 1300 : 1900);
    }
  }

  // Reveal/skip button logic: disables submit, shows answer as skipped, and does NOT count to score.
  function handleReveal() {
    if (revealed || answered || showScore) return;
    setRevealed(true);
    setAnswered(false); // cannot submit after reveal
    setPlayed((p) => p + 1);
    setFeedback(
      `⏭️ Revealed! The answer was: ${
        (recallMeta && recallMeta.answer)
          || (round && round.answer)
          || ""
      }`
    );
    // After skip, show next question with delay
    setTimeout(() => {
      loadRound();
    }, 1700);
  }

  // UI styles
  const styles = {
    container: {
      maxWidth: 550,
      margin: "46px auto 0",
      background: "#fff",
      borderRadius: 22,
      boxShadow: "0 6px 28px 0 rgba(151,60,170,.13)",
      padding: "36px 16px 32px",
      minHeight: 350,
      animation: "fadeInPop 0.5s",
    },
    header: {
      color: "#973caa",
      margin: "0 0 10px",
      textShadow: "0 2px 18px #973caa18",
    },
    regionBar: {
      display: "flex",
      gap: 10,
      marginBottom: 15,
      marginTop: 2,
    },
    btn: (isActive) => ({
      background: isActive ? "#973caa" : "#edeafa",
      color: isActive ? "#fff" : "#763195",
      fontWeight: isActive ? 700 : 600,
      border: isActive ? "2px solid #973caa" : "2px solid #edeafa",
      padding: "7px 16px",
      minWidth: 108,
      borderRadius: 7,
      cursor: isActive ? "default" : "pointer",
    }),
    imageBox: {
      width: "100%",
      minHeight: 250,
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    movieImg: {
      width: "95%",
      maxWidth: 415,
      borderRadius: 19,
      boxShadow: "0 3px 22px 0 rgba(151,60,170,0.09)",
      marginBottom: 6,
      objectFit: "cover",
      maxHeight: 270,
      background: "#eee",
      animation: "fadeInPop 0.8s",
    },
    timerBar: {
      width: "82%",
      height: 8,
      background: "#edeafa",
      borderRadius: 8,
      overflow: "hidden",
      margin: "11px 0 0",
    },
    timerFill: {
      height: "100%",
      borderRadius: 8,
      background: "linear-gradient(90deg,#973caa,#c056d4 88%)",
      transition: "width 0.8s cubic-bezier(.47,1.6,.47,.86)",
      width: `${(timer / TIMER_DISPLAY) * 100}%`,
    },
    question: {
      margin: "12px 0 18px",
      fontWeight: 700,
      fontSize: "1.14rem",
      letterSpacing: ".017em",
      color: "#763195",
    },
    ansForm: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      margin: "15px 0 4px",
    },
    score: {
      fontWeight: 700,
      color: "#973caa",
      fontSize: "1.04rem",
      margin: "0 0 12px",
      letterSpacing: ".009em",
    },
    reveal: {
      margin: "12px 0 0",
      color: "#868095",
      fontWeight: 600,
      fontSize: ".99rem",
    },
    titleBox: {
      marginTop: 14,
      background: "#edeafa",
      padding: "10px 13px",
      borderRadius: 13,
      color: "#481d77",
      fontWeight: 600,
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.06)",
      fontSize: ".98rem",
      textAlign: "center",
    },
    scoreScreen: {
      background: "#edeafa",
      borderRadius: 15,
      padding: "34px 12px 28px",
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.08)",
      textAlign: "center",
      margin: "38px auto",
      maxWidth: 370,
      animation: "fadeInPop 0.5s cubic-bezier(.41,.81,.52,1)",
    },
  };

  return (
    <div className="game-container" style={styles.container}>
      <BackButton />
      <h2 className="title" style={styles.header}>
        Movie Memory Trainer
      </h2>
      <div style={styles.regionBar}>
        <button
          className="btn"
          style={styles.btn(region === "US")}
          onClick={() => { setRegion("US"); }}
          disabled={region === "US"}
          type="button"
        >
          Hollywood
        </button>
        <button
          className="btn"
          style={styles.btn(region === "IN")}
          onClick={() => { setRegion("IN"); }}
          disabled={region === "IN"}
          type="button"
        >
          Kollywood
        </button>
      </div>
      <div style={styles.score}>
        Score: {score} / {played} {` (Max: ${MAX_ROUNDS})`}
      </div>
      {showScore ? (
        <div
          style={styles.scoreScreen}
          className="subtle-pop"
          aria-label="Quiz End Score"
        >
          <div
            style={{
              fontSize: "1.47rem",
              fontWeight: 900,
              color: "#973caa",
              letterSpacing: ".012em",
              marginBottom: 5,
            }}
          >
            🎉 Session Complete!
          </div>
          <div style={{ fontWeight: 700, color: "#763195", fontSize: "1.17rem", margin: "8px 0" }}>
            Final Score: <span style={{ color: "#24974e" }}>{score}</span> / {MAX_ROUNDS}
          </div>
          <div style={{ margin: "8px 0 19px", color: "#8e83a2", fontSize: ".99rem" }}>
            {score === MAX_ROUNDS
              ? "Amazing – perfect memory!"
              : score >= 13
              ? "Great recall – you know your cinema!"
              : score >= 7
              ? "Nice job! Try again for more detail."
              : "Keep practicing for a higher score!"}
          </div>
          <button
            className="btn btn-large"
            style={{ fontWeight: 700, marginBottom: 7, fontSize: "1.14rem" }}
            onClick={() => resetGameState(region)}
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          {errMsg && <ErrorToast message={errMsg} />}
          {loading && (
            <div style={{ margin: "28px 0 22px", textAlign: "center" }}>
              <Loader size={34} />
            </div>
          )}
          {!loading && round && (
            <>
              {showImage ? (
                <div style={styles.imageBox}>
                  <img
                    src={round.imageUrl}
                    alt="Movie still"
                    style={styles.movieImg}
                    draggable={false}
                  />
                  <div style={styles.timerBar}>
                    <div style={styles.timerFill}></div>
                  </div>
                  <div
                    style={{
                      color: "#a58cc2",
                      fontSize: ".99rem",
                      fontWeight: 600,
                      marginTop: 8,
                      letterSpacing: ".01em"
                    }}
                  >
                    Memorize every detail... Question in{" "}
                    <span style={{ color: "#973caa", fontWeight: 700 }}>{timer}s</span>!
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.question}>
                    {recallMeta
                      ? recallMeta.recallQ
                      : "Recall a key detail about the movie you just saw."}
                  </div>
                  <form style={styles.ansForm} onSubmit={handleSubmit} autoComplete="off">
                    <input
                      className="input"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      autoFocus
                      placeholder={recallMeta ? recallMeta.placeholder : ""}
                      disabled={answered || revealed}
                      style={{
                        width: 190,
                        maxWidth: 260,
                        fontWeight: 590,
                        fontSize: "1.10rem",
                      }}
                      aria-label="Your answer"
                    />
                    <button
                      className="btn"
                      type="submit"
                      disabled={answered || revealed}
                      style={{ padding: "10px 22px", fontWeight: 700 }}
                    >
                      {answered ? "✓" : "Submit"}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        ...styles.btn(false),
                        border: "1.2px dashed #c8b9db",
                        background: "#f8f3fa",
                        color: "#973caa",
                        fontWeight: 700,
                        fontSize: ".98rem",
                        marginLeft: 7,
                        textDecoration: "underline",
                        padding: "8px 11px",
                        minWidth: 0,
                      }}
                      disabled={answered || revealed}
                      onClick={handleReveal}
                      aria-label="Reveal Answer"
                    >
                      {revealed ? "Revealed" : "Reveal Answer"}
                    </button>
                  </form>
                  {/* Only show feedback and correct answer after user submits or reveal */}
                  {(answered || revealed) ? (
                    <div
                      className="subtle-pop"
                      style={{
                        color: feedback.startsWith("🎉")
                          ? "#24974e"
                          : feedback.startsWith("⏭️")
                          ? "#c29817"
                          : "#db3662",
                        fontWeight: 700,
                        fontSize: "1.14rem",
                        textAlign: "center",
                        minHeight: 28,
                        marginTop: 9,
                        letterSpacing: ".007em"
                      }}
                      aria-live="polite"
                    >
                      {feedback}
                    </div>
                  ) : (
                    <div style={styles.reveal}>
                      <span style={{ fontStyle: "italic", color: "#b7a2cf" }}>
                        Hint: Recall details from the image!
                      </span>
                    </div>
                  )}
                  {/* Reveal Answer section -- only shows after reveal/skipped or correct answer */}
                  {revealed && (
                    <div style={styles.titleBox}>
                      <span style={{ color: "#973caa" }}>{round.movie.title}</span>{" "}
                      {round.movie.release_date ? `(${round.movie.release_date.slice(0, 4)})` : ""}
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {!loading && !round && !errMsg && (
            <div style={{ margin: "20px 0", color: "#c75e77" }}>
              Oops, unable to load a round.{" "}
              <button className="btn" onClick={() => loadRound(region, true)}>
                Retry
              </button>
            </div>
          )}
        </>
      )}
      <div
        style={{
          marginTop: 26,
          color: "#a58cc2",
          textAlign: "center",
          fontWeight: 500,
          fontSize: ".98rem",
          letterSpacing: ".008em",
        }}
      >
        Glimpse a random movie image for 5 seconds, then prove your recall!
        We'll grill you on main actor, director or another tricky detail.
        Use 'Reveal Answer' if you're stuck, but it won't count for your score.
      </div>
    </div>
  );
}
