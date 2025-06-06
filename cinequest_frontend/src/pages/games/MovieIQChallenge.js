import React, { useState, useEffect } from "react";
import GameCard from "../../components/GameCard";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import { getIQChallengeRound, getRandomMovies, sampleN } from "../../tmdbGameUtils";
import BackButton from "../../components/BackButton";

// PUBLIC_INTERFACE
// MovieIQChallenge: v1 implementation: Trivia based on director and year, user picks from 4 shuffled movies.

export default function MovieIQChallenge() {
  const MAX_ROUNDS = 10;
  const [region, setRegion] = useState("US");
  const [round, setRound] = useState(null);
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [showScore, setShowScore] = useState(false);

  // Loads new round, stopping at end
  async function loadRound() {
    setLoading(true);
    setErrMsg("");
    setRound(null);
    setChoices([]);
    setSelected(null);
    setFeedback(null);
    if (played >= MAX_ROUNDS) {
      setShowScore(true);
      setLoading(false);
      return;
    }
    try {
      let data = null;
      let attempts = 0;
      do {
        data = await getIQChallengeRound(region);
        attempts++;
        if (!data || !data.movie || !data.movie.id) break;
      } while (attempts < 6 && (!data || !data.movie || !data.movie.id));
      if (!data || !data.movie || !data.director || !data.movie.title) {
        setErrMsg("Could not get a valid movie round. Try again?");
        setLoading(false);
        return;
      }

      const realMovie = data.movie;
      let decoys = [];
      let tries = 0;
      while (decoys.length < 3 && tries < 8) {
        const extras = await getRandomMovies(region, 3, {});
        for (const m of extras) {
          if (
            m.id &&
            m.title &&
            m.id !== realMovie.id &&
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
        // naive shuffle
        for (let i = allChoices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
        }
      }

      setRound({
        clue: { director: data.director, year: data.year },
        answer: realMovie,
      });
      setChoices(allChoices.slice(0, 4));
      setLoading(false);
    } catch (e) {
      setErrMsg("Failed to load a quiz round. Please try again.");
      setLoading(false);
    }
  }

  // On mount/region: reset everything
  useEffect(() => {
    setScore(0);
    setPlayed(0);
    setShowScore(false);
    setSelected(null);
    setFeedback(null);
    loadRound();
    // eslint-disable-next-line
  }, [region]);

  // User pick
  function handleChoice(movie) {
    if (selected || loading || showScore) return;
    setSelected(movie);
    if (movie.id === round.answer.id) {
      setScore((s) => s + 1);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }
    setPlayed((p) => p + 1);
    setTimeout(() => {
      if (played + 1 >= MAX_ROUNDS) {
        setShowScore(true);
        setRound(null);
      } else {
        loadRound();
      }
    }, 1000);
  }

  // --- UI/STYLE constants ---
  const styles = {
    container: {
      maxWidth: 500,
      margin: "46px auto 0",
      background: "#fff",
      borderRadius: 18,
      boxShadow: "0 6px 28px 0 rgba(151,60,170,0.09)",
      padding: "33px 16px 28px",
      minHeight: 300,
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
      padding: "17px 18px 14px",
      borderRadius: 12,
      fontSize: "1.07rem",
      fontWeight: 700,
      marginBottom: 12,
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.08)",
      letterSpacing: ".009em",
      textAlign: "center"
    },
    regionBar: {
      display: "flex",
      gap: 10,
      marginBottom: 14,
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
      <h2 className="title" style={{ color: "#973caa", margin: "0 0 9px" }}>
        Movie IQ Challenge
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
        Score: {score} / {played} {(MAX_ROUNDS ? `(Max: ${MAX_ROUNDS})` : "")}
      </div>
      {showScore ? (
        <div
          style={{
            background: "#edeafa",
            borderRadius: 13,
            padding: "31px 13px 23px",
            boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.09)",
            textAlign: "center",
            margin: "37px auto 10px",
            maxWidth: 350,
            animation: "fadeInPop 0.54s cubic-bezier(.41,.81,.52,1)"
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
              marginBottom: 7
            }}
          >
            🎉 Challenge Complete!
          </div>
          <div style={{ fontWeight: 700, color: "#763195", fontSize: "1.14rem", margin: "8px 0" }}>
            Final Score: <span style={{ color: "#24974e" }}>{score}</span> / {MAX_ROUNDS}
          </div>
          <button
            className="btn btn-large"
            style={{ fontWeight: 700, marginBottom: 7, fontSize: "1.12rem" }}
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
            <div style={{ margin: "22px 0 16px", textAlign: "center" }}>
              <Loader size={30} />
            </div>
          )}
          {!loading && round && choices.length ? (
            <>
              <div style={styles.clueBox}>
                <span style={{ color: "#973caa", fontWeight: 800 }}>
                  Director
                </span>: <span style={{ fontWeight: 700 }}>{round.clue.director}</span>
                {"  "} &bull; {"  "}
                <span style={{ color: "#c1961c", fontWeight: 800 }}>Year</span>:{" "}
                <span style={{ fontWeight: 700 }}>{round.clue.year}</span>
              </div>
              <div style={styles.row}>
                {choices.map((movie) => {
                  const isAnswer = selected && movie.id === round.answer.id;
                  const wrong = selected && selected.id === movie.id && !isAnswer;
                  return (
                    <GameCard
                      key={movie.id}
                      title={movie.title}
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
                    fontSize: "1.09rem",
                    textAlign: "center",
                    marginTop: 9,
                    marginBottom: 2,
                    minHeight: 22,
                    letterSpacing: ".007em"
                  }}
                  className="subtle-pop"
                >
                  {feedback === "correct"
                    ? "🎉 Correct!"
                    : `❌ Wrong! The answer was ${round.answer.title}`}
                </div>
              )}
              <div style={{ marginTop: 14, color: "#a58cc2", fontSize: ".99rem", textAlign: "center" }}>
                {played + 1 <= MAX_ROUNDS
                  ? `Question ${played + 1} of ${MAX_ROUNDS}`
                  : `Quiz Complete`}
              </div>
            </>
          ) : !errMsg && (
            <div style={{ margin: "18px 0", textAlign: "center", color: "#8e83a2" }}>
              Let's see if you recognize the movie from just the clue!
            </div>
          )}
        </>
      )}
      <div style={{
        marginTop: 16,
        color: "#a58cc2",
        textAlign: "center",
        fontWeight: 500,
        fontSize: ".98rem",
        letterSpacing: ".008em"
      }}>
        Guess the movie title from director and year. First version (CineQuest delivery).
      </div>
    </div>
  );
}
