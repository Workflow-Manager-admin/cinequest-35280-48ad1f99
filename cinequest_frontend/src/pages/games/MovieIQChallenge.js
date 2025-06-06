import React, { useState, useEffect, useRef } from "react";
import GameCard from "../../components/GameCard";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import { getIQChallengeRound, getRandomMovies, sampleN } from "../../tmdbGameUtils";
import BackButton from "../../components/BackButton";

// Fetch extra genre/keyword for more clue variety
async function fetchExtraMovieInfo(movieId) {
  try {
    const detailsRes = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.REACT_APP_TMDB_API_KEY}&append_to_response=keywords`
    );
    if (!detailsRes.ok) return {};
    const details = await detailsRes.json();
    let genres = details.genres ? details.genres.map((g) => g.name) : [];
    let keywords = [];
    if (details.keywords && Array.isArray(details.keywords.keywords)) {
      keywords = details.keywords.keywords.map(k => k.name);
    } else if (details.keywords && Array.isArray(details.keywords.results)) {
      keywords = details.keywords.results.map(k => k.name);
    }
    return { genres, keywords };
  } catch (e) {
    return { genres: [], keywords: [] };
  }
}

// Decide on a non-year clue
async function getNonYearClue(data) {
  const { director, movie } = data;
  let clues = [];
  if (director) clues.push({ type: "director", value: director });
  const more = await fetchExtraMovieInfo(movie.id);
  if (Array.isArray(more.genres) && more.genres.length > 0) {
    for (let g of more.genres) {
      clues.push({ type: "genre", value: g });
    }
  }
  if (Array.isArray(more.keywords) && more.keywords.length > 0) {
    for (let k of more.keywords) {
      clues.push({ type: "keyword", value: k });
    }
  }
  // Remove duplicates, blanks, prefer non-director clues if possible
  const uniqClues = [];
  for (let c of clues) {
    if (c && typeof c.value === "string" && c.value.trim()
      && !uniqClues.find(uc => uc.type === c.type && uc.value === c.value)) {
      uniqClues.push(c);
    }
  }
  const possible = uniqClues.filter(c => c.type !== "director");
  if (possible.length) {
    const idx = Math.floor(Math.random() * possible.length);
    return possible[idx];
  }
  return uniqClues.length ? uniqClues[0] : { type: "director", value: "" };
}

/**
 * PUBLIC_INTERFACE
 * MovieIQChallenge - Timed movie quiz: guess the movie from director/genre/keyword, multiple choice (NO YEAR),
 * limited to MAX_ROUNDS with final score/replay/reset.
 */
export default function MovieIQChallenge() {
  const MAX_ROUNDS = 18;
  const [region, setRegion] = useState("US");
  const [round, setRound] = useState(null);
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [usedMovieIds, setUsedMovieIds] = useState([]);
  const [showScore, setShowScore] = useState(false);
  const tryingRef = useRef(false);

  // Loads new round, stopping at end
  async function loadRound() {
    if (tryingRef.current) return;
    tryingRef.current = true;

    setLoading(true);
    setErrMsg("");
    setRound(null);
    setChoices([]);
    setSelected(null);
    setFeedback("");
    // End if limit reached
    if (played >= MAX_ROUNDS) {
      setShowScore(true);
      setLoading(false);
      tryingRef.current = false;
      return;
    }
    try {
      let data = null;
      let attempts = 0;
      do {
        data = await getIQChallengeRound(region);
        attempts++;
        if (!data || !data.movie || !data.movie.id) break;
      } while (usedMovieIds.includes(data.movie.id) && attempts < 10);

      if (!data || !data.movie || !data.director || !data.movie.title) {
        setErrMsg("Could not get a valid movie round. Try again?");
        setLoading(false);
        tryingRef.current = false;
        return;
      }

      // Select a non-year clue
      const clueObj = await getNonYearClue(data);
      // Decoy choices (skip used/correct movie)
      const realMovie = data.movie;
      let decoys = [];
      let tries = 0;
      while (decoys.length < 3 && tries < 10) {
        const extras = await getRandomMovies(region, 3, {});
        for (const m of extras) {
          if (
            m.id &&
            m.title &&
            m.id !== realMovie.id &&
            !usedMovieIds.includes(m.id) &&
            !decoys.some((d) => d.id === m.id) &&
            m.title.length > 4
          ) {
            decoys.push(m);
            if (decoys.length === 3) break;
          }
        }
        tries++;
      }
      let allChoices = sampleN([realMovie, ...decoys], 4);
      if (allChoices.length < 4) {
        allChoices = [...[realMovie, ...decoys]];
        for (let i = allChoices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
        }
      }

      setRound({
        clue: clueObj,
        answer: realMovie,
      });
      setChoices(allChoices.slice(0, 4));
      setUsedMovieIds(prev => [...prev, realMovie.id]);
      setLoading(false);
    } catch (e) {
      setErrMsg("Failed to load a quiz round. Please try again.");
      setLoading(false);
    }
    tryingRef.current = false;
  }

  // On mount/region: reset everything
  useEffect(() => {
    setUsedMovieIds([]);
    setScore(0);
    setPlayed(0);
    setShowScore(false);
    setSelected(null);
    setFeedback("");
    loadRound();
    // eslint-disable-next-line
  }, [region]);

  // Per-selection: handle score, advance or end after a delay
  useEffect(() => {
    if (!selected || !round) return;
    // If ending, show score screen after delay
    if (played + 1 >= MAX_ROUNDS) {
      const timeout = setTimeout(() => {
        setPlayed(p => p + 1);
        setShowScore(true);
        setRound(null);
        setChoices([]);
        setSelected(null);
        setFeedback("");
        setLoading(false);
      }, 1200);
      return () => clearTimeout(timeout);
    } else {
      // Next question
      const timeout = setTimeout(() => {
        setPlayed((p) => p + 1);
        setSelected(null);
        setFeedback("");
        loadRound();
      }, feedback === "correct" ? 1200 : 1800);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line
  }, [feedback]);

  // Replay session logic
  function handleReplay() {
    setScore(0);
    setPlayed(0);
    setShowScore(false);
    setUsedMovieIds([]);
    setSelected(null);
    setFeedback("");
    setErrMsg("");
    setRound(null);
    setChoices([]);
    loadRound();
  }

  // --- UI/STYLE constants ---
  const styles = {
    container: {
      maxWidth: 530,
      margin: "46px auto 0",
      background: "#fff",
      borderRadius: 22,
      boxShadow: "0 6px 28px 0 rgba(151,60,170,.09)",
      padding: "38px 18px 32px",
      minHeight: 330,
      animation: "fadeInPop 0.5s"
    },
    row: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 15,
      justifyContent: "center",
      margin: "14px 0 10px"
    },
    clueBox: {
      background: "#edeafa",
      color: "#763195",
      padding: "17px 20px 14px",
      borderRadius: 13,
      fontSize: "1.16rem",
      fontWeight: 700,
      marginBottom: 17,
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.07)",
      letterSpacing: ".009em",
      textAlign: "center"
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
      fontSize: "1.05rem",
      margin: "0 0 12px",
      letterSpacing: ".009em",
    }
  };

  function handleChoice(movie) {
    if (selected || loading || showScore) return;
    setSelected(movie);
    if (movie.id === round.answer.id) {
      setScore((s) => s + 1);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }
  }

  function renderClueBox(clue) {
    if (!clue) return null;
    if (clue.type === "director") {
      return (
        <>
          <span style={{ color: "#763195", fontWeight: 800 }}>Director</span>:{" "}
          <span style={{ color: "#973caa", fontWeight: 750 }}>{clue.value || "?"}</span>
        </>
      );
    }
    if (clue.type === "genre") {
      return (
        <>
          <span style={{ color: "#763195", fontWeight: 800 }}>Genre</span>:{" "}
          <span style={{ color: "#973caa", fontWeight: 750 }}>{clue.value}</span>
        </>
      );
    }
    if (clue.type === "keyword") {
      return (
        <>
          <span style={{ color: "#763195", fontWeight: 800 }}>Keyword</span>:{" "}
          <span style={{ color: "#973caa", fontWeight: 750 }}>{clue.value}</span>
        </>
      );
    }
    // Fallback
    return (
      <>
        <span style={{ color: "#763195", fontWeight: 800 }}>Clue</span>:{" "}
        <span style={{ color: "#973caa", fontWeight: 750 }}>{clue.value || "?"}</span>
      </>
    );
  }

  const posterUrl = poster => poster ? `https://image.tmdb.org/t/p/w185${poster}` : null;

  return (
    <div className="game-container" style={styles.container}>
      <BackButton />
      <h2 className="title" style={{ color: "#973caa", margin: "0 0 9px" }}>
        Movie IQ Challenge
      </h2>
      <div style={styles.regionBar}>
        <button
          className="btn"
          style={styles.btn(region === "US")}
          onClick={() => { setRegion("US"); handleReplay(); }}
          disabled={region === "US" && !showScore}
          type="button"
        >
          Hollywood
        </button>
        <button
          className="btn"
          style={styles.btn(region === "IN")}
          onClick={() => { setRegion("IN"); handleReplay(); }}
          disabled={region === "IN" && !showScore}
          type="button"
        >
          Kollywood
        </button>
      </div>
      <div style={styles.score}>
        Score: {score} / {played}{` (Max: ${MAX_ROUNDS})`}
      </div>
      {showScore ? (
        <div
          style={{
            background: "#edeafa",
            borderRadius: 15,
            padding: "35px 18px 29px",
            boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.09)",
            textAlign: "center",
            margin: "32px auto 9px",
            maxWidth: 380,
            animation: "fadeInPop 0.54s cubic-bezier(.41,.81,.52,1)"
          }}
          className="subtle-pop"
          aria-label="Quiz End Score"
        >
          <div
            style={{
              fontSize: "1.49rem",
              fontWeight: 900,
              color: "#973caa",
              letterSpacing: ".012em",
              marginBottom: 7,
            }}
          >
            🎉 Challenge Complete!
          </div>
          <div style={{ fontWeight: 700, color: "#763195", fontSize: "1.18rem", margin: "10px 0" }}>
            Final Score: <span style={{ color: "#24974e" }}>{score}</span> / {MAX_ROUNDS}
          </div>
          <div style={{ margin: "7px 0 20px", color: "#8e83a2", fontSize: ".99rem" }}>
            {score === MAX_ROUNDS
              ? "Perfect movie IQ — Outstanding memory!"
              : score >= 13
              ? "Awesome! You have great recall and movie sense."
              : score >= 7
              ? "Nice try! Keep honing your movie brain!"
              : "Give it another shot to improve your score!"}
          </div>
          <button
            className="btn btn-large"
            style={{ fontWeight: 700, marginBottom: 7, marginTop: 8, fontSize: "1.12rem" }}
            onClick={handleReplay}
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          {errMsg && <ErrorToast message={errMsg} />}
          {loading && (
            <div style={{ margin: "30px 0 18px", textAlign: "center" }}>
              <Loader size={32} />
            </div>
          )}
          {!loading && round && choices.length ? (
            <>
              <div style={styles.clueBox}>
                {renderClueBox(round.clue)}
              </div>
              <div style={styles.row}>
                {choices.map((movie) => {
                  const isAnswer = selected && movie.id === round.answer.id;
                  const wrong = selected && selected.id === movie.id && !isAnswer;
                  return (
                    <GameCard
                      key={movie.id}
                      movie
                      title={movie.title}
                      poster={posterUrl(movie.poster_path)}
                      year=""
                      description={movie.overview}
                      onClick={() => handleChoice(movie)}
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
                    marginTop: 9,
                    marginBottom: 2,
                    minHeight: 24,
                    letterSpacing: ".007em"
                  }}
                  className="subtle-pop"
                >
                  {feedback === "correct"
                    ? "🎉 Correct!"
                    : `❌ Wrong! The answer was: ${round.answer.title}`}
                </div>
              )}
              <div style={{ marginTop: 14, color: "#a58cc2", fontSize: ".99rem", textAlign: "center" }}>
                {played + 1 <= MAX_ROUNDS
                  ? `Question ${played + 1} of ${MAX_ROUNDS}`
                  : `Quiz Complete`}
              </div>
            </>
          ) : !errMsg && (
            <div style={{ margin: "30px 0", textAlign: "center", color: "#8e83a2" }}>
              Let's see if you recognize the movie from just the clue!
            </div>
          )}
        </>
      )}
      {!loading && !errMsg && (!round || choices.length < 2) && !showScore && (
        <div style={{ margin: "24px 0", color: "#c75e77" }}>
          Could not load the quiz.{" "}
          <button className="btn" onClick={loadRound} style={{ padding: "7px 16px", fontWeight: 700 }}>
            Retry
          </button>
        </div>
      )}
      <div style={{
        marginTop: 30,
        color: "#a58cc2",
        textAlign: "center",
        fontWeight: 500,
        fontSize: ".98rem",
        letterSpacing: ".008em"
      }}>
        Guess the movie title from the clue. Sharpen your movie IQ!
      </div>
    </div>
  );
}
