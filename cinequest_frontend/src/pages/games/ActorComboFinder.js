// Actor Combo Finder - original delivery version for CineQuest
import React, { useState } from "react";
import BackButton from "../../components/BackButton";

export default function ActorComboFinder() {
  const [actors, setActors] = useState(["", ""]);
  const [movies, setMovies] = useState([]);
  const [result, setResult] = useState(null);

  // Simple prefilled dummy search to make original version run
  function handleSubmit(e) {
    e.preventDefault();
    if (!actors[0] || !actors[1]) return;
    // Original: always yields a small mock answer for first delivery
    setMovies([
      { title: "Example Movie A", year: "2021" },
      { title: "Collab Hit", year: "2018" },
    ]);
    setResult("success");
  }

  return (
    <div className="game-container" style={{ maxWidth: 420, margin: "48px auto 0", background: "#fff", borderRadius: 11, boxShadow: "0 1.5px 16px 0 rgba(151,60,170,0.09)", padding: "32px 20px", minHeight: 320 }}>
      <BackButton />
      <h2 className="title" style={{ color: "#973caa", marginBottom: 14 }}>Actor Combo Finder</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 23 }}>
        <div style={{ marginBottom: 7 }}>
          <input className="input" placeholder="Actor 1" value={actors[0]} onChange={e => setActors([e.target.value, actors[1]])} style={{ marginRight: 8 }} autoFocus />
          <input className="input" placeholder="Actor 2" value={actors[1]} onChange={e => setActors([actors[0], e.target.value])} />
        </div>
        <button className="btn" type="submit" disabled={!actors[0] || !actors[1]}>Find Movies</button>
      </form>
      {result && (
        <div>
          <h4 style={{ color: "#763195", fontWeight: 700, marginBottom: 7 }}>Results:</h4>
          {movies.length ? (
            <ul>
              {movies.map((m, i) => (
                <li key={i}>{m.title} {m.year && `(${m.year})`}</li>
              ))}
            </ul>
          ) : (
            <div>No movies found with both actors.</div>
          )}
        </div>
      )}
    </div>
  );
}
