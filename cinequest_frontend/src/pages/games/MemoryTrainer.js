import React, { useEffect, useState, useRef } from "react";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import { getMemoryTrainerRound } from "../../tmdbGameUtils";

// PUBLIC_INTERFACE
// MemoryTrainer - lively game mode where the user views a movie still for 5 seconds and then answers a recall question about it (year, director, or genre).

const TIMER_DISPLAY = 5; // seconds to show the image

export default function MemoryTrainer() {
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

  const timerRef = useRef();

  // Load a new round (movie + image + question)
  async function loadRound() {
    setLoading(true);
    setErrMsg("");
    setRound(null);
    setShowImage(false);
    setAnswered(false);
    setInput("");
    setFeedback("");
    setTimer(TIMER_DISPLAY);
    try {
      const res = await getMemoryTrainerRound(region);
      if (!res) {
        setErrMsg("Couldn't fetch a movie round. Try again?");
        setLoading(false);
        return;
      }
      setRound(res);
      setShowImage(true);
      setLoading(false);
      setTimer(TIMER_DISPLAY);
    } catch {
      setErrMsg("Failed to get a memory round. Retry.");
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

  // New round on mount or region change
  useEffect(() => {
    loadRound();
    // eslint-disable-next-line
  }, [region]);

  // Submit answer/reveal
  function handleSubmit(e) {
    e.preventDefault();
    setAnswered(true);
    setPlayed((p) => p + 1);
    let normalizedGuess = (input || "").trim().toLowerCase();
    let correct = false;
    if (!round) return;
    if (round.recallType === "year") {
      correct = normalizedGuess === (round.answer || "").toString();
    } else if (round.recallType === "director") {
      // Accept substring/director last name, case-insensitive
      const answerLower = (round.answer || "").toLowerCase();
      correct = answerLower.includes(normalizedGuess);
    } else if (round.recallType === "genre") {
      const genres = ((round.movie.genre_ids && Array.isArray(round.movie.genre_ids)) ? (round.movie.genre_ids.join(",") || "") : "") + ((round.movie.genres && Array.isArray(round.movie.genres)) ? (round.movie.genres.map(g=>g.name).join(",").toLowerCase()) : "");
      correct = genres.includes(normalizedGuess);
    }
    if (correct) {
      setFeedback("🎉 Correct!");
      setScore((s) => s + 1);
    } else {
      setFeedback(`❌ Wrong! Correct: ${round.answer}`);
    }
    setTimeout(loadRound, 2100);
  }

  // UI styles
  const styles = {
    container: {
      maxWidth: 520,
      margin: "46px auto 0",
      background: "#fff",
      borderRadius: 22,
      boxShadow: "0 6px 28px 0 rgba(151,60,170,.10)",
      padding: "36px 16px 32px",
      minHeight: 330,
      animation: "fadeInPop 0.51s"
    },
    header: {
      color: "#973caa",
      margin: "0 0 10px",
      textShadow: "0 2px 18px #973caa18"
    },
    regionBar: {
      display: "flex",
      gap: 10,
      marginBottom: 15,
      marginTop: 2
    },
    btn: (isActive) => ({
      background: isActive ? "#973caa" : "#edeafa",
      color: isActive ? "#fff" : "#763195",
      fontWeight: isActive ? 700 : 600,
      border: isActive ? "2px solid #973caa" : "2px solid #edeafa",
      padding: "7px 16px",
      minWidth: 108,
      borderRadius: 7,
      cursor: isActive ? "default" : "pointer"
    }),
    imageBox: {
      width: "100%",
      minHeight: 250,
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    },
    movieImg: {
      width: "95%",
      maxWidth: 415,
      borderRadius: 19,
      boxShadow: "0 3px 22px 0 rgba(151,60,170,0.10)",
      marginBottom: 6,
      objectFit: "cover",
      maxHeight: 270,
      background: "#eee",
      animation: "fadeInPop 0.77s"
    },
    timerBar: {
      width: "80%",
      height: 8,
      background: "#edeafa",
      borderRadius: 8,
      overflow: "hidden",
      margin: "11px 0 0"
    },
    timerFill: {
      height: "100%",
      borderRadius: 8,
      background: "linear-gradient(90deg,#973caa,#c056d4 88%)",
      transition: "width 0.8s cubic-bezier(.47,1.6,.47,.86)",
      width: `${(timer / TIMER_DISPLAY) * 100}%`
    },
    question: {
      margin: "9px 0 18px",
      fontWeight: 700,
      fontSize: "1.13rem",
      letterSpacing: ".017em",
      color: "#763195"
    },
    ansForm: {
      display: "flex", flexDirection: "row",
      alignItems: "center", gap: 10,
      margin: "12px 0"
    },
    score: {
      fontWeight: 700,
      color: "#973caa",
      fontSize: "1.04rem",
      margin: "0 0 12px",
      letterSpacing: ".009em"
    },
    reveal: {
      margin: "12px 0 0",
      color: "#868095",
      fontWeight: 600,
      fontSize: ".99rem"
    }
  };

  return (
    <div className="game-container" style={styles.container}>
      <h2 className="title" style={styles.header}>
        Movie Memory Trainer
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
      <div style={styles.score}>
        Score: {score} / {played}
      </div>
      {errMsg && <ErrorToast message={errMsg} />}
      {loading && (
        <div style={{ margin: "28px 0 22px", textAlign: "center" }}>
          <Loader size={32} />
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
                  fontSize: ".98rem",
                  fontWeight: 600,
                  marginTop: 6,
                  letterSpacing: ".01em"
                }}
              >
                Remember every detail! Question appears in {timer}s...
              </div>
            </div>
          ) : (
            <>
              <div style={styles.question}>
                {round.recallQ}
              </div>
              <form style={styles.ansForm} onSubmit={handleSubmit} autoComplete="off">
                <input
                  className="input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  autoFocus
                  placeholder={
                    round.recallType === "year"
                      ? "Enter year (e.g. 2018)"
                      : round.recallType === "director"
                      ? "Enter director's name"
                      : "Enter a genre (e.g. Drama)"
                  }
                  disabled={answered}
                  style={{ width: 164, maxWidth: 230, fontWeight: 600, fontSize: "1.09rem" }}
                  aria-label="Your answer"
                />
                <button
                  className="btn"
                  type="submit"
                  disabled={answered}
                  style={{ padding: "10px 20px", fontWeight: 700 }}
                >
                  {answered ? "✓" : "Submit"}
                </button>
              </form>
              {answered && (
                <div
                  className="subtle-pop"
                  style={{
                    color: feedback.startsWith("🎉")
                      ? "#24974e"
                      : "#db3662",
                    fontWeight: 700,
                    fontSize: "1.13rem",
                    textAlign: "center",
                    minHeight: 28,
                    marginTop: 6,
                    letterSpacing: ".007em"
                  }}
                >
                  {feedback}
                </div>
              )}
              {!answered && (
                <div style={styles.reveal}>
                  <span style={{ fontStyle: "italic", color: "#b7a2cf" }}>
                    Hint: Think about details from the image you just saw!
                  </span>
                </div>
              )}
              <div
                style={{
                  marginTop: 17,
                  background: "#edeafa",
                  padding: "10px 13px",
                  borderRadius: 13,
                  color: "#481d77",
                  fontWeight: 600,
                  boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.07)",
                  fontSize: ".98rem",
                  textAlign: "center"
                }}
              >
                <span style={{ color: "#973caa" }}>{round.movie.title}</span>{" "}
                {round.movie.release_date ? `(${round.movie.release_date.slice(0, 4)})` : ""}
              </div>
            </>
          )}
        </>
      )}
      {!loading && !round && !errMsg && (
        <div style={{ margin: "20px 0", color: "#c75e77" }}>
          Oops, unable to load round. <button className="btn" onClick={loadRound}>Retry</button>
        </div>
      )}
      <div style={{ marginTop: 26, color: "#a58cc2", textAlign: "center", fontWeight: 500, fontSize: ".98rem", letterSpacing: ".008em" }}>
        Glimpse a movie image for 5 seconds, then test your memory!
      </div>
    </div>
  );
}
