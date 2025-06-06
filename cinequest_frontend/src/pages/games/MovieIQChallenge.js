import React, { useState, useEffect } from "react";
import GameCard from "../../components/GameCard";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import { getIQChallengeRound, getRandomMovies, sampleN } from "../../tmdbGameUtils";

// PUBLIC_INTERFACE
// MovieIQChallenge - Timed movie quiz: guess the movie from year+director, multiple choice
export default function MovieIQChallenge() {
  const [region, setRegion] = useState("US"); // "US" (Hollywood) | "IN" (Kollywood)
  const [round, setRound] = useState(null); // { movie, director, year }
  const [choices, setChoices] = useState([]); // Array of movies as answer options
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);

  // Helper: fetch a new round (movie + director + year + decoy titles)
  async function loadRound() {
    setLoading(true);
    setErrMsg("");
    setRound(null);
    setChoices([]);
    setSelected(null);
    setFeedback("");
    try {
      // get { movie, director, year }
      const data = await getIQChallengeRound(region);
      if (!data || !data.movie || !data.year || !data.director || !data.movie.title) {
        setErrMsg("Could not get a valid movie round. Try again?");
        setLoading(false);
        return;
      }
      // get decoy options
      const realMovie = data.movie;
      let decoys = [];
      let tries = 0;
      // Pick other movies (wrong answers)
      while (decoys.length < 3 && tries < 10) {
        // grab random movies from TMDB
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
      // If fallback, shuffle array
      if (allChoices.length < 4) {
        allChoices = [...[realMovie, ...decoys]];
        for (let i = allChoices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
        }
      }
      setRound({
        director: data.director,
        year: data.year,
        answer: realMovie,
      });
      setChoices(allChoices.slice(0, 4));
      setLoading(false);
    } catch (e) {
      setErrMsg("Failed to load a quiz round. Please try again.");
      setLoading(false);
    }
  }

  // On mount or region change, start a new round
  useEffect(() => {
    loadRound();
    // eslint-disable-next-line
  }, [region]);

  // After answer, auto-load next
  useEffect(() => {
    if (!selected || !round) return;
    const timeout = setTimeout(() => {
      loadRound();
    }, feedback === "correct" ? 1200 : 1800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line
  }, [feedback]);

  // UI styles
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

  // Choice button click logic
  function handleChoice(movie) {
    if (selected || loading) return;
    setSelected(movie);
    setPlayed((n) => n + 1);
    if (movie.id === round.answer.id) {
      setScore((s) => s + 1);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }
  }

  // adapt image url for GameCard
  const posterUrl = poster => poster ? `https://image.tmdb.org/t/p/w185${poster}` : null;

  return (
    <div className="game-container" style={styles.container}>
      <h2 className="title" style={{ color: "#973caa", margin: "0 0 9px" }}>
        Movie IQ Challenge
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
      <div style={styles.score}>Score: {score} / {played}</div>
      {errMsg && <ErrorToast message={errMsg} />}
      {loading ? (
        <div style={{ margin: "30px 0 18px", textAlign: "center" }}>
          <Loader size={32} />
        </div>
      ) : round && choices.length ? (
        <>
          <div style={styles.clueBox}>
            <span style={{ color: "#763195", fontWeight: 800 }}>Director</span>:{" "}
            <span style={{ color: "#973caa", fontWeight: 750 }}>{round.director || "?"}</span>
            <span style={{ margin: "0 12px" }}>|</span>
            <span style={{ color: "#763195", fontWeight: 800 }}>Year</span>:{" "}
            <span style={{ color: "#973caa", fontWeight: 750 }}>{round.year || "?"}</span>
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
                  year={movie.release_date ? String(movie.release_date).slice(0, 4) : ""}
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
        </>
      ) : !errMsg && (
        <div style={{ margin: "30px 0", textAlign: "center", color: "#8e83a2" }}>
          Let's see if you recognize the movie from just the year and director!
        </div>
      )}
      {!loading && !errMsg && (!round || choices.length < 2) && (
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
        Guess the movie title from the year and director. Sharpen your movie IQ!
      </div>
    </div>
  );
}
