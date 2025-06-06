import React, { useEffect, useState } from "react";
import GameCard from "../../components/GameCard";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import { fetchMoviesByRegion } from "../../tmdbApi";
import BackButton from "../../components/BackButton";

// PUBLIC_INTERFACE
// MovieDialogueQuiz - very first CineQuest working version: basic Hollywood/Kollywood region selection, fetches a random movie and quizzes on its tagline (or overview).
// Multiple-choice with three decoys and answer always shown after guess; minimal clue redaction, minimal error handling.

export default function MovieDialogueQuiz() {
  const MAX_QUESTIONS = 10;
  const [region, setRegion] = useState("US");
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [showScore, setShowScore] = useState(false); // End-of-session score screen

  // Fisher-Yates shuffle
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Quiz round generator with basic clue logic (first working version)
  async function getRandomQuizRound(region = "US", decoyCount = 3) {
    let tries = 0;
    let movie = null;
    // Try to fetch a random movie with a tagline or overview
    while (!movie && tries < 5) {
      try {
        const page = 1 + Math.floor(Math.random() * 4);
        const res = await fetchMoviesByRegion(region, { page });
        if (!res || !res.results) break;
        const candidates = res.results.filter(
          (m) =>
            m &&
            m.title &&
            (typeof m.tagline === "string" && m.tagline.length > 8) ||
            (typeof m.overview === "string" && m.overview.length > 25)
        );
        if (candidates.length === 0) {
          tries++;
          continue;
        }
        movie = candidates[Math.floor(Math.random() * candidates.length)];
      } catch {
        tries++;
        continue;
      }
    }
    if (!movie) return null;
    // Choose clue (prefer tagline, fallback to overview)
    let clue = movie.tagline && movie.tagline.length > 8 ? movie.tagline : (movie.overview || "Guess the movie!");
    // Get decoy movies
    let decoys = [];
    let decoyAttempts = 0;
    while (decoys.length < decoyCount && decoyAttempts < 8) {
      try {
        const page = 1 + Math.floor(Math.random() * 5);
        const res = await fetchMoviesByRegion(region, { page });
        if (!res || !res.results) break;
        for (const m of res.results) {
          if (
            m.id !== movie.id &&
            m.title &&
            m.title.length > 4 &&
            !decoys.find((d) => d.id === m.id)
          ) {
            decoys.push(m);
          }
          if (decoys.length === decoyCount) break;
        }
      } catch {
        break;
      }
      decoyAttempts++;
    }
    const choices = shuffleArray([movie, ...decoys.slice(0, decoyCount)]);
    return {
      text: clue,
      answer: movie,
      choices,
    };
  }

  // Fetch new quiz question
  async function loadRound() {
    setLoading(true);
    setErrMsg("");
    setSelected(null);
    setFeedback(null);
    try {
      const data = await getRandomQuizRound(region, 3);
      if (!data) {
        setErrMsg("Could not fetch a quiz round (try again).");
        setRound(null);
        setLoading(false);
      } else {
        setRound(data);
        setLoading(false);
      }
    } catch (e) {
      setErrMsg("Failed to get a quiz round. Please retry.");
      setRound(null);
      setLoading(false);
    }
  }

  // Load new round on region switch/mount
  useEffect(() => {
    setScore(0);
    setPlayed(0);
    setShowScore(false);
    loadRound();
    // eslint-disable-next-line
  }, [region]);

  // User choice handler
  function handleChoose(movie) {
    if (selected || showScore) return;
    setSelected(movie);
    if (movie.id === round.answer.id) {
      setScore((s) => s + 1);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }
    setPlayed((p) => p + 1);
    setTimeout(() => {
      if (played + 1 >= MAX_QUESTIONS) {
        setShowScore(true);
        setRound(null);
      } else {
        loadRound();
      }
    }, 850);
  }

  // UI styles
  const styles = {
    container: {
      maxWidth: 500,
      margin: "46px auto 0",
      background: "#fff",
      borderRadius: 18,
      boxShadow: "0 6px 28px 0 rgba(151,60,170,0.09)",
      padding: "33px 16px 26px",
      minHeight: 300,
      animation: "fadeInPop 0.5s"
    },
    quote: {
      color: "#481d77",
      fontSize: "1.10rem",
      background: "#edeafa",
      borderRadius: 12,
      padding: "13px 16px",
      margin: "0 0 15px",
      fontWeight: 600,
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.08)",
      letterSpacing: ".007em"
    },
    choicesRow: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
      justifyContent: "center",
      margin: "12px 0 13px"
    },
    regionBar: {
      display: "flex",
      gap: 10,
      marginBottom: 12,
      marginTop: 2
    },
    btn: (isActive) => ({
      background: isActive ? "#973caa" : "#edeafa",
      color: isActive ? "#fff" : "#763195",
      fontWeight: isActive ? 700 : 600,
      border: isActive ? "2px solid #973caa" : "2px solid #edeafa",
      padding: "8px 16px",
      minWidth: 108,
      borderRadius: 6,
      cursor: isActive ? "default" : "pointer"
    }),
    score: {
      fontWeight: 700,
      color: "#973caa",
      fontSize: "1.01rem",
      margin: "0 0 12px",
      letterSpacing: ".009em"
    }
  };

  return (
    <div className="game-container" style={styles.container}>
      <BackButton />
      <h2 className="title" style={{ color: "#973caa", margin: "0 0 12px" }}>
        Movie Dialogue Quiz
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
        Score: {score} / {played} {`(Max: ${MAX_QUESTIONS})`}
      </div>
      {showScore ? (
        <div
          style={{
            background: "#edeafa",
            borderRadius: 12,
            padding: "31px 13px 25px",
            boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.09)",
            textAlign: "center",
            margin: "35px auto 12px",
            maxWidth: 340,
            animation: "fadeInPop 0.54s cubic-bezier(.41,.81,.52,1)",
          }}
          className="subtle-pop"
          aria-label="Quiz End Score"
        >
          <div
            style={{
              fontSize: "1.36rem",
              fontWeight: 900,
              color: "#973caa",
              letterSpacing: ".013em",
              marginBottom: 6,
            }}
          >
            🎉 Quiz Complete!
          </div>
          <div style={{ fontWeight: 700, color: "#763195", fontSize: "1.13rem", margin: "8px 0" }}>
            Final Score: <span style={{ color: "#24974e" }}>{score}</span> / {MAX_QUESTIONS}
          </div>
          <button
            className="btn btn-large"
            style={{ fontWeight: 700, marginBottom: 7, marginTop: 8, fontSize: "1.06rem" }}
            onClick={() => {
              setScore(0);
              setPlayed(0);
              setShowScore(false);
              setSelected(null);
              setFeedback(null);
              setErrMsg("");
              setRound(null);
              loadRound();
            }}
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          {errMsg && <ErrorToast message={errMsg} />}
          {loading && (
            <div style={{ margin: "18px 0", textAlign: "center" }}>
              <Loader size={32} />
            </div>
          )}
          {!loading && round && (
            <div>
              <div style={styles.quote} aria-label="Movie clue">
                &ldquo;{round.text}&rdquo;
              </div>
              <div style={styles.choicesRow}>
                {round.choices.map((movie) => {
                  const isAnswer = selected && movie.id === round.answer.id;
                  const wrong = selected && selected.id === movie.id && !isAnswer;
                  return (
                    <GameCard
                      key={movie.id}
                      title={movie.title}
                      description={movie.release_date ? movie.release_date.slice(0, 4) : ""}
                      onClick={() => handleChoose(movie)}
                      style={{
                        opacity: selected && !isAnswer && !wrong ? 0.65 : 1,
                        border:
                          isAnswer && selected
                            ? "2.5px solid #6ebf55"
                            : wrong
                            ? "2.5px solid #db3662"
                            : undefined
                      }}
                    />
                  );
                })}
              </div>
              {selected && (
                <div
                  style={{
                    color: feedback === "correct" ? "#2e9245" : "#db3662",
                    fontWeight: 700,
                    fontSize: "1.08rem",
                    textAlign: "center",
                    marginTop: 7,
                    marginBottom: 2,
                    minHeight: 22,
                    letterSpacing: ".007em"
                  }}
                >
                  {feedback === "correct"
                    ? "🎉 Correct!"
                    : `❌ Wrong! The answer was ${round.answer.title}`}
                </div>
              )}
              <div style={{ marginTop: 14, color: "#a58cc2", fontSize: ".99rem", textAlign: "center" }}>
                {played + 1 <= MAX_QUESTIONS
                  ? `Question ${played + 1} of ${MAX_QUESTIONS}`
                  : `Quiz Complete`}
              </div>
            </div>
          )}
        </>
      )}
      <div style={{
        marginTop: 18,
        color: "#a58cc2",
        textAlign: "center",
        fontWeight: 500,
        fontSize: ".98rem",
        letterSpacing: ".008em"
      }}>
        Guess the movie title from the clue. First version (CineQuest delivery).
      </div>
    </div>
  );
}
