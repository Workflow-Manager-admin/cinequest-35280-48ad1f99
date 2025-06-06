import React, { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import BackButton from "../../components/BackButton";

// PUBLIC_INTERFACE
// ObjectMovieGuess: v1 implementation. Picks a movie, gets up to 4 keywords or title nouns, asks user to guess movie from clues.

async function getObjectGuessRound(region = "US") {
  // TMDB API logic: fetch random movie with at least 2 keywords or title-based object clues
  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  // Helper to fetch random movie
  async function randomMovie() {
    const page = 1 + Math.floor(Math.random() * 3);
    let url = new URL("https://api.themoviedb.org/3/discover/movie");
    url.searchParams.append("api_key", API_KEY);
    url.searchParams.append("region", region);
    if (region === "IN") {
      url.searchParams.append("with_original_language", "ta");
      url.searchParams.append("language", "ta-IN");
    } else {
      url.searchParams.append("with_original_language", "en");
      url.searchParams.append("language", "en-US");
    }
    url.searchParams.append("sort_by", "popularity.desc");
    url.searchParams.append("page", page);
    const resp = await fetch(url.toString());
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data && Array.isArray(data.results) && data.results.length) {
      return data.results[Math.floor(Math.random() * data.results.length)];
    }
    return null;
  }

  // Given a movie, fetch all relevant concrete object clues (keywords and title nouns)
  async function getConcreteObjects(movie) {
    // Fetch keywords from TMDB
    let kwArr = [];
    try {
      const kwResp = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/keywords?api_key=${API_KEY}`);
      const kwJson = await kwResp.json();
      if (Array.isArray(kwJson.keywords)) kwArr = kwJson.keywords.map(k => k.name);
      if (Array.isArray(kwJson.results)) kwArr = kwArr.concat(kwJson.results.map(k => k.name));
    } catch { }
    // Try to select only object/prop type keywords (skip "genre", "love", "story", etc.)
    kwArr = kwArr.filter(
      name =>
        name &&
        name.length > 1 &&
        !/(genre|romance|drama|comedy|movie|film|family|action|thriller|love|story|life|crime|biography|music|television|history|animation|fantasy|adventure|mystery|horror|tv|award|friendship|good|evil|hero|villain)/i.test(name)
    );
    // From title, get capitalized words likely to be objects/nouns
    let nounWords = [];
    if (movie.title) {
      nounWords = movie.title
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2 && /^[A-Z]/.test(w));
    }
    // Mix and unique, at least two
    let clues = Array.from(new Set([...kwArr, ...nounWords]));
    if (clues.length > 4) {
      // Shuffle
      for (let i = clues.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [clues[i], clues[j]] = [clues[j], clues[i]];
      }
      clues = clues.slice(0, 4);
    }
    return clues.length >= 2 ? clues : [];
  }

  // Try to get a movie w/ at least 2 clues
  let movie = null, clues = [];
  let tries = 0;
  while (tries < 7 && clues.length < 2) {
    movie = await randomMovie();
    if (!movie) break;
    clues = await getConcreteObjects(movie);
    tries++;
  }
  if (!movie || clues.length < 2) return null;
  return { movie, objects: clues };
}

export default function ObjectMovieGuess() {
  // Implements 10-question session limit, score screen, progress, replay/reset.
  const MAX_QUESTIONS = 10;
  const [region, setRegion] = useState("US"); // "US" | "IN"
  const [round, setRound] = useState(null); // { movie, objects }
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0); // Number of questions attempted
  const [showScore, setShowScore] = useState(false);

  // State reset for region switch or replay
  function resetState(nextRegion = region) {
    setScore(0);
    setPlayed(0);
    setShowScore(false);
    setErrMsg("");
    setFeedback("");
    setAnswered(false);
    setInput("");
    setRound(null);
    setLoading(false);
    loadRound(true);
  }

  // Robust round loader respecting session end
  const loadRound = async (force = false) => {
    if (showScore && !force) return;
    if (played >= MAX_QUESTIONS && !force) {
      setShowScore(true);
      setRound(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrMsg("");
    setFeedback("");
    setAnswered(false);
    setInput("");
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

  // Load round on mount OR region switch, but fully reset state
  useEffect(() => {
    resetState(region);
    // eslint-disable-next-line
  }, [region]);

  // On showScore->false (replay), fully reset and start again
  useEffect(() => {
    if (!showScore && played === 0 && !round && !loading) {
      loadRound(true);
    }
    // eslint-disable-next-line
  }, [showScore]);

  // SUBMIT: only accept if session not over
  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || showScore || !round || answered) return;
    setAnswered(true);
    setPlayed(p => p + 1);
    // Accept answer if guess matches movie title, ignoring punctuation/case
    const normalize = s =>
      (s || "")
        .toLowerCase()
        .replace(/[^\w]+/g, "")
        .trim();
    const correct =
      round &&
      (
        normalize(input) === normalize(round.movie.title) ||
        normalize(input) === normalize(round.movie.original_title)
      );
    if (correct) {
      setFeedback("🎉 Correct!");
      setScore(s => s + 1);
    } else {
      setFeedback(
        `❌ Wrong! The answer was: ${round.movie.title}`
      );
    }
    // Session end/advance
    if (played + 1 >= MAX_QUESTIONS) {
      setTimeout(() => {
        setShowScore(true);
        setRound(null);
      }, correct ? 1100 : 1700);
    } else {
      setTimeout(() => {
        loadRound();
      }, correct ? 1300 : 1700);
    }
  }

  // UI styles
  const styles = {
    container: {
      maxWidth: 500,
      margin: "46px auto 0",
      background: "#fff",
      borderRadius: 18,
      boxShadow: "0 6px 28px 0 rgba(151,60,170,0.09)",
      padding: "33px 16px 28px",
      minHeight: 320,
      animation: "fadeInPop 0.52s cubic-bezier(.41,.81,.52,1)",
    },
    regionBar: {
      display: "flex",
      gap: 13,
      marginBottom: 11,
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
      margin: "17px 0 12px 0",
      justifyContent: "center",
    },
    clueBox: {
      background: "#edeafa",
      borderRadius: 13,
      textAlign: "center",
      fontSize: "1.11rem",
      fontWeight: 700,
      color: "#481d77",
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.07)",
      padding: "19px 10px",
      letterSpacing: ".011em",
      minHeight: 47,
      userSelect: "none",
    },
    form: {
      display: "flex",
      flexDirection: "row",
      gap: 11,
      margin: "13px 0",
      alignItems: "center",
    },
    score: {
      fontWeight: 700,
      color: "#973caa",
      fontSize: "1.04rem",
      margin: "0 0 11px",
      letterSpacing: ".009em",
    },
    feedback: isRight => ({
      color: isRight ? "#24974e" : "#db3662",
      fontWeight: 700,
      fontSize: "1.11rem",
      textAlign: "center",
      minHeight: 23,
      letterSpacing: ".006em",
      marginTop: 9,
      marginBottom: 2,
      animation: "subtlePop 380ms cubic-bezier(.48,1.2,.64,1.05) 0.09s 1 both",
    }),
    scoreScreen: {
      background: "#edeafa",
      borderRadius: 15,
      padding: "32px 11px 28px",
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.07)",
      textAlign: "center",
      margin: "39px auto 10px",
      maxWidth: 335,
      animation: "fadeInPop 0.54s cubic-bezier(.41,.81,.52,1)",
    }
  };

  return (
    <div className="game-container" style={styles.container}>
      <BackButton />
      <h2 className="title" style={{ color: "#973caa", margin: "0 0 13px" }}>
        Object-Based Movie Guess
      </h2>
      <div style={styles.regionBar}>
        <button className="btn" style={styles.btn(region === "US")} onClick={() => { setRegion("US"); }} disabled={region === "US"} type="button">
          Hollywood
        </button>
        <button className="btn" style={styles.btn(region === "IN")} onClick={() => { setRegion("IN"); }} disabled={region === "IN"} type="button">
          Kollywood
        </button>
      </div>
      <div style={styles.score}>
        Score: {score} / {played} {` (Max: ${MAX_QUESTIONS})`}
      </div>
      {showScore ? (
        <div
          style={styles.scoreScreen}
          className="subtle-pop"
          aria-label="Quiz End Score"
        >
          <div
            style={{
              fontSize: "1.25rem",
              fontWeight: 900,
              color: "#973caa",
              letterSpacing: ".012em",
              marginBottom: 4,
            }}
          >
            🎉 Session Complete!
          </div>
          <div style={{ fontWeight: 700, color: "#763195", fontSize: "1.09rem", margin: "8px 0" }}>
            Final Score:{" "}
            <span style={{ color: "#24974e" }}>{score}</span> / {MAX_QUESTIONS}
          </div>
          <button
            className="btn btn-large"
            style={{ fontWeight: 700, marginBottom: 7, fontSize: "1.11rem" }}
            onClick={() => resetState(region)}
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          {errMsg && <ErrorToast message={errMsg} />}
          {loading && (
            <div style={{ margin: "19px 0 16px", textAlign: "center" }}>
              <Loader size={32} />
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
                  style={{ width: 180, fontWeight: 590, fontSize: "1.09rem" }}
                  aria-label="Your guess"
                />
                <button
                  className="btn"
                  type="submit"
                  disabled={answered}
                  style={{ padding: "10px 17px", fontWeight: 700 }}
                >
                  {answered ? "✓" : "Submit"}
                </button>
              </form>
              {/* Feedback */}
              {feedback && (
                <div
                  style={
                    typeof feedback === "string"
                      ? styles.feedback(feedback.startsWith("🎉"))
                      : styles.feedback(false)
                  }
                >
                  {feedback}
                </div>
              )}
              <div style={{ marginTop: 13, color: "#a58cc2", fontSize: ".97rem", textAlign: "center" }}>
                {`Question ${played + (answered ? 0 : 1)} of ${MAX_QUESTIONS}`}
              </div>
            </>
          )}
          {!loading && !round && !errMsg && (
            <div style={{ margin: "18px 0", color: "#c75e77" }}>
              Oops, unable to load a round.{" "}
              <button className="btn" onClick={() => loadRound(true)}>
                Retry
              </button>
            </div>
          )}
        </>
      )}
      <div style={{
        marginTop: 25,
        color: "#a58cc2",
        textAlign: "center",
        fontWeight: 500,
        fontSize: ".96rem",
        letterSpacing: ".008em"
      }}>
        Guess the movie based on four clues: all are objects, props, or visible elements (never genres or themes). First version (CineQuest delivery).
      </div>
    </div>
  );
}
