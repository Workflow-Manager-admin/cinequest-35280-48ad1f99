import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Sleek modern header (navbar) layout and color
const styles = {
  accent: { color: "#151414" },
  primary: { color: "#973caa" },
  placeholderIcon: {
    width: 38,
    height: 38,
    background: "#973caa",
    color: "#f9f9fb",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: 22,
    marginRight: "10px",
    boxShadow: "0 1.5px 10px 0 rgba(151,60,170,0.14)"
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
    <nav className="navbar" style={{
      backgroundColor: "#fff", color: "#151414", borderBottom: "1.5px solid #e7e3f3",
      boxShadow: "0 2px 12px 0 rgba(151,60,170,0.08)", minHeight: 62, transition: "box-shadow 0.11s"
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{
          textDecoration: "none",
          color: "#973caa",
          display: "flex",
          alignItems: "center"
        }}>
          <div style={styles.placeholderIcon} aria-label="Site icon">
            🎬
          </div>
          <span style={{
            fontWeight: 800,
            fontSize: "1.38rem",
            letterSpacing: ".011em",
            fontFamily: "'Nunito Sans','Inter',sans-serif"
          }}>CineQuest</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user && (
            <>
              <span style={{ fontSize: "1.09rem", fontWeight: 700, color: "#973caa", marginRight: 3 }}>Hi, {user.username}</span>
              <Link to="/dashboard" className="btn" style={{
                background: "var(--primary)", color: "white", fontWeight: 700
              }}>Dashboard</Link>
              <button className="btn" style={{
                background: "#151414", color: "#f9f9fb", fontWeight: 700
              }} onClick={handleLogout}>
                Log out
              </button>
            </>
          )}
          {!user && (
            <>
              <Link className="btn" style={{
                background: "var(--primary)", color: "white", fontWeight: 700
              }} to="/login">Login</Link>
              <Link className="btn" style={{
                background: "#151414", color: "#f9f9fb", fontWeight: 700
              }} to="/signup">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
