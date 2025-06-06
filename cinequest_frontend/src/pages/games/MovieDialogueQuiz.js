import React, { useEffect, useState } from "react";
import GameCard from "../../components/GameCard";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import { fetchMoviesByRegion } from "../../tmdbApi";
import BackButton from "../../components/BackButton";

// PUBLIC_INTERFACE
// MovieDialogueQuiz - TMDB-powered multiple-choice quiz with enhanced clue logic:
// - Avoid clues that reveal movie/character names or spoil the main plot
// - Prefers taglines/keywords/filtered overview from TMDB via API
// - Redacts forbidden terms in clues for challenging gameplay

export default function MovieDialogueQuiz() {
  const MAX_QUESTIONS = 18;
  const [region, setRegion] = useState("US");
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [showScore, setShowScore] = useState(false); // End-of-session score screen

  // Helper: redact forbidden terms (movie title/keywords) in clue
  function redactClue(text, forbidden) {
    if (!text || !forbidden || !forbidden.length) return text;
    let clue = text;
    forbidden.forEach(term => {
      if (term && term.length > 1) {
        const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gi");
        clue = clue.replace(regex, "_____");
      }
    });
    return clue;
  }

  // Helper: get keywords and details from TMDB for improved clues
  async function fetchExtraClues(mid) {
    try {
      // Get details (tagline, overview)
      const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${mid}?api_key=${process.env.REACT_APP_TMDB_API_KEY}`);
      const details = await detailRes.json();
      // Get keywords
      const keywordsRes = await fetch(`https://api.themoviedb.org/3/movie/${mid}/keywords?api_key=${process.env.REACT_APP_TMDB_API_KEY}`);
      const kwJson = await keywordsRes.json();
      let keywords = [];
      if (kwJson && (Array.isArray(kwJson.keywords) || Array.isArray(kwJson.results))) {
        // TMDB uses .keywords or .results
        keywords = kwJson.keywords || kwJson.results || [];
      }
      return {
        tagline: details.tagline || "",
        overview: details.overview || "",
        keywords: (keywords || []).map(k => k.name).filter(Boolean),
      };
    } catch {
      return { tagline: "", overview: "", keywords: [] };
    }
  }

  // Quiz round generator with advanced clue logic
  async function getRandomQuizRound(region = "US", decoyCount = 3) {
    let tries = 0;
    let movie = null;
    let details = null;
    // Try to fetch a random movie with a tagline, overview, or keywords
    while (!movie && tries < 8) {
      try {
        const page = 1 + Math.floor(Math.random() * 5);
        const res = await fetchMoviesByRegion(region, { page });
        if (!res || !res.results) break;
        // Robust filter: for region "IN", only Tamil
        const candidates = res.results.filter(
          (m) =>
            m &&
            m.title && m.id &&
            (
              (typeof m.tagline === "string" && m.tagline.length > 10) ||
              (typeof m.overview === "string" && m.overview.length > 20) ||
              (typeof m.id === "number")
            ) &&
            m.title.length > 3 &&
            (region !== "IN" || m.original_language === "ta")
        );
        if (candidates.length === 0) {
          tries++;
          continue;
        }
        movie = candidates[Math.floor(Math.random() * candidates.length)];
        details = await fetchExtraClues(movie.id);
      } catch {
        break;
      }
      tries++;
    }
    if (!movie) return null;

    // Clue filtering: block movie name and keywords
    let forbidden = [movie.title, movie.original_title, ...(details && details.keywords ? details.keywords : [])];

    // Clue selection preference: tagline > non-forbidden keyword > overview > fallback
    let candidates = [];
    if (details && details.tagline && details.tagline.length > 10) {
      candidates.push(details.tagline);
    }
    if (details && details.keywords && details.keywords.length > 0) {
      details.keywords.forEach(k => {
        if (!forbidden.some(ft => ft && k && ft.toLowerCase() === k.toLowerCase()))
          candidates.push(k);
      });
    }
    if (details && details.overview && details.overview.length > 20) {
      candidates.push(details.overview);
    }
    if (movie.tagline && movie.tagline.length > 10) candidates.push(movie.tagline);
    if (movie.overview && movie.overview.length > 20) candidates.push(movie.overview);

    // Exclude clues with forbidden terms (case insensitive)
    function clueAcceptable(clue) {
      if (!clue) return false;
      const lowered = clue.toLowerCase();
      return !forbidden.some(t => !!t && t.length > 1 && lowered.includes(t.toLowerCase()));
    }
    let clue = candidates.find(clueAcceptable);

    // If no clue passes, redact the forbidden terms in the first candidate
    if (!clue && candidates.length) {
      clue = redactClue(candidates[0], forbidden);
    }
    if (!clue) clue = "Guess the movie based on this mysterious clue!";

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
    // Shuffle answers
    const allChoices = shuffleArray([movie, ...decoys.slice(0, decoyCount)]);
    return {
      text: clue,
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

  // Load new round on region switch/mount
  useEffect(() => {
    loadRound();
    // eslint-disable-next-line
  }, [region]);

  // User choice handler
  function handleChoose(movie) {
    if (selected || showScore) return;

    setSelected(movie);

    // Only increment played (i.e. question number) if we have not reached the max
    if (played < MAX_QUESTIONS) {
      setPlayed((p) => p + 1);
    }

    // Determine if this is the final question
    const nextPlayed = played + 1;
    const isFinal = nextPlayed >= MAX_QUESTIONS;

    if (movie.id === round.answer.id) {
      setScore((s) => s + 1);
      setFeedback("correct");
      if (isFinal) {
        setTimeout(() => {
          setShowScore(true);
          setRound(null);
        }, 650);
      } else {
        setTimeout(() => {
          loadRound();
        }, 850);
      }
    } else {
      setFeedback("wrong");
      if (isFinal) {
        setTimeout(() => {
          setShowScore(true);
          setRound(null);
        }, 900);
      } else {
        setTimeout(() => {
          loadRound();
        }, 1200);
      }
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
      <BackButton />
      <h2 className="title" style={{ color: "#973caa", margin: "0 0 12px" }}>
        Movie Dialogue Quiz
      </h2>
      <div style={styles.regionBar}>
        <button
          className="btn"
          style={styles.btn(region === "US")}
          onClick={() => {
            setRegion("US");
            setScore(0);
            setPlayed(0);
            setShowScore(false);
            setSelected(null);
            setFeedback(null);
            loadRound();
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
            setScore(0);
            setPlayed(0);
            setShowScore(false);
            setSelected(null);
            setFeedback(null);
            loadRound();
          }}
          disabled={region === "IN"}
          type="button"
        >
          Kollywood
        </button>
      </div>
      <div style={styles.score}>
        Score: {score} / {played}
        {` (Max: ${MAX_QUESTIONS})`}
      </div>
      {showScore ? (
        <div
          style={{
            background: "#edeafa",
            borderRadius: 15,
            padding: "31px 13px 25px",
            boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.09)",
            textAlign: "center",
            margin: "35px auto 12px",
            maxWidth: 370,
            animation: "fadeInPop 0.54s cubic-bezier(.41,.81,.52,1)",
          }}
          className="subtle-pop"
          aria-label="Quiz End Score"
        >
          <div
            style={{
              fontSize: "1.51rem",
              fontWeight: 900,
              color: "#973caa",
              letterSpacing: ".013em",
              marginBottom: 6,
            }}
          >
            🎉 Quiz Complete!
          </div>
          <div style={{ fontWeight: 700, color: "#763195", fontSize: "1.19rem", margin: "10px 0" }}>
            Final Score: <span style={{ color: "#24974e" }}>{score}</span> / {MAX_QUESTIONS}
          </div>
          <div style={{ margin: "7px 0 20px", color: "#8e83a2", fontSize: ".99rem" }}>
            {score === MAX_QUESTIONS
              ? "Perfect score – You're a movie quote genius!"
              : score >= 13
              ? "Awesome! You really know your movies."
              : score >= 7
              ? "Solid job! Keep watching more films!"
              : "Give it another try for a higher score."}
          </div>
          <button
            className="btn btn-large"
            style={{ fontWeight: 700, marginBottom: 7, marginTop: 8, fontSize: "1.14rem" }}
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
                      // Kollywood: show Romanized title for choices
                      title={
                        region === "IN"
                          ? require("../../tamilTransliterator").getKollywoodDisplayAnswer(movie)
                          : movie.title
                      }
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
                    : `❌ Wrong!`}
                </div>
              )}
              {/* Answer revealed only if 'Reveal Answer' is triggered */}
              {selected && feedback !== "correct" && feedback !== "wrong" && round && (
                <></>
              )}
              <div style={{ marginTop: 14, color: "#a58cc2", fontSize: ".99rem", textAlign: "center" }}>
                {played < MAX_QUESTIONS
                  ? `Question ${played + 1} of ${MAX_QUESTIONS}`
                  : `Quiz Complete`}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
