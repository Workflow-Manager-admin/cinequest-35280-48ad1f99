import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

/**
 * Users DB for localStorage simulation
 * Format: { users: [{ username, password }] }
 */
const LOCAL_DB_KEY = "cinequest_users";
const SESSION_KEY = "cinequest_session";

/**
 * PUBLIC_INTERFACE
 * AuthProvider: Context provider for user login/signup state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    return session ? { username: session.username } : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username }));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  // Helpers for simulated backend
  function fetchUsersDB() {
    return JSON.parse(localStorage.getItem(LOCAL_DB_KEY)) || { users: [] };
  }
  function saveUsersDB(data) {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(data));
  }

  // PUBLIC_INTERFACE
  async function login(username, password) {
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 400));
    const db = fetchUsersDB();
    const userObj = db.users.find(u => u.username === username && u.password === password);
    if (userObj) {
      setUser({ username });
      setLoading(false);
      return true;
    } else {
      setError("Invalid username or password");
      setLoading(false);
      return false;
    }
  }

  // PUBLIC_INTERFACE
  async function signup(username, password) {
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 400));
    const db = fetchUsersDB();
    if (db.users.find(u => u.username === username)) {
      setError("Username already taken");
      setLoading(false);
      return false;
    } else {
      db.users.push({ username, password });
      saveUsersDB(db);
      setUser({ username });
      setLoading(false);
      return true;
    }
  }

  // PUBLIC_INTERFACE
  function logout() {
    setUser(null);
    setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * PUBLIC_INTERFACE
 * useAuth: Consume user/session state
 */
export function useAuth() {
  return useContext(AuthContext);
}
