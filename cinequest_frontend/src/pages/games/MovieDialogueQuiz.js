import React, { useEffect, useState } from "react";
import { getRandomDialogueQuiz } from "../../tmdbGameUtils";
import GameCard from "../../components/GameCard";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";

/**
 * PUBLIC_INTERFACE
 * MovieDialogueQuiz - TMDB-powered multiple-choice quiz.
 * - Fetches a random TMDB movie (Hollywood/Kollywood).
 * - Uses tagline or overview as a "quote".
 * - User must select the correct movie among distractors.
 */
export default function MovieDialogueQuiz() {
  const [region, setRegion] = useState("US");
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);

  // Fetch new quiz question
  async function loadRound() {
    setLoading(true);
    setErrMsg("");
    setSelected(null);
    setFeedback(null);
    try {
      const data = await getRandomDialogueQuiz(region, 3);
      if (!data) {
        setErrMsg("Could not fetch a quiz round (try again).");
        setRound(null);
      } else {
        setRound(data);
        setLoading(false);
      }
    } catch (e) {
      setErrMsg("Failed to get a quiz round. Please retry.");
      setRound(null);
      setLoading(false);
    }
    setLoading(false);
  }

  // Load when region changes or on mount
  useEffect(() => {
    loadRound();
    // eslint-disable-next-line
  }, [region]);

  // Handle user selection
  function handleChoose(movie) {
    if (selected) return;
    setSelected(movie);
    setPlayed(played + 1);
    if (movie.id === round.answer.id) {
      setScore(score + 1);
      setFeedback("correct");
      setTimeout(() => {
        loadRound();
      }, 1100);
    } else {
      setFeedback("wrong");
      setTimeout(() => {
        loadRound();
      }, 1400);
    }
  }

  // UI styles
  const styles = {
    container: {
      maxWidth: 550,
      margin: "46px auto 0",
      background: "#fff",
      borderRadius: 22,
      boxShadow: "0 6px 28px 0 rgba(151,60,170,.082)",
      padding: "38px 18px 32px",
      minHeight: 330,
      animation: "fadeInPop 0.5s"
    },
    quote: {
      color: "#481d77",
      fontSize: "1.16rem",
      background: "#edeafa",
      borderRadius: 12,
      padding: "14px 19px",
      margin: "0 0 18px",
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
      marginBottom: 16,
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
      fontSize: "1.04rem",
      margin: "0 0 12px",
      letterSpacing: ".009em"
    }
  };

  const posterUrl = (poster) =>
    poster ? `https://image.tmdb.org/t/p/w185${poster}` : null;

  return (
    <div className="game-container" style={styles.container}>
      <h2 className="title" style={{ color: "#973caa", margin: "0 0 12px" }}>
        Movie Dialogue Quiz
      </h2>
      <div style={styles.regionBar}>
        <button
          className="btn"
          style={styles.btn(region === "US")}
          onClick={() => {
            setRegion("US");
            setScore(0); setPlayed(0);
          }}
          disabled={region === "US"}
          type="button"
        >
          Hollywood
        </button>
        <button
          className="btn"
          style={styles.btn(region === "IN")}
          onClick={() => {
            setRegion("IN");
            setScore(0); setPlayed(0);
          }}
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
        <div style={{ margin: "18px 0", textAlign: "center" }}>
          <Loader size={32} />
        </div>
      )}
      {!loading && round && (
        <div>
          <div style={styles.quote} aria-label="Movie quote/clue">
            &ldquo;{round.text}&rdquo;
          </div>
          <div style={styles.choicesRow}>
            {round.choices.map((movie) => {
              const isAnswer = selected && movie.id === round.answer.id;
              const wrong = selected && selected.id === movie.id && !isAnswer;
              return (
                <GameCard
                  key={movie.id}
                  movie
                  title={movie.title}
                  description={movie.release_date ? movie.release_date.slice(0,4) : ""}
                  poster={posterUrl(movie.poster_path)}
                  year=""
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
                fontSize: "1.13rem",
                textAlign: "center",
                marginTop: 7,
                marginBottom: 2,
                minHeight: 24,
                letterSpacing: ".007em"
              }}
            >
              {feedback === "correct"
                ? "🎉 Correct!"
                : `❌ Wrong! The answer was: ${round.answer.title}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
