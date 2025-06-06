import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import ErrorToast from "../components/ErrorToast";

export default function SignupPage() {
  const { signup, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState({ username: "", password: "" });

  function handleChange(e) {
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fields.username || !fields.password) {
      setError("Choose a username and password");
      return;
    }
    const ok = await signup(fields.username, fields.password);
    if (ok) navigate("/dashboard");
  }

  return (
    <div className="auth-container">
      <form className="auth-form" autoComplete="off" onSubmit={handleSubmit}>
        <h2>Create an account</h2>
        <input
          className="input"
          name="username"
          placeholder="Username"
          value={fields.username}
          onChange={handleChange}
          autoFocus
        />
        <input
          className="input"
          name="password"
          placeholder="Password"
          type="password"
          value={fields.password}
          onChange={handleChange}
        />
        {error && <ErrorToast message={error} />}
        <button className="btn btn-large" type="submit" disabled={loading}>
          {loading ? <Loader size="18" /> : "Sign up"}
        </button>
        <div style={{ marginTop: 12 }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "#973caa", fontWeight: 500, textDecoration: "underline" }}
          >
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}
