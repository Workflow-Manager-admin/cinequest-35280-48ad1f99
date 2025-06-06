import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import ErrorToast from "../components/ErrorToast";

export default function LoginPage() {
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState({ username: "", password: "" });

  function handleChange(e) {
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fields.username || !fields.password) {
      setError("Username and password required");
      return;
    }
    const ok = await login(fields.username, fields.password);
    if (ok) navigate("/dashboard");
  }

  // Styles for auth
  const authWrap = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(90vh - 80px)",
    background: "none"
  };
  const formWrap = {
    background: "white",
    borderRadius: "18px",
    boxShadow: "0 6px 28px 0 rgba(151,60,170,0.10)",
    padding: "38px 36px 32px",
    width: "100%",
    maxWidth: 376,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "fadeInPop 0.6s cubic-bezier(.41,.81,.52,1)",
    marginTop: 32,
    marginBottom: 22
  };
  const titleStyle = {
    margin: "0 0 23px",
    color: "#973caa",
    fontWeight: 700,
    fontSize: "2rem"
  };
  const inputStyle = {
    marginBottom: 20
  };
  const linkStyle = {
    color: "#973caa",
    fontWeight: 600,
    textDecoration: "underline",
    marginLeft: 2
  };
  return (
    <div className="auth-container" style={authWrap}>
      <form className="auth-form subtle-pop" autoComplete="off" onSubmit={handleSubmit} style={formWrap}>
        <h2 style={titleStyle}>Sign in to CineQuest</h2>
        <input
          className="input"
          name="username"
          placeholder="Username"
          value={fields.username}
          onChange={handleChange}
          autoFocus
          style={inputStyle}
        />
        <input
          className="input"
          name="password"
          placeholder="Password"
          type="password"
          value={fields.password}
          onChange={handleChange}
          style={inputStyle}
        />
        {error && <ErrorToast message={error} />}
        <button className="btn btn-large subtle-pop" type="submit" disabled={loading} style={{ marginTop: 16, marginBottom: 8 }}>
          {loading ? <Loader size="18" /> : "Login"}
        </button>
        <div style={{ marginTop: 12, fontSize: ".98rem", color: "#666" }}>
          No account?
          <Link
            to="/signup"
            style={linkStyle}
          >
            Sign up here
          </Link>
        </div>
      </form>
    </div>
  );
}
