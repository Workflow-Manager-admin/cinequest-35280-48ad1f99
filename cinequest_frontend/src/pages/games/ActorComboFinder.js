import React, { useEffect, useState } from "react";
import { getPopularActors, getMoviesWithBothActors } from "../../tmdbGameUtils";
import Loader from "../../components/Loader";
import ErrorToast from "../../components/ErrorToast";
import GameCard from "../../components/GameCard";

/**
 * PUBLIC_INTERFACE
 * ActorComboFinder - Game for finding movies featuring two selected actors using TMDB data.
 */
export default function ActorComboFinder() {
  // State management
  const [region, setRegion] = useState("US"); // "US" (Hollywood) or "IN" (Kollywood)
  const [actors, setActors] = useState([]);
  const [loadingActors, setLoadingActors] = useState(false);
  const [actor1, setActor1] = useState(null);
  const [actor2, setActor2] = useState(null);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [sharedMovies, setSharedMovies] = useState([]);
  const [errMsg, setErrMsg] = useState("");

  // Fetch popular actors for the chosen region
  useEffect(() => {
    setActor1(null);
    setActor2(null);
    setSharedMovies([]);
    setErrMsg("");
    setLoadingActors(true);
    getPopularActors(region)
      .then((results) => {
        setActors(results);
      })
      .catch(() => {
        setErrMsg("Could not load actors. Please try again later.");
      })
      .finally(() => setLoadingActors(false));
  }, [region]);

  // Fetch shared movies when both actors are picked
  useEffect(() => {
    if (actor1 && actor2 && actor1.id !== actor2.id) {
      setSharedMovies([]);
      setErrMsg("");
      setLoadingMovies(true);
      getMoviesWithBothActors(actor1.id, actor2.id, region)
        .then((movies) => {
          setSharedMovies(movies);
          if (!movies.length) {
            setErrMsg("No movies found with both actors together.");
          }
        })
        .catch(() => setErrMsg("Failed to fetch shared movies."))
        .finally(() => setLoadingMovies(false));
    } else {
      setSharedMovies([]);
    }
  }, [actor1, actor2, region]);

  // Actor select component
  function ActorSelect({ label, value, onChange, disabledActorId }) {
    return (
      <div style={{ marginBottom: 18, width: "100%" }}>
        <label
          style={{
            fontWeight: 700,
            color: "#763195",
            fontSize: "1.01rem",
            marginBottom: 6,
            display: "block",
          }}
        >
          {label}
        </label>
        <select
          className="input"
          value={value ? value.id : ""}
          onChange={(e) => {
            const id = e.target.value;
            const actor = actors.find((a) => String(a.id) === id) || null;
            onChange(actor);
          }}
          style={{ width: "100%", minWidth: 160 }}
        >
          <option value="">-- Choose --</option>
          {actors
            .filter((a) => !disabledActorId || a.id !== disabledActorId)
            .map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
        </select>
        {value && (
          <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
            {value.profile_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w45${value.profile_path}`}
                alt={value.name}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginRight: 8,
                  background: "#e7e3f3",
                  border: "1.2px solid #edeafa",
                }}
              />
            ) : (
              <span style={{
                width: 36, height: 36, borderRadius: "50%",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.3rem", background: "#e7e3f3", color: "#a58cc2",
                marginRight: 8, fontWeight: 600, border: "1.2px solid #edeafa"
              }}>
                👤
              </span>
            )}
            <span style={{ fontWeight: 600, color: "#573878" }}>{value.name}</span>
          </div>
        )}
      </div>
    );
  }

  // Main render
  return (
    <div
      className="game-container"
      style={{
        maxWidth: 520,
        margin: "46px auto 0",
        background: "#fff",
        borderRadius: "22px",
        boxShadow: "0 6px 28px 0 rgba(151,60,170,.082)",
        padding: "38px 18px 32px",
        minHeight: 300,
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
        Pick two actors ({region === "US" ? "Hollywood" : "Kollywood"}) below to find all movies they co-starred in together!
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
          disabled={loadingActors || region === "US"}
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
          disabled={loadingActors || region === "IN"}
          type="button"
        >
          Kollywood
        </button>
      </div>
      {/* Actor selectors */}
      <div style={{ margin: "0 0 24px 0", display: "flex", flexDirection: "column", gap: 0 }}>
        {loadingActors ? (
          <div style={{ margin: "18px", textAlign: "center" }}>
            <Loader size={28} /> <span style={{ color: "#a58cc2", fontWeight: 500 }}>Loading actors...</span>
          </div>
        ) : (
          <>
            <ActorSelect label="Actor 1" value={actor1} onChange={setActor1} disabledActorId={actor2 && actor2.id} />
            <ActorSelect label="Actor 2" value={actor2} onChange={setActor2} disabledActorId={actor1 && actor1.id} />
          </>
        )}
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
        Try popular actor combinations for fun cinephile discoveries!
      </div>
    </div>
  );
}
