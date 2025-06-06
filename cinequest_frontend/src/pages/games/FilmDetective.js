import React, { useEffect, useState, useCallback } from "react";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import BackButton from "../../components/BackButton";

// Fixed game config
const MAX_QUESTIONS = 18;
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

// Helper for region-specific original language
function regionToLang(region) {
  return region === "IN" ? "ta" : "en";
}

/*
 * PUBLIC_INTERFACE
 * Fetch ONE random movie with a poster, hero/lead actor, and year from TMDB by region/lang.
 * Ensures poster is present, gets credits for hero, skips duplicates, retries some times.
 * Returns: { id, title, poster_path, year, hero, credits }
 */
async function getDetectiveQuizRound(region = "US", excludeIds = []) {
  // Try to find a movie that fits the clues and not a repeat
  let tries = 0;
  let movie = null;
  let hero = "";
  let credits = null;
  while (++tries <= 10) {
    // Fetch a page with ~18 movies
    const page = 1 + Math.floor(Math.random() * 4);
    const discoverUrl = new URL("https://api.themoviedb.org/3/discover/movie");
    discoverUrl.searchParams.append("api_key", TMDB_API_KEY);
    discoverUrl.searchParams.append("region", region);
    discoverUrl.searchParams.append(
      "with_original_language",
      regionToLang(region)
    );
    discoverUrl.searchParams.append("sort_by", "popularity.desc");
    discoverUrl.searchParams.append("page", page);
    // Get the slice of movies (call API)
    const res = await fetch(discoverUrl.toString());
    if (!res.ok) continue;
    const data = await res.json();
    // Find a valid movie with poster, year, not already used
    const movies =
      Array.isArray(data.results) && data.results.length
        ? data.results.filter(
            (m) =>
              m.poster_path &&
              m.title &&
              (!excludeIds.includes(m.id)) &&
              m.release_date &&
              /^[1-2][0-9]{3}/.test(m.release_date)
          )
        : [];
    if (!movies.length) continue;
    movie = movies[Math.floor(Math.random() * movies.length)];
    // Fetch credits to get hero
    try {
      const credUrl = new URL(
        `https://api.themoviedb.org/3/movie/${movie.id}/credits`
      );
      credUrl.searchParams.append("api_key", TMDB_API_KEY);
      const credRes = await fetch(credUrl.toString());
      credits = await credRes.json();
      if (credits && credits.cast && credits.cast.length > 0) {
        hero = credits.cast[0].name || "";
      }
    } catch {}
    // Hero requirement
    if (hero && hero.trim().length > 1) {
      return {
        ...movie,
        poster_path: movie.poster_path,
        year: String(movie.release_date).slice(0, 4),
        hero,
        credits,
      };
    }
    // else try again
    movie = null;
  }
  return null;
}

// Blur effect for poster image
function BlurredPoster({ src, alt }) {
  return (
    <div
      style={{
        width: 270,
        height: 390,
        margin: "0 auto 0",
        overflow: "hidden",
        borderRadius: 18,
        background: "#e3e2e8",
        boxShadow: "0 1.5px 14px 0 rgba(151,60,170,0.12)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        filter: "none",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: 390,
            objectFit: "cover",
            filter: "blur(18px) brightness(0.84) contrast(1.15)",
            transition: "filter 0.44s cubic-bezier(.7,.05,.93,1.07)",
            borderRadius: 18,
            background: "#e7e3f3",
            userSelect: "none",
            pointerEvents: "none",
          }}
          draggable={false}
        />
      ) : (
        <span
          style={{
            color: "#d0b7df",
            fontSize: 80,
            width: "100%",
            textAlign: "center",
            userSelect: "none",
            display: "block",
          }}
        >
          🎬
        </span>
      )}
    </div>
  );
}

function cleanAnswer(s = "") {
  // Remove punctuation, extra space, lower-case
  return s
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export default function FilmDetective() {
  const [region, setRegion] = useState("US"); // "US" or "IN"
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  const [sessionIds, setSessionIds] = useState([]); // Prevent repeats
  const [showScore, setShowScore] = useState(false);

  // Load the next quiz round
  const loadQuiz = useCallback(
    async (first = false) => {
      setLoading(true);
      setQuiz(null);
      setInput("");
      setFeedback("");
      setRevealed(false);
      setError("");
      let exclude = first ? [] : [...sessionIds];
      try {
        const round = await getDetectiveQuizRound(region, exclude);
        if (!round) {
          setError("Could not fetch movie round. Retry?");
          setLoading(false);
          setQuiz(null);
          return;
        }
        setQuiz(round);
        setSessionIds((ids) =>
          first ? [round.id] : [...ids, round.id].slice(-MAX_QUESTIONS * 2)
        );
        setLoading(false);
      } catch (e) {
        setError("Network error. Please retry.");
        setLoading(false);
      }
    },
    [region, sessionIds]
  );

  // On mount or region change, start over
  useEffect(() => {
    setScore(0);
    setPlayed(0);
    setShowScore(false);
    setSessionIds([]);
    setTimeout(() => {
      loadQuiz(true);
    }, 300);
    // eslint-disable-next-line
  }, [region]);

  // On new round, auto-focus input
  useEffect(() => {
    if (quiz && !loading) {
      setTimeout(() => {
        try {
          document.getElementById("detective-input")?.focus();
        } catch {}
      }, 120);
    }
  }, [quiz, loading]);

  // After answer/reveal, end or advance
  useEffect(() => {
    if (
      feedback &&
      (!revealed && !error) &&
      played < MAX_QUESTIONS &&
      quiz
    ) {
      // Go to next after short pause
      const timeout = setTimeout(() => {
        setQuiz(null);
        setFeedback("");
        setInput("");
        setRevealed(false);
        loadQuiz();
        setPlayed((n) => n + 1);
      }, feedback.startsWith("🎉") ? 1300 : 1800);
      return () => clearTimeout(timeout);
    }

    // If last question, show score after delay
    if (
      (feedback && played + 1 >= MAX_QUESTIONS) ||
      (revealed && played + 1 >= MAX_QUESTIONS)
    ) {
      const timeout = setTimeout(() => {
        setShowScore(true);
      }, 1050);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line
  }, [feedback, revealed]);

  // Handle typed answer submit
  function handleSubmit(e) {
    e.preventDefault();
    if (!quiz || !input || !!feedback || !!error || revealed) return;
    const guess = cleanAnswer(input);
    const answer = cleanAnswer(quiz.title);
    if (guess === answer) {
      setFeedback("🎉 Correct!");
      setScore((n) => n + 1);
    } else {
      setFeedback(`❌ Wrong! The answer was: "${quiz.title}"`);
    }
    setPlayed((n) => n + 1);
  }

  // Handle skip or reveal
  function handleReveal() {
    setRevealed(true);
    setFeedback(""); // erase typed feedback
    setPlayed((n) => n + 1);
  }

  // Reset and replay
  function handleReplay() {
    setScore(0);
    setPlayed(0);
    setShowScore(false);
    setSessionIds([]);
    setRevealed(false);
    setInput("");
    setFeedback("");
    setQuiz(null);
    setError("");
    setTimeout(() => {
      loadQuiz(true);
    }, 320);
  }

  const mainColor = "#973caa";
  const subColor = "#763195";

  // --- UI styles ---
  const styles = {
    container: {
      maxWidth: 550,
      margin: "46px auto 0",
      background: "#fff",
      borderRadius: 22,
      boxShadow: "0 6px 28px 0 rgba(151,60,170,.098)",
      padding: "38px 18px 32px",
      minHeight: 350,
      animation: "fadeInPop 0.5s",
    },
    title: {
      color: mainColor,
      margin: "0 0 10px",
      letterSpacing: ".011em",
      textShadow: "0 2px 13px #973caa18",
      fontWeight: 700,
    },
    regionBar: {
      display: "flex",
      gap: 10,
      marginBottom: 17,
      marginTop: 6,
    },
    btn: (active) => ({
      background: active ? mainColor : "#edeafa",
      color: active ? "#fff" : subColor,
      fontWeight: active ? 700 : 600,
      border: active
        ? `2px solid ${mainColor}`
        : "2px solid #edeafa",
      padding: "7px 19px",
      minWidth: 102,
      borderRadius: 8,
      cursor: active ? "default" : "pointer",
    }),
    cluesRow: {
      display: "flex",
      flexDirection: "row",
      gap: 22,
      justifyContent: "center",
      margin: "21px 0 11px 0",
      alignItems: "center",
    },
    clue: {
      background: "#edeafa",
      borderRadius: 13,
      padding: "19px 17px",
      fontWeight: 700,
      color: "#481d77",
      fontSize: "1.16rem",
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.09)",
      minWidth: 120,
      textAlign: "center",
      letterSpacing: ".011em",
      userSelect: "none",
    },
    posterBox: {
      margin: "8px 0 0 0",
      textAlign: "center",
    },
    form: {
      display: "flex",
      flexDirection: "row",
      gap: 12,
      margin: "19px 0 3px",
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      width: 186,
      maxWidth: 252,
      fontWeight: 590,
      fontSize: "1.13rem",
      padding: "10px 15px",
      border: "2px solid #e7e3f3",
      borderRadius: 8,
      outline: "none",
      background: "#fff",
      color: "#151414",
    },
    score: {
      fontWeight: 700,
      color: mainColor,
      fontSize: "1.08rem",
      margin: "0 0 12px",
      letterSpacing: ".009em",
    },
    revealBtn: {
      background: "#fffdfa",
      border: "1.6px dashed #c8b9db",
      color: mainColor,
      padding: "8px 14px",
      borderRadius: 12,
      fontWeight: 700,
      fontSize: ".98rem",
      cursor: "pointer",
      textDecoration: "underline",
      marginLeft: 4,
      transition: "background .17s",
    },
    feedback: (isRight) => ({
      color: isRight ? "#24974e" : "#db3662",
      fontWeight: 700,
      fontSize: "1.14rem",
      textAlign: "center",
      minHeight: 28,
      letterSpacing: ".007em",
      marginTop: 8,
      marginBottom: 3,
      animation: "subtlePop 380ms cubic-bezier(.48,1.2,.64,1.05) 0.08s 1 both",
    }),
    movieReveal: {
      marginTop: 13,
      background: "#edeafa",
      padding: "13px 16px",
      borderRadius: 12,
      color: "#481d77",
      fontWeight: 700,
      fontSize: "1.09rem",
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.07)",
      textAlign: "center",
    },
    scoreScreen: {
      background: "#edeafa",
      borderRadius: 15,
      padding: "32px 13px 27px",
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.09)",
      textAlign: "center",
      margin: "36px auto 16px",
      maxWidth: 370,
      animation: "fadeInPop 0.54s cubic-bezier(.41,.81,.52,1)",
    },
    stats: {
      fontWeight: 700,
      color: "#763195",
      fontSize: "1.16rem",
      margin: "9px 0 8px",
    },
    hintText: {
      margin: "23px 0 5px",
      color: "#a58cc2",
      fontSize: ".98rem",
      textAlign: "center",
      fontWeight: 500,
      letterSpacing: ".008em",
    },
  };

  return (
    <div className="game-container" style={styles.container}>
      <BackButton />
      <h2 className="title" style={styles.title}>
        Film Detective
      </h2>
      <div style={styles.regionBar}>
        <button
          className="btn"
          style={styles.btn(region === "US")}
          onClick={() => setRegion("US")}
          disabled={region === "US" && !showScore}
          type="button"
        >
          Hollywood
        </button>
        <button
          className="btn"
          style={styles.btn(region === "IN")}
          onClick={() => setRegion("IN")}
          disabled={region === "IN" && !showScore}
          type="button"
        >
          Kollywood
        </button>
      </div>
      <div style={styles.score}>
        Score: {score} / {played} (Max: {MAX_QUESTIONS})
      </div>
      {showScore ? (
        <div style={styles.scoreScreen} className="subtle-pop" aria-label="Quiz End Score">
          <div
            style={{
              fontSize: "1.47rem",
              fontWeight: 900,
              color: "#973caa",
              letterSpacing: ".012em",
              marginBottom: 8,
            }}
          >
            🎉 Detective Session Complete!
          </div>
          <div style={styles.stats}>
            Final Score: <span style={{ color: "#24974e" }}>{score}</span> / {MAX_QUESTIONS}
          </div>
          <div style={{ margin: "9px 0 20px", color: "#8e83a2", fontSize: ".99rem" }}>
            {score === MAX_QUESTIONS
              ? "Amazing cinema sleuthing – you nailed them all!"
              : score >= 13
              ? "Great job! Your film IQ is superb."
              : score >= 7
              ? "Solid work—try for an even higher score next time!"
              : "Keep practicing! You'll be a movie detective soon."}
          </div>
          <button
            className="btn btn-large"
            style={{ fontWeight: 700, marginBottom: 8, fontSize: "1.13rem" }}
            onClick={handleReplay}
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          {error && <ErrorToast message={error} />}
          {loading && (
            <div style={{ margin: "28px 0 16px", textAlign: "center" }}>
              <Loader size={36} />
            </div>
          )}
          {!loading && quiz && (
            <>
              <div style={styles.posterBox}>
                <BlurredPoster
                  src={
                    quiz.poster_path ? POSTER_BASE + quiz.poster_path : null
                  }
                  alt={quiz.title || "Blurred movie poster"}
                />
              </div>
              <div style={styles.cluesRow}>
                <div style={styles.clue}>
                  <span style={{ color: "#763195" }}>Hero</span>
                  <br />
                  <span style={{ color: "#973caa" }}>{quiz.hero}</span>
                </div>
                <div style={styles.clue}>
                  <span style={{ color: "#763195" }}>Year</span>
                  <br />
                  <span style={{ color: "#973caa" }}>{quiz.year}</span>
                </div>
              </div>
              <form
                style={styles.form}
                onSubmit={handleSubmit}
                autoComplete="off"
              >
                <input
                  id="detective-input"
                  className="input"
                  placeholder="Type movie title"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!!feedback || !!revealed}
                  autoFocus
                  style={styles.input}
                  aria-label="Your answer"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="text"
                />
                <button
                  className="btn"
                  type="submit"
                  disabled={!!feedback || !!revealed}
                  style={{ padding: "10px 22px", fontWeight: 700 }}
                >
                  {feedback || revealed ? "✓" : "Submit"}
                </button>
                <button
                  type="button"
                  style={styles.revealBtn}
                  onClick={handleReveal}
                  disabled={!!revealed}
                  aria-label="Reveal Answer"
                >
                  Reveal Answer
                </button>
              </form>
              {/* Feedback after guess */}
              {(feedback || revealed) && (
                <div
                  style={styles.feedback(
                    feedback.startsWith("🎉") ||
                      revealed
                  )}
                  className="subtle-pop"
                  aria-live="polite"
                >
                  {revealed
                    ? (
                        <>
                          <span style={{ color: mainColor, fontWeight: 700 }}>
                            The answer is: "{quiz.title}"
                          </span>
                        </>
                      )
                    : feedback}
                </div>
              )}
              {/* Show actual answer as movie detail box if revealed or after submit */}
              {(feedback || revealed) && (
                <div style={styles.movieReveal}>
                  <span style={{ color: mainColor }}>{quiz.title}</span>{" "}
                  {quiz.year && <span>({quiz.year})</span>}
                </div>
              )}
              <div style={styles.hintText}>
                Guess the movie title from the clues and the blurred poster.
                <br />
                <span style={{ color: "#b7a2cf" }}>
                  Stuck? Reveal the answer for help. {played + 1} of {MAX_QUESTIONS}
                </span>
              </div>
            </>
          )}
          {!loading && !quiz && !error && (
            <div style={{ margin: "20px 0", color: "#c75e77" }}>
              Oops, unable to load a round.{" "}
              <button className="btn" onClick={() => loadQuiz()} style={{fontWeight:700}}>
                Retry
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
