import React, { useState } from "react";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import GameCard from "../../components/GameCard";
import BackButton from "../../components/BackButton";

// TMDB API KEY from env
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

/**
 * Improved TMDB-powered movie search using clues: actor, keyword, year.
 *
 * Steps:
 *  1. If actor clue, find actor ID.
 *  2. If keyword (quote/tagline/overview), lookup TMDB keyword ID.
 *  3. Use "discover" endpoint with cast, year, keyword, and region.
 *  4. Fallback: if keywords do not match, text-filter tagline/overview of results.
 * Provides robust error handling, distinguishes between no-clues, no API result, and network failures.
 * Displays live feedback/loading state to user.
 */
// PUBLIC_INTERFACE
async function searchMoviesByClues({ actor, keyword, year, region = "US" }) {
  let actorId = null;
  let keywordId = null;
  let actorError = "";
  let keywordIsText = false;

  // Normalize inputs
  const actorRaw = (actor || "").trim();
  const keywordRaw = (keyword || "").trim();
  const yearRaw = (year || "").trim();

  // Step 1: Try to find actorId
  if (actorRaw.length > 0) {
    try {
      const url = new URL("https://api.themoviedb.org/3/search/person");
      url.searchParams.append("api_key", TMDB_API_KEY);
      url.searchParams.append("query", actorRaw);
      url.searchParams.append("include_adult", "false");
      url.searchParams.append("page", "1");
      // For Kollywood, hint language but not reliable
      const actorRes = await fetch(url.toString());
      if (!actorRes.ok) throw new Error("TMDB person search failed");
      const actorJson = await actorRes.json();
      const actors = (actorJson && actorJson.results || []).filter(p => p.known_for_department === "Acting");
      if (!actors.length) {
        return { results: [], error: `No actor found named "${actorRaw}".` };
      }
      actorId = actors[0].id;
    } catch (e) {
      return { results: [], error: "Actor lookup failed. Please try again." };
    }
  }

  // Step 2: Try to find TMDB keywordId
  if (keywordRaw.length > 0) {
    try {
      const kwUrl = new URL("https://api.themoviedb.org/3/search/keyword");
      kwUrl.searchParams.append("api_key", TMDB_API_KEY);
      kwUrl.searchParams.append("query", keywordRaw);
      const kwRes = await fetch(kwUrl.toString());
      if (!kwRes.ok) throw new Error("TMDB keyword search failed");
      const kwJson = await kwRes.json();
      if (kwJson.results && kwJson.results.length) {
        keywordId = kwJson.results[0].id;
      } else {
        keywordIsText = true;
      }
    } catch (e) {
      keywordIsText = true; // fallback to text-based filter
    }
  }

  // Step 3: Prepare /discover/movie parameters
  const discoverUrl = new URL("https://api.themoviedb.org/3/discover/movie");
  discoverUrl.searchParams.append("api_key", TMDB_API_KEY);
  discoverUrl.searchParams.append("region", region);
  discoverUrl.searchParams.append("language", region === "IN" ? "ta-IN" : "en-US");
  discoverUrl.searchParams.append("sort_by", "popularity.desc");
  if (yearRaw) discoverUrl.searchParams.append("primary_release_year", yearRaw);
  if (actorId) discoverUrl.searchParams.append("with_cast", actorId);
  if (region === "IN") {
    discoverUrl.searchParams.append("with_original_language", "ta");
  } else {
    discoverUrl.searchParams.append("with_original_language", "en");
  }
  if (keywordId) {
    discoverUrl.searchParams.append("with_keywords", keywordId);
  }

  // Step 4: Fetch results from /discover/movie
  let discoverRes, discoverData, movies;
  try {
    discoverRes = await fetch(discoverUrl.toString());
    if (!discoverRes.ok) throw new Error("Movie search failed.");
    discoverData = await discoverRes.json();
    movies = Array.isArray(discoverData.results) ? discoverData.results : [];
  } catch {
    return { results: [], error: "Failed to search movies. Please try again." };
  }

  // Step 5: Text fallback filter if needed
  if (keywordRaw.length > 0 && !keywordId) {
    // fallback: scan tagline/overview for any word from the keyword string
    const norm = s => (s || "").toLowerCase();
    const words = keywordRaw.toLowerCase().split(/\s+/).filter(Boolean);
    movies = movies.filter((movie) => {
      const tagline = norm(movie.tagline);
      const overview = norm(movie.overview);
      // Any word matches in tagline/overview
      return words.some(word =>
        (tagline && tagline.includes(word)) || (overview && overview.includes(word))
      );
    });
  }

  // Final error checks
  if (!movies.length) {
    return { results: [], error: "No movies found matching all clues." };
  }

  return { results: movies, error: "" };
}

export default function FilmDetective() {
  const [fields, setFields] = useState({
    actor: "",
    keyword: "",
    year: ""
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [region, setRegion] = useState("US");

  // Form style
  const containerStyle = {
    maxWidth: 590,
    margin: "46px auto 0",
    background: "#fff",
    borderRadius: 22,
    boxShadow: "0 6px 28px 0 rgba(151,60,170,.082)",
    padding: "38px 18px 32px",
    minHeight: 330,
    animation: "fadeInPop 0.5s"
  };
  const labelStyle = {
    fontWeight: 600,
    color: "#763195",
    fontSize: "1.01rem",
    marginBottom: 4,
    display: "block"
  };
  const inputStyle = {
    marginBottom: 18
  };

  function handleChange(e) {
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setResults([]);
    setErrMsg("");
    setLoading(true);
    try {
      if (!fields.actor && !fields.keyword && !fields.year) {
        setErrMsg("Enter at least one clue.");
        setLoading(false);
        return;
      }
      const { results, error } = await searchMoviesByClues({
        actor: fields.actor.trim(),
        keyword: fields.keyword.trim(),
        year: fields.year.trim(),
        region
      });
      if (error) {
        setErrMsg(error);
      }
      if (results.length === 0 && !error) {
        setErrMsg("No movies found matching all clues.");
      }
      setResults(results);
    } catch (err) {
      setErrMsg("Something went wrong. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="game-container" style={containerStyle}>
      <BackButton />
      <h2 className="title" style={{
        color: "#973caa",
        margin: "0 0 13px",
        textShadow: "0 2px 18px #973caa18"
      }}>Film Detective</h2>
      <p className="description" style={{
        fontSize: "1.09rem",
        color: "#573878",
        marginTop: 4,
        marginBottom: 16,
        letterSpacing: ".006em"
      }}>
        Enter clues below (actor, tagline/overview keywords, or year) to hunt for movies!
      </p>
      {/* Region selection */}
      <div style={{ marginBottom: 12, display: "flex", gap: 13 }}>
        <button
          className="btn"
          style={{
            background: region === "US" ? "#973caa" : "#edeafa",
            color: region === "US" ? "#fff" : "#763195",
            fontWeight: region === "US" ? 700 : 600,
            border: region === "US" ? "2px solid #973caa" : "2px solid #edeafa",
            padding: "7px 16px"
          }}
          onClick={() => setRegion("US")}
          disabled={region === "US"}
          type="button"
        >
          Hollywood
        </button>
        <button
          className="btn"
          style={{
            background: region === "IN" ? "#973caa" : "#edeafa",
            color: region === "IN" ? "#fff" : "#763195",
            fontWeight: region === "IN" ? 700 : 600,
            border: region === "IN" ? "2px solid #973caa" : "2px solid #edeafa",
            padding: "7px 16px"
          }}
          onClick={() => setRegion("IN")}
          disabled={region === "IN"}
          type="button"
        >
          Kollywood
        </button>
      </div>
      {/* Search form */}
      <form
        style={{
          margin: "0 0 21px 0",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          width: "100%"
        }}
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <label style={labelStyle} htmlFor="actor-clue-input">Actor</label>
        <input
          id="actor-clue-input"
          name="actor"
          placeholder="Actor name (optional, e.g. Tom Hanks)"
          className="input"
          value={fields.actor}
          autoComplete="off"
          onChange={handleChange}
          style={inputStyle}
        />
        <label style={labelStyle} htmlFor="keyword-clue-input">Tagline/Overview Keywords</label>
        <input
          id="keyword-clue-input"
          name="keyword"
          placeholder="Keyword(s) from tagline or description (optional)"
          className="input"
          value={fields.keyword}
          autoComplete="off"
          onChange={handleChange}
          style={inputStyle}
        />
        <label style={labelStyle} htmlFor="year-clue-input">Release Year</label>
        <input
          id="year-clue-input"
          name="year"
          placeholder="Year (optional, e.g. 2017)"
          className="input"
          type="number"
          value={fields.year}
          onChange={handleChange}
          pattern="[0-9]+"
          min={1888}
          max={2099}
          style={inputStyle}
        />
        <button
          className="btn btn-large subtle-pop"
          style={{ marginTop: 6, marginBottom: 7, fontWeight: 700 }}
          type="submit"
          disabled={loading}
        >
          {loading ? <Loader size={18} /> : "Find Movies"}
        </button>
      </form>
      {errMsg && <ErrorToast message={errMsg} />}
      {/* Results */}
      <div style={{ marginTop: 18 }}>
        {loading && !results.length && (
          <div style={{ margin: "12px 0", textAlign: "center" }}>
            <Loader size={28} />
          </div>
        )}
        {!loading && results.length > 0 && (
          <div>
            <div style={{
              color: "#481d77",
              fontWeight: 700,
              fontSize: "1.09rem",
              margin: "0 0 12px 2px"
            }}>
              Found {results.length} {results.length === 1 ? "movie" : "movies"}:
            </div>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 15,
              margin: "8px 0 0"
            }}>
              {results.slice(0, 16).map(movie => (
                <GameCard
                  key={movie.id}
                  movie
                  poster={movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : null}
                  title={movie.title}
                  year={movie.release_date ? String(movie.release_date).slice(0, 4) : ""}
                  description={movie.overview}
                  onClick={() => window.open(`https://www.themoviedb.org/movie/${movie.id}`, "_blank")}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Instructions */}
      <div style={{
        marginTop: 30,
        fontSize: ".97rem",
        color: "#a58cc2",
        textAlign: "center",
        fontWeight: 500,
        letterSpacing: ".011em"
      }}>
        Tip: Enter any combination of actor, keyword and/or year to refine your movie search.
      </div>
    </div>
  );
}
