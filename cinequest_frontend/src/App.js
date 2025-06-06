import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Header from './components/Header';
// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ActorComboFinder from './pages/games/ActorComboFinder';
import FilmDetective from './pages/games/FilmDetective';
import MovieDialogueQuiz from './pages/games/MovieDialogueQuiz';
import MemoryTrainer from './pages/games/MemoryTrainer';
import MovieIQChallenge from './pages/games/MovieIQChallenge';
import ObjectMovieGuess from './pages/games/ObjectMovieGuess';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<RequireAuthOrRoute />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/game/actor-combo"
                element={
                  <ProtectedRoute>
                    <ActorComboFinder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/game/film-detective"
                element={
                  <ProtectedRoute>
                    <FilmDetective />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/game/dialogue-quiz"
                element={
                  <ProtectedRoute>
                    <MovieDialogueQuiz />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/game/memory-trainer"
                element={
                  <ProtectedRoute>
                    <MemoryTrainer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/game/iq-challenge"
                element={
                  <ProtectedRoute>
                    <MovieIQChallenge />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/game/object-movie-guess"
                element={
                  <ProtectedRoute>
                    <ObjectMovieGuess />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

function RequireAuthOrRoute() {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

export default App;