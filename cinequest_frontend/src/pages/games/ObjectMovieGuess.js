import React, { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import BackButton from "../../components/BackButton";

// Replacement for getObjectGuessRound with strict object/prop/place-only clue logic.
// Uses TMDB API directly for advanced clue filtering.
async function getStrictObjectCluesRound(region = "US") {
  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const posterBase = "https://image.tmdb.org/t/p/w185";
  // Helper to fetch movie by region
  async function randomMovie() {
    const page = 1 + Math.floor(Math.random() * 3);
    const url = new URL("https://api.themoviedb.org/3/discover/movie");
    url.searchParams.append("api_key", API_KEY);
    url.searchParams.append("region", region);
    url.searchParams.append("with_original_language", region === "IN" ? "ta" : "en");
    url.searchParams.append("sort_by", "popularity.desc");
    url.searchParams.append("page", page);
    const resp = await fetch(url.toString());
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data && Array.isArray(data.results) && data.results.length) {
      // Filter only movies with poster for UX and remove Kollywood "Anagarigam"
      const filtered = data.results.filter(
        m =>
          !!m.poster_path &&
          m.title &&
          !(
            region === "IN" &&
            m.title.trim().toLowerCase() === "anagarigam"
          )
      );
      if (filtered.length) {
        return filtered[Math.floor(Math.random() * filtered.length)];
      }
    }
    return null;
  }

  // Given a movie, fetch all relevant object clues
  async function getConcreteObjects(movie) {
    // Fetch full details & credits & keywords
    const [details, credits, keywordsResp] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}`).then(r => r.ok ? r.json() : {}),
      fetch(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${API_KEY}`).then(r => r.ok ? r.json() : {}),
      fetch(`https://api.themoviedb.org/3/movie/${movie.id}/keywords?api_key=${API_KEY}`).then(r => r.ok ? r.json() : {})
    ]);
    let clues = [];

    // 1. TMDB Keywords - filter for object/thing/animal/place type (not abstract/thematic)
    let kwArr = [];
    if (keywordsResp && (Array.isArray(keywordsResp.keywords) || Array.isArray(keywordsResp.results))) {
      kwArr = keywordsResp.keywords || keywordsResp.results || [];
    }
    // Only keep keywords that look like tangible things/places
    const concreteKW = kwArr
      .map(k => k.name)
      .filter(
        name =>
          name &&
          name.length <= 32 &&
          /^[\w\s\-'.:,]+$/.test(name) &&
          !/(genre|romance|drama|comedy|biography|family|action|thriller|history|animation|mystery|crime|film|movie|television|tv|cinema|adventure|fantasy|science\s?fiction|superhero|war|horror|documentary|music|musical|western|western|sports?|biographical|melodrama|independent|children|noir)/i.test(name) &&
          !/story|love|marriage|childhood|revenge|survival|escape|based on|culture|tradition|life|friendship|relationships|journey|spirit|destiny|past|future|good|evil|hero|villain|justice|truth|lies|violence|betrayal|family|emotion|social|coming of age|dark/i.test(name)
      );

    clues.push(...concreteKW);

    // 2. Cast - main characters' first names, but only unique, non-spoilery, and visually likely (skip if name is in title)
    if (credits && credits.cast && credits.cast.length > 0) {
      // Only use the real character name or actor if it's a recognizable object/prop or costume (skip real/people names unless iconic)
      // Example: Use "Superman suit" but not "John Smith"
      for (const person of credits.cast.slice(0, 8)) {
        if (
          person.character &&
          (/\b(suit|blade|hammer|wheelchair|mask|robot|cobra|cape|ring|gun|car|bike|cycle|sari|uniform|pot|tattoo|jacket|book|diary|statue|painting|sword|shield|cap|turban|crown|hat|shoe|doll|horse|train|computer|phone|tree|dog|snake|glass|camera|drum|guitar|saxophone|pistol|pen|notebook|amulet|necklace|bottle|fan|sign|bag|vase|lamp|stick|plaque|hat|torch)\b/i.test(person.character))
        ) {
          const phrase = person.character;
          if (!clues.some(c => c.toLowerCase() === phrase.toLowerCase())) {
            clues.push(phrase);
            if (clues.length > 7) break;
          }
        }
      }
    }

    // 3. Title words (if proper nouns or concrete object/place terms in title)
    // e.g. "Cobra", "Green Mile", "Lion", "Panther", "Pot"
    if (movie.title) {
      const titleWords = movie.title
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(
          w =>
            w.length > 2 &&
            /^[A-Z]/.test(w) && // likely a noun/proper
            !/(Film|Story|Movie|Comedy|Drama|Action|Thriller|Hindi|Tamil|English|Part|The|Of|In|With|And|For|An)$/i.test(w)
        );
      clues.push(...titleWords);
    }

    // 4. Tagline/overview - mine for object clues (less common, skip unless specific prop/object found)
    if (details && details.tagline && details.tagline.length > 0) {
      const tagObjs = [];
      const words = details.tagline
        .replace(/[^\w\s\-]/g, "")
        .split(/\s+/)
        .map(w => w.trim());
      for (const w of words) {
        if (
          w.length > 2 &&
          /^[A-Z]/.test(w) &&
          !/(Love|Man|Woman|Film|Story|Movie|Comedy|Drama|Action|Thriller|Hindi|Tamil|English|Part|The|Of|In|With|And|For|An)$/i.test(w)
        ) {
          tagObjs.push(w);
        }
      }
      // Add filtered tagline words to clues
      clues.push(...tagObjs);
    }

    // 5. Production design - sometimes TMDB has a 'production_design' crew, rare, so skip for now.

    // De-dup, limit to top 4, prefer more "object-like" clues (short, single noun), pick random order
    let uniq = [];
    for (let c of clues) {
      c = (c || "").trim();
      if (
        c.length > 1 &&
        isNaN(Number(c)) &&
        !uniq.some(u => u.toLowerCase() === c.toLowerCase())
      )
        uniq.push(c);
      if (uniq.length === 8) break;
    }

    // Prefer "object-like" clues (single-word, or short phrase likely to be a tangible thing/place/prop)
    uniq = uniq.filter(
      c =>
        /\b(\w{2,})\b/.test(c) &&
        !/(film|movie|genre|story|drama|romance|action|thriller|history|comedy|truth|life|love|family|hero|dark|good|evil|justice|spirit|tradition|journey|friendship|relationship)/i.test(c)
    );

    // Restore to 4 if not enough, randomly sample more from concreteKW/title/tag, but never genre
    if (uniq.length > 4) {
      // Shuffle picks
      for (let i = uniq.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniq[i], uniq[j]] = [uniq[j], uniq[i]];
      }
      uniq = uniq.slice(0, 4);
    }

    // Fallback if still <2, return empty (will retry outer)
    return uniq.length >= 2 ? uniq.slice(0, 4) : [];
  }

  // Try to get a movie with at least 2 concrete clues
  let movie = null;
  let clues = [];
  let tries = 0;
  while (tries < 8 && clues.length < 2) {
    movie = await randomMovie();
    if (!movie) break;
    clues = await getConcreteObjects(movie);
    tries++;
  }
  if (!movie || clues.length < 2) return null; // Fallback
  return { movie, objects: clues };
}

/**
 * PUBLIC_INTERFACE
 * ObjectMovieGuess - Guess the movie from four TMDB-powered object/prop/place clues (never genre!).
 * Clues use TMDB keywords, prop/costume/animal/place terms from cast/tagline/title, never genre,
 * and only visually or physically present elements.
 */
export default function ObjectMovieGuess() {
  // Implements 18-question session limit, score screen, progress, and robust replay/reset.
  const MAX_QUESTIONS = 18;
  const [region, setRegion] = useState("US"); // "US" (Hollywood) | "IN" (Kollywood)
  const [round, setRound] = useState(null); // { movie, objects }
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0); // Number of questions attempted
  const [hintReveal, setHintReveal] = useState(false);
  const [showScore, setShowScore] = useState(false); // Final result screen

  // State reset for region switch or replay
  function resetState(nextRegion = region) {
    setScore(0);
    setPlayed(0);
    setShowScore(false);
    setErrMsg("");
    setFeedback("");
    setAnswered(false);
    setInput("");
    setHintReveal(false);
    setRound(null);
    setLoading(false);
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
    setHintReveal(false);
    try {
      const res = await getStrictObjectCluesRound(region);
      if (!res || !res.movie || !res.objects || res.objects.length < 2) {
        setErrMsg("Couldn't fetch enough non-genre clues—try again?");
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
    loadRound(true);
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

    // Accept answer if the guess matches the movie title, ignoring punctuation/case
    const normalize = s =>
      (s || "")
        .toLowerCase()
        .replace(/[\W_]+/g, "")
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
      setFeedback(`❌ Wrong! The answer was: ${round && round.movie.title}`);
    }

    // If session ends after this, go to score screen; otherwise load next round.
    const nextPlayed = played + 1;
    if (nextPlayed >= MAX_QUESTIONS) {
      setTimeout(() => {
        setShowScore(true);
        setRound(null);
        setHintReveal(false);
      }, correct ? 1100 : 1700);
    } else {
      setTimeout(() => {
        loadRound();
      }, correct ? 1300 : 1900);
    }
  }

  // UI styles (+ score screen)
  const styles = {
    container: {
      maxWidth: 530,
      margin: "46px auto 0",
      background: "#fff",
      borderRadius: 22,
      boxShadow: "0 6px 28px 0 rgba(151,60,170,.09)",
      padding: "38px 18px 32px",
      minHeight: 330,
      animation: "fadeInPop 0.56s cubic-bezier(.41,.81,.52,1)",
    },
    regionBar: {
      display: "flex",
      gap: 13,
      marginBottom: 12,
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
      margin: "18px 0 10px 0",
      justifyContent: "center",
    },
    clueBox: {
      background: "#edeafa",
      borderRadius: 13,
      textAlign: "center",
      fontSize: "1.15rem",
      fontWeight: 700,
      color: "#481d77",
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.09)",
      padding: "20px 12px",
      letterSpacing: ".011em",
      minHeight: 54,
      userSelect: "none",
    },
    form: {
      display: "flex",
      flexDirection: "row",
      gap: 12,
      margin: "15px 0",
      alignItems: "center",
    },
    score: {
      fontWeight: 700,
      color: "#973caa",
      fontSize: "1.07rem",
      margin: "0 0 12px",
      letterSpacing: ".009em",
    },
    revealBtn: {
      background: "#fffdfa",
      border: "1.6px dashed #c8b9db",
      color: "#973caa",
      padding: "7px 13px",
      borderRadius: 12,
      fontWeight: 700,
      fontSize: ".97rem",
      margin: "6px 0",
      cursor: "pointer",
      textDecoration: "underline",
    },
    posterThumb: {
      display: "block",
      width: 92,
      height: 138,
      borderRadius: 13,
      margin: "0 auto 0",
      background: "#e7e3f3",
      objectFit: "cover",
      boxShadow: "0 1.2px 8px 0 rgba(151,60,170,0.09)",
    },
    feedback: isRight => ({
      color: isRight ? "#24974e" : "#db3662",
      fontWeight: 700,
      fontSize: "1.11rem",
      textAlign: "center",
      minHeight: 28,
      letterSpacing: ".006em",
      marginTop: 9,
      marginBottom: 2,
      animation: "subtlePop 380ms cubic-bezier(.48,1.2,.64,1.05) 0.09s 1 both",
    }),
    hintText: {
      marginTop: 15,
      marginBottom: 8,
      color: "#a58cc2",
      fontSize: ".99rem",
      fontStyle: "italic",
      textAlign: "center",
    },
    scoreScreen: {
      background: "#edeafa",
      borderRadius: 15,
      padding: "32px 11px 28px",
      boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.07)",
      textAlign: "center",
      margin: "39px auto 10px",
      maxWidth: 370,
      animation: "fadeInPop 0.55s cubic-bezier(.41,.81,.52,1)",
    }
  };

  const posterBase = "https://image.tmdb.org/t/p/w185";

  return (
    <div className="game-container" style={styles.container}>
      <BackButton />
      <h2 className="title" style={{ color: "#973caa", margin: "0 0 14px" }}>
        Object-Based Movie Guess
      </h2>
      <div style={styles.regionBar}>
        <button
          className="btn"
          style={styles.btn(region === "US")}
          onClick={() => { setRegion("US"); }} // triggers effect with full reset
          disabled={region === "US" && !showScore}
          type="button"
        >
          Hollywood
        </button>
        <button
          className="btn"
          style={styles.btn(region === "IN")}
          onClick={() => { setRegion("IN"); }}
          disabled={region === "IN" && !showScore}
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
          style={styles.scoreScreen}
          className="subtle-pop"
          aria-label="Quiz End Score"
        >
          <div
            style={{
              fontSize: "1.47rem",
              fontWeight: 900,
              color: "#973caa",
              letterSpacing: ".012em",
              marginBottom: 5,
            }}
          >
            🎉 Session Complete!
          </div>
          <div style={{ fontWeight: 700, color: "#763195", fontSize: "1.15rem", margin: "10px 0" }}>
            Final Score:{" "}
            <span style={{ color: "#24974e" }}>{score}</span> / {MAX_QUESTIONS}
          </div>
          <div style={{ margin: "8px 0 19px", color: "#8e83a2", fontSize: ".99rem" }}>
            {score === MAX_QUESTIONS
              ? "Unbeatable! Object-movie master!"
              : score >= 13
              ? "Excellent visual memory – well played!"
              : score >= 7
              ? "Good effort! Try again for a top score."
              : "Keep practicing for higher recognition skills!"}
          </div>
          <button
            className="btn btn-large"
            style={{ fontWeight: 700, marginBottom: 7, fontSize: "1.11rem" }}
            onClick={() => {
              resetState(region);
              setShowScore(false);
              loadRound(true);
            }}
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          {errMsg && <ErrorToast message={errMsg} />}
          {loading && (
            <div style={{ margin: "26px 0 22px", textAlign: "center" }}>
              <Loader size={34} />
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
                  style={{ width: 198, fontWeight: 590, fontSize: "1.09rem" }}
                  aria-label="Your guess"
                />
                <button
                  className="btn"
                  type="submit"
                  disabled={answered}
                  style={{ padding: "10px 19px", fontWeight: 700 }}
                >
                  {answered ? "✓" : "Submit"}
                </button>
                <button
                  type="button"
                  style={styles.revealBtn}
                  onClick={() => setHintReveal(v => !v)}
                  disabled={answered && hintReveal}
                  tabIndex={-1}
                  aria-label="Toggle More Hint"
                >
                  {hintReveal ? "Hide Poster" : "Show Movie Poster"}
                </button>
              </form>
              {/* Show poster as additional hint */}
              {hintReveal && (
                <div style={{ margin: "6px 0 0", textAlign: "center" }}>
                  {round.movie.poster_path ? (
                    <img
                      src={posterBase + round.movie.poster_path}
                      alt="Poster hint"
                      style={styles.posterThumb}
                    />
                  ) : (
                    <div
                      style={{
                        ...styles.posterThumb,
                        color: "#c8b9db",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.8rem",
                      }}
                    >
                      🎬
                    </div>
                  )}
                </div>
              )}
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
              {/* Movie/Year Reveal after answer */}
              {answered && (
                <></>
              )}
              {/* Only show answer after explicit reveal button */}
              {!answered && hintReveal && round && (
                <div
                  style={{
                    marginTop: 10,
                    background: "#edeafa",
                    padding: "10px 13px",
                    borderRadius: 13,
                    color: "#481d77",
                    fontWeight: 600,
                    boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.06)",
                    fontSize: ".98rem",
                    textAlign: "center",
                  }}
                >
                  <span style={{ color: "#973caa" }}>{round.movie.title}</span>{" "}
                  {round.movie.release_date ? `(${round.movie.release_date.slice(0, 4)})` : ""}
                </div>
              )}
              <div style={{ marginTop: 14, color: "#a58cc2", fontSize: ".99rem", textAlign: "center" }}>
                {`Question ${played + (answered ? 0 : 1)} of ${MAX_QUESTIONS}`}
              </div>
            </>
          )}
          {!loading && !round && !errMsg && (
            <div style={{ margin: "20px 0", color: "#c75e77" }}>
              Oops, unable to load a round.{" "}
              <button className="btn" onClick={() => loadRound(true)}>
                Retry
              </button>
            </div>
          )}
        </>
      )}
      {/* Instructions */}
      <div style={styles.hintText}>
        Guess the movie based on four clues: all are objects, places, props or concrete visual things seen in the movie (never genres or themes)! Not sure? Reveal the poster for help.
      </div>
    </div>
  );
}
