import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * Header/NavBar - original CineQuest delivery version, minimal and clean.
 */
export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar" style={{background: "#fff", color: "#151414", borderBottom: "1px solid #e7e3f3", minHeight: 57}}>
      <div className="container" style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <Link to="/" style={{
          textDecoration: "none",
          color: "#973caa",
          display: "flex",
          alignItems: "center"
        }}>
          <span style={{
            background: "#973caa",
            color: "#fff",
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 21,
            marginRight: 9,
            fontWeight: 900
          }}>🎬</span>
          <span style={{fontWeight: 800, fontSize: "1.3rem", letterSpacing: ".012em"}}>CineQuest</span>
        </Link>
        <div>
          {user ? (
            <>
              <Link className="btn" style={{
                background: "#973caa", color: "#fff", fontWeight: 700, marginRight: 8
              }} to="/dashboard">Dashboard</Link>
              <button className="btn" style={{
                background: "#151414", color: "#fff", fontWeight: 700
              }} onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className="btn" style={{
                background: "#973caa", color: "#fff", fontWeight: 700, marginRight: 8
              }} to="/login">Login</Link>
              <Link className="btn" style={{
                background: "#151414", color: "#fff", fontWeight: 700
              }} to="/signup">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
