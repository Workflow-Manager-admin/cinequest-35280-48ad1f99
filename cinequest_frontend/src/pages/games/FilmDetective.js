import React, { useState } from "react";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import GameCard from "../../components/GameCard";
import BackButton from "../../components/BackButton";

// TMDB API KEY from env
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

// Helpers for TMDB search by clues
async function searchMoviesByClues({ actor, keyword, year, region = "US" }) {
  const results = [];
  let actorId = null;
  let actorError = "";

  // 1. Lookup actor id if actor name provided
  if (actor) {
    const url = new URL("https://api.themoviedb.org/3/search/person");
    url.searchParams.append("api_key", TMDB_API_KEY);
    url.searchParams.append("query", actor);
    url.searchParams.append("include_adult", "false");
    url.searchParams.append("page", "1");
    // Optionally: region filter; here skipped for breadth

    const res = await fetch(url.toString());
    if (!res.ok) {
      actorError = "Actor search failed.";
      return { results: [], error: actorError };
    }
    const data = await res.json();
    if (!data.results || !data.results.length) {
      actorError = "No actor found by this name.";
      return { results: [], error: actorError };
    }
    // Get most relevant actor (first result)
    actorId = data.results[0].id;
  }

  // 2. Build query params for /discover/movie
  const discoverUrl = new URL("https://api.themoviedb.org/3/discover/movie");
  discoverUrl.searchParams.append("api_key", TMDB_API_KEY);
  discoverUrl.searchParams.append("language", region === "IN" ? "ta-IN" : "en-US");
  discoverUrl.searchParams.append("region", region);
  if (year) {
    discoverUrl.searchParams.append("primary_release_year", year);
  }
  if (actorId) {
    discoverUrl.searchParams.append("with_cast", actorId);
  }
  if (region === "IN") {
    discoverUrl.searchParams.append("with_original_language", "ta");
  } else {
    discoverUrl.searchParams.append("with_original_language", "en");
  }
  if (keyword) {
    // We'll use "with_keywords" if it's a valid TMDB keyword, else fallback to text search on overview/tagline
    // Start with /search/keyword
    const kwUrl = new URL("https://api.themoviedb.org/3/search/keyword");
    kwUrl.searchParams.append("api_key", TMDB_API_KEY);
    kwUrl.searchParams.append("query", keyword);
    const kwRes = await fetch(kwUrl.toString());
    if (kwRes.ok) {
      const kwData = await kwRes.json();
      if (kwData.results && kwData.results.length) {
        // Use the first keyword result
        discoverUrl.searchParams.append("with_keywords", kwData.results[0].id);
      }
    }
  }

  // Now fetch candidates from discover
  const res = await fetch(discoverUrl.toString());
  if (!res.ok) {
    return { results: [], error: "Movie search failed." };
  }
  const data = await res.json();
  let movies = data && data.results ? data.results : [];

  // If keyword input was present and we didn't match by TMDB keyword, filter on overview/tagline
  if (keyword && (!discoverUrl.searchParams.get("with_keywords"))) {
    const norm = (s) => (s || "").toLowerCase();
    movies = movies.filter(
      (movie) =>
        (movie.tagline && norm(movie.tagline).includes(norm(keyword))) ||
        (movie.overview && norm(movie.overview).includes(norm(keyword)))
    );
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
