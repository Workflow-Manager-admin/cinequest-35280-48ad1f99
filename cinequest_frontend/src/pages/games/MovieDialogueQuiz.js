import React, { useEffect, useState } from "react";
import GameCard from "../../components/GameCard";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import { fetchMoviesByRegion } from "../../tmdbApi";

// PUBLIC_INTERFACE
// MovieDialogueQuiz - TMDB-powered multiple-choice quiz.
// - Fetches a random TMDB movie (Hollywood/Kollywood).
// - Uses tagline or overview as a "quote".
// - User must select the correct movie among distractors.
export default function MovieDialogueQuiz() {
  const [region, setRegion] = useState("US");
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);

  // Helper: fetch random movies from TMDB for the quiz round
  async function getRandomQuizRound(region = "US", decoyCount = 3) {
    let tries = 0;
    let movie = null;
    // Try to fetch a random movie with a tagline or overview
    while (!movie && tries < 7) {
      try {
        const page = 1 + Math.floor(Math.random() * 5);
        const res = await fetchMoviesByRegion(region, { page });
        if (!res || !res.results) break;
        // Find a suitable movie with tagline or overview
        const candidates = res.results.filter(
          (m) =>
            m &&
            m.title &&
            ((typeof m.tagline === "string" && m.tagline.length > 12) ||
              (typeof m.overview === "string" && m.overview.length > 18)) &&
            m.title.length > 4
        );
        if (candidates.length === 0) {
          tries++;
          continue;
        }
        movie = candidates[Math.floor(Math.random() * candidates.length)];
      } catch {
        break;
      }
      tries++;
    }
    if (!movie) return null;

    // Select the quiz 'quote'
    let text =
      movie.tagline && movie.tagline.length > 12
        ? movie.tagline
        : movie.overview;

    // Fetch decoy (incorrect) movies
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
    // Compose and shuffle choices
    const allChoices = shuffleArray([movie, ...decoys.slice(0, decoyCount)]);
    return {
      text,
      answer: movie,
      choices: allChoices,
    };
  }

  // Fisher-Yates shuffle
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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

  // Load new round when region changes or on mount
  useEffect(() => {
    loadRound();
    // eslint-disable-next-line
  }, [region]);

  // Handle user selection
  function handleChoose(movie) {
    if (selected) return;
    setSelected(movie);
    setPlayed((p) => p + 1);
    if (movie.id === round.answer.id) {
      setScore((s) => s + 1);
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
