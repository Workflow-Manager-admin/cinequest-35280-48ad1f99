import React, { useEffect, useState, useRef } from "react";
import { getMoviesWithBothActors } from "../../tmdbGameUtils";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import GameCard from "../../components/GameCard";

/**
 * PUBLIC_INTERFACE
 * ActorComboFinder - Game for finding movies featuring two selected actors using TMDB data.
 *
 * - Users search for both actors (live search/autocomplete) using TMDB API (by name, region US/IN).
 * - On selection of two different actors, shared movies are shown in cards.
 * - Loading and error states shown for both actor search and movies lookup.
 */
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

function buildSearchURL(query, region = "US", page = 1) {
  const url = new URL("https://api.themoviedb.org/3/search/person");
  url.searchParams.append("query", query);
  url.searchParams.append("api_key", TMDB_API_KEY);
  url.searchParams.append("include_adult", "false");
  url.searchParams.append("page", page);
  if (region === "IN") url.searchParams.append("with_original_language", "ta"); // hint for Kollywood
  return url.toString();
}

// Live actor search with debounce
function useActorSearch(region) {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef();
  // For cancellation of requests
  const abortRef = useRef();

  useEffect(() => {
    setResults([]);
    setError("");
  }, [region]);

  const search = (val) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInputValue(val);
    // Only search if > 1 char
    if (val && val.length > 1) {
      setLoading(true);
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      debounceRef.current = setTimeout(() => {
        fetch(buildSearchURL(val, region), { signal: controller.signal })
          .then((res) => {
            if (!res.ok) throw new Error("Failed");
            return res.json();
          })
          .then((data) => {
            setResults(
              Array.isArray(data.results)
                ? data.results.filter((p) => p.known_for_department === "Acting")
                : []
            );
            setError("");
          })
          .catch((e) => {
            if (e.name === "AbortError") return;
            setError("Could not fetch actors. Try again.");
          })
          .finally(() => setLoading(false));
      }, 280);
    } else {
      setResults([]);
      setLoading(false);
    }
  };

  return {
    inputValue,
    setInputValue: search,
    results,
    loading,
    error,
    reset: () => {
      setInputValue("");
      setResults([]);
      setError("");
    },
  };
}

// Modern Actor Search Field with autocomplete dropdown
function ActorSearchInput({
  label,
  actor,
  onActorSelected,
  disabledActorId,
  region,
  autoFocus,
}) {
  const search = useActorSearch(region);
  const inputRef = useRef();

  // On select
  const handleSelect = (person) => {
    if (!person || person.id === disabledActorId) return;
    onActorSelected(person);
    search.setInputValue(person.name);
  };

  // If actor prop changes from parent, keep input value in sync
  useEffect(() => {
    if (actor && actor.name !== search.inputValue) {
      search.setInputValue(actor.name);
    }
    // eslint-disable-next-line
  }, [actor]);

  // Keyboard: Down/Up/Enter on results
  const [highlightIdx, setHighlightIdx] = useState(-1);

  // Allow clearing actor
  const handleClear = () => {
    onActorSelected(null);
    search.reset();
    setHighlightIdx(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  // Accessibility: allow keyboard result selection
  const handleKeyDown = (e) => {
    if (!search.results.length) return;
    if (e.key === "ArrowDown") {
      setHighlightIdx((idx) => (idx < search.results.length - 1 ? idx + 1 : 0));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlightIdx((idx) => (idx > 0 ? idx - 1 : search.results.length - 1));
      e.preventDefault();
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      handleSelect(search.results[highlightIdx]);
    }
  };

  return (
    <div style={{ marginBottom: 22, position: "relative", width: "100%" }}>
      <label
        style={{
          fontWeight: 700,
          color: "#763195",
          fontSize: "1.01rem",
          marginBottom: 6,
          display: "block",
        }}
        htmlFor={label+"-input"}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={label+"-input"}
          ref={inputRef}
          className="input"
          value={search.inputValue}
          placeholder="Type actor name (min 2)"
          disabled={!!actor && actor.id === disabledActorId}
          onChange={(e) => {
            search.setInputValue(e.target.value);
            onActorSelected(null);
            setHighlightIdx(-1);
          }}
          style={{
            width: "100%",
            minWidth: 170,
            paddingRight: actor ? 40 : 8,
          }}
          autoFocus={autoFocus}
          onKeyDown={handleKeyDown}
        />
        {actor && (
          <button
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "#edeafa",
              border: "none",
              borderRadius: 12,
              padding: 2,
              fontSize: "1.15rem",
              color: "#973caa",
              cursor: "pointer",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            tabIndex={0}
            aria-label={`Clear ${label}`}
            type="button"
            onClick={handleClear}
          >
            ✕
          </button>
        )}
        {search.loading && (
          <span style={{
            position: "absolute", right: 6, top: 12, zIndex: 10,
          }}>
            <Loader size={17}/>
          </span>
        )}
      </div>
      {search.error && (
        <div style={{
          color: "#c75e77", fontWeight: 600, fontSize: ".98rem", margin: "8px 0 0 2px"
        }}>
          {search.error}
        </div>
      )}
      {/* Suggestions dropdown, not shown if input is blank or results empty or already picked actor */}
      {(search.results.length && (!actor || search.inputValue !== actor.name)) ? (
        <div style={{
          position: "absolute",
          top: "calc(100% + 2px)",
          left: 0,
          width: "100%",
          background: "#fff",
          border: "1.5px solid #edeafa",
          borderRadius: "10px",
          boxShadow: "0 8px 32px 0 rgba(151,60,170, 0.09)",
          zIndex: 50,
          marginTop: 3,
          maxHeight: 252,
          overflowY: "auto"
        }}>
          {search.results
            .filter(
              (person) =>
                !person || person.id !== disabledActorId
            )
            .slice(0, 12)
            .map((person, idx) => (
              <div
                key={person.id}
                style={{
                  padding: "9px 12px",
                  background: idx === highlightIdx ? "#edeafa" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  borderBottom: "1px solid #f2ebfa",
                  fontWeight: 600,
                }}
                onMouseDown={() => handleSelect(person)}
                onMouseEnter={() => setHighlightIdx(idx)}
                onMouseLeave={() => setHighlightIdx(-1)}
                role="option"
                aria-selected={idx === highlightIdx}
                tabIndex={0}
              >
                {person.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w45${person.profile_path}`}
                    alt=""
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginRight: 10,
                      background: "#e7e3f3",
                      border: "1.2px solid #edeafa",
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <span style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "#e7e3f3", color: "#a58cc2", fontSize: "1.23rem", marginRight: 10,
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600
                  }}>
                    👤
                  </span>
                )}
                <span style={{color:"#573878"}}>{person.name}</span>
                {person.known_for && person.known_for.length > 0 && (
                  <span style={{
                    marginLeft: 10,
                    color: "#b7a2cf",
                    fontWeight: 400,
                    fontSize: ".97rem",
                  }}>
                    {person.known_for[0]?.media_type === "movie"
                      ? person.known_for[0].title
                      : person.known_for[0]?.name || ""}
                  </span>
                )}
              </div>
            ))}
        </div>
      ) : null}
      {/* Selected actor info after selection */}
      {actor && (
        <div style={{ display: "flex", alignItems: "center", marginTop: 7, gap: 8 }}>
          {actor.profile_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w45${actor.profile_path}`}
              alt={actor.name}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                objectFit: "cover",
                background: "#e7e3f3",
                border: "1.2px solid #edeafa",
              }}
            />
          ) : (
            <span style={{
              width: 36, height: 36, borderRadius: "50%",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.3rem", background: "#e7e3f3", color: "#a58cc2",
              fontWeight: 600, border: "1.2px solid #edeafa"
            }}>
              👤
            </span>
          )}
          <span style={{ fontWeight: 600, color: "#573878" }}>{actor.name}</span>
        </div>
      )}
    </div>
  );
}

// Main component for selecting region, searching actors, and showing shared movies
export default function ActorComboFinder() {
  const [region, setRegion] = useState("US"); // "US" (Hollywood) or "IN" (Kollywood)
  const [actor1, setActor1] = useState(null);
  const [actor2, setActor2] = useState(null);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [sharedMovies, setSharedMovies] = useState([]);
  const [errMsg, setErrMsg] = useState("");

  // When region changes, reset both actors and result
  useEffect(() => {
    setActor1(null);
    setActor2(null);
    setSharedMovies([]);
    setErrMsg("");
  }, [region]);

  // Fetch shared movies when both actors are picked and not the same
  useEffect(() => {
    let ignore = false;
    if (actor1 && actor2 && actor1.id !== actor2.id) {
      setSharedMovies([]);
      setErrMsg("");
      setLoadingMovies(true);
      getMoviesWithBothActors(actor1.id, actor2.id, region)
        .then((movies) => {
          if (ignore) return;
          setSharedMovies(movies);
          if (!movies.length) {
            setErrMsg("No movies found with both actors together.");
          }
        })
        .catch(() => {
          if (!ignore) setErrMsg("Failed to fetch shared movies.");
        })
        .finally(() => {
          if (!ignore) setLoadingMovies(false);
        });
    } else {
      setSharedMovies([]);
    }
    return () => { ignore = true; };
  }, [actor1, actor2, region]);

  return (
    <div
      className="game-container"
      style={{
        maxWidth: 590,
        margin: "46px auto 0",
        background: "#fff",
        borderRadius: "22px",
        boxShadow: "0 6px 28px 0 rgba(151,60,170,.082)",
        padding: "38px 18px 32px",
        minHeight: 330,
        animation: "fadeInPop 0.5s",
      }}
    >
      <h2
        className="title"
        style={{
          color: "#973caa",
          margin: "0 0 13px",
          textShadow: "0 2px 18px #973caa18",
        }}
      >
        Actor Combo Finder
      </h2>
      <p
        className="description"
        style={{
          fontSize: "1.07rem",
          color: "#573878",
          marginTop: 5,
          marginBottom: 11,
          letterSpacing: ".006em",
        }}
      >
        Search and pick two actors ({region === "US" ? "Hollywood" : "Kollywood"}) below to see all movies they appeared in together!
      </p>
      {/* Region Toggle */}
      <div style={{ marginBottom: 16, display: "flex", gap: 17 }}>
        <button
          className="btn"
          style={{
            background: region === "US" ? "#973caa" : "#edeafa",
            color: region === "US" ? "#fff" : "#763195",
            fontWeight: region === "US" ? 700 : 600,
            border: region === "US" ? "2px solid #973caa" : "2px solid #edeafa",
            padding: "8px 16px",
            minWidth: 108,
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
            padding: "8px 16px",
            minWidth: 108,
          }}
          onClick={() => setRegion("IN")}
          disabled={region === "IN"}
          type="button"
        >
          Kollywood
        </button>
      </div>
      {/* Actor search fields */}
      <div style={{
        margin: "0 0 21px 0", display: "flex", flexDirection: "column", gap: 0, width: "100%"
      }}>
        <ActorSearchInput
          label="Actor 1"
          actor={actor1}
          onActorSelected={setActor1}
          disabledActorId={actor2 && actor2.id}
          region={region}
          autoFocus
        />
        <ActorSearchInput
          label="Actor 2"
          actor={actor2}
          onActorSelected={setActor2}
          disabledActorId={actor1 && actor1.id}
          region={region}
        />
      </div>
      {errMsg && <ErrorToast message={errMsg} />}
      {/* Results */}
      {actor1 && actor2 && actor1.id !== actor2.id && (
        <div>
          <h3 style={{
            color: "#481d77",
            fontWeight: 700,
            fontSize: "1.09rem",
            margin: "15px 0 7px",
          }}>
            Movies with {actor1.name} &amp; {actor2.name}:
          </h3>
          {loadingMovies ? (
            <div style={{ margin: "14px 0", textAlign: "center" }}><Loader size={23} /></div>
          ) : sharedMovies.length > 0 ? (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              margin: "8px 0 0",
            }}>
              {sharedMovies.map((movie) => (
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
          ) : (
            !errMsg && (
              <div style={{ margin: "18px 0", color: "#a58cc2", fontWeight: 500 }}>
                No movies found with both actors.
              </div>
            )
          )}
        </div>
      )}
      {/* Helper/Instructions */}
      <div style={{
        marginTop: 32,
        fontSize: ".97rem",
        color: "#a58cc2",
        textAlign: "center",
        fontWeight: 500,
        letterSpacing: ".011em"
      }}>
        Try searching live for Hollywood/Kollywood actors. Fun cinephile discoveries await!
      </div>
    </div>
  );
}
