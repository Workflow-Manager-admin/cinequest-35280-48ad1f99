import React, { useEffect, useState, useRef } from "react";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import { getMemoryTrainerRound } from "../../tmdbGameUtils";
import BackButton from "../../components/BackButton";

// PUBLIC_INTERFACE
// Memory Trainer: show a movie still for 5s, then challenge with a recall question (v1: asks for title only, always reveals after).

const TIMER_DISPLAY = 5; // seconds to show image before quiz

export default function MemoryTrainer() {
  const MAX_ROUNDS = 10;
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
  const [showScore, setShowScore] = useState(false);

  const timerRef = useRef();

  // Helper to reset all gameplay state for replay/region switch
  function resetGameState(nextRegion = region) {
    setScore(0);
    setPlayed(0);
    setShowScore(false);
    setErrMsg("");
    setAnswered(false);
    setInput("");
    setFeedback("");
    setTimer(TIMER_DISPLAY);
    setShowImage(false);
    setRound(null);
    setLoading(false);
    loadRound(nextRegion, true);
  }

  // Load a new round unless max rounds reached or showScore is active
  async function loadRound(targetRegion = region, force = false) {
    if (showScore && !force) return;
    if (played >= MAX_ROUNDS && !force) {
      setShowScore(true);
      setRound(null);
      setShowImage(false);
      setLoading(false);
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
    try {
      const res = await getMemoryTrainerRound(targetRegion);
      setRound(res);
      setShowImage(true);
      setLoading(false);
      setTimer(TIMER_DISPLAY);
    } catch (e) {
      setErrMsg("Failed to get a movie round. Retry.");
      setLoading(false);
    }
  }

  // Show image for TIMER_DISPLAY seconds, then hide/show question
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
  }, [region]);

  // Whenever showScore changes to false (replay), reset everything and start round
  useEffect(() => {
    if (!showScore && played === 0 && !round && !loading) {
      loadRound(region, true);
    }
    // eslint-disable-next-line
  }, [showScore]);

  // Answer submission + feedback
  function handleSubmit(e) {
    e.preventDefault();
    if (answered || showScore) return;
    setAnswered(true);
    setPlayed((p) => p + 1);
    const correct =
      round &&
      (input || "").trim().toLowerCase() === (round.answer || "").trim().toLowerCase();
    if (correct) {
      setFeedback("🎉 Correct!");
      setScore((s) => s + 1);
    } else {
      setFeedback(
        `❌ Wrong! The answer was: ${round.answer}`
      );
    }
    // If reached max, trigger final screen after feedback, else load new round
    if (played + 1 >= MAX_ROUNDS) {
      setTimeout(() => {
        setShowScore(true);
        setRound(null);
        setShowImage(false);
      }, correct ? 1100 : 1700);
    } else {
      setTimeout(() => {
        loadRound();
      }, correct ? 1200 : 1700);
    }
  }

  // UI styles
  const styles = {
    container: {
      maxWidth: 500,
      margin: "40px auto 0",
      background: "#fff",
      borderRadius: 18,
      boxShadow: "0 6px 28px 0 rgba(151,60,170,0.09)",
      padding: "33px 16px 28px",
      minHeight: 350,
      animation: "fadeInPop 0.5s",
    },
    header: {
      color: "#973caa",
      margin: "0 0 9px",
      textShadow: "0 2px 18px #973caa18",
    },
    regionBar: {
      display: "flex",
      gap: 10,
      marginBottom: 12,
      marginTop: 2,
    },
    btn: (isActive) => ({
      background: isActive ? "#973caa" : "#edeafa",
      color: isActive ? "#fff" : "#763195",
      fontWeight: isActive ? 700 : 600,
      border: isActive ? "2px solid #973caa" : "2px solid #edeafa",
      padding: "7px 14px",
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
      width: "94%",
      maxWidth: 370,
      borderRadius: 13,
      boxShadow: "0 3px 22px 0 rgba(151,60,170,0.09)",
      marginBottom: 6,
      objectFit: "cover",
      maxHeight: 220,
      background: "#eee",
      animation: "fadeInPop 0.8s",
    },
    timerBar: {
      width: "80%",
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
      transition: "width 1s cubic-bezier(.47,1.6,.47,.86)",
      width: `${(timer / TIMER_DISPLAY) * 100}%`,
    },
    ansForm: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      margin: "16px 0 7px",
    },
    feedback: isRight => ({
      color: isRight ? "#24974e" : "#db3662",
      fontWeight: 700,
      fontSize: "1.06rem",
      textAlign: "center",
      minHeight: 26,
      letterSpacing: ".006em",
      marginTop: 9,
      marginBottom: 2,
      animation: "subtlePop 380ms cubic-bezier(.48,1.2,.64,1.05) 0.09s 1 both",
    }),
    score: {
      fontWeight: 700,
      color: "#973caa",
      fontSize: "1.01rem",
      margin: "0 0 15px",
      letterSpacing: ".009em",
    },
    scoreScreen: {
      background: "#edeafa",
      borderRadius: 15,
      padding: "32px 11px 28px",
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.07)",
      textAlign: "center",
      margin: "43px auto 10px",
      maxWidth: 330,
      animation: "fadeInPop 0.53s cubic-bezier(.41,.81,.52,1)",
    }
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
              fontSize: "1.3rem",
              fontWeight: 900,
              color: "#973caa",
              letterSpacing: ".012em",
              marginBottom: 3,
            }}
          >
            🎉 Session Complete!
          </div>
          <div style={{ fontWeight: 700, color: "#763195", fontSize: "1.13rem", margin: "8px 0" }}>
            Final Score: <span style={{ color: "#24974e" }}>{score}</span> / {MAX_ROUNDS}
          </div>
          <button
            className="btn btn-large"
            style={{ fontWeight: 700, marginBottom: 7, fontSize: "1.12rem" }}
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
                  {round.imageUrl ? (
                    <img
                      src={round.imageUrl}
                      alt="Movie still"
                      style={styles.movieImg}
                      draggable={false}
                    />
                  ) : (
                    <div
                      style={{
                        ...styles.movieImg,
                        color: "#c8b9db",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.7rem"
                      }}
                    >
                      🎞️
                    </div>
                  )}
                  <div style={styles.timerBar}>
                    <div style={styles.timerFill}></div>
                  </div>
                  <div
                    style={{
                      color: "#a58cc2",
                      fontSize: ".95rem",
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
                  <div
                    style={{
                      margin: "13px 0 13px",
                      fontWeight: 700,
                      fontSize: "1.13rem",
                      color: "#763195"
                    }}
                  >
                    What was the exact movie title?
                  </div>
                  <form style={styles.ansForm} onSubmit={handleSubmit} autoComplete="off">
                    <input
                      className="input"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      autoFocus
                      placeholder="Enter movie title"
                      disabled={answered}
                      style={{
                        width: 170,
                        fontWeight: 590,
                        fontSize: "1.07rem",
                      }}
                      aria-label="Your answer"
                    />
                    <button
                      className="btn"
                      type="submit"
                      disabled={answered}
                      style={{ padding: "10px 22px", fontWeight: 700 }}
                    >
                      {answered ? "✓" : "Submit"}
                    </button>
                  </form>
                  {feedback && (
                    <div
                      className="subtle-pop"
                      style={styles.feedback(feedback.startsWith("🎉"))}
                      aria-live="polite"
                    >
                      {feedback}
                    </div>
                  )}
                  {!feedback && (
                    <div style={{
                      marginTop: 11,
                      color: "#a58cc2",
                      fontWeight: 600,
                      fontSize: ".99rem"
                    }}>
                      Recall the title of the movie shown above.
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
          fontSize: ".97rem",
          letterSpacing: ".008em",
        }}
      >
        Glimpse a random movie image for 5 seconds, then guess the title! First version (CineQuest delivery).
      </div>
    </div>
  );
}
