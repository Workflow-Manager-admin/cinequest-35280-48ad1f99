import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const styles = {
  accent: { color: "#151414" },
  primary: { color: "#973caa" },
  placeholderIcon: {
    width: 36,
    height: 36,
    background: "#973caa",
    color: "#f9f9fb",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: 20,
    marginRight: "8px"
  }
};

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar" style={{ backgroundColor: "#f9f9fb", color: "#151414", borderBottom: "2px solid #eee" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ textDecoration: "none", color: "#973caa", display: "flex", alignItems: "center" }}>
          <div style={styles.placeholderIcon} aria-label="Site icon">
            🎬
          </div>
          <span style={{ fontWeight: 700, fontSize: "1.35rem", letterSpacing: ".03em" }}>CineQuest</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user && (
            <>
              <span style={{ fontSize: "1.1rem", fontWeight: 500, color: "#973caa" }}>Hello, {user.username}</span>
              <Link to="/dashboard" className="btn" style={{ backgroundColor: "#973caa", color: "white" }}>Dashboard</Link>
              <button className="btn" style={{ backgroundColor: "#151414", color: "#f9f9fb" }} onClick={handleLogout}>
                Log out
              </button>
            </>
          )}
          {!user && (
            <>
              <Link className="btn" style={{ backgroundColor: "#973caa", color: "white" }} to="/login">Login</Link>
              <Link className="btn" style={{ backgroundColor: "#151414", color: "#f9f9fb" }} to="/signup">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
