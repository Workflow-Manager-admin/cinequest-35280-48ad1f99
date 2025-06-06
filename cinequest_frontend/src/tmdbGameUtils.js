import { fetchMoviesByRegion } from "./tmdbApi";

// PUBLIC_INTERFACE
// Utility functions for TMDB-powered CineQuest games. 
// All Kollywood (region "IN") fetches use strict Tamil-language filtering.

// Sample dev/test fetch (visible in dev console for sanity checking)
if (process.env.NODE_ENV === "development") {
  (async () => {
    try {
      const sampleKollywood = await fetchMoviesByRegion("IN", { page: 1 });
      if (sampleKollywood && Array.isArray(sampleKollywood.results)) {
        // Log basic details for verification
        console.log(
          "[Kollywood Sample]",
          sampleKollywood.results
            .slice(0, 3)
            .map((m) => `${m.title} (${m.original_language})`)
            .join("; ")
        );
      }
    } catch (e) {
      console.error("Kollywood Sample fetch failed", e);
    }
  })();
}

/**
 * PUBLIC_INTERFACE
 * Fetches all movies in which both given actors appear, filtered for Hollywood (US) or Kollywood (IN: Tamil-only).
 * @param {string|number} actor1Id
 * @param {string|number} actor2Id
 * @param {'US'|'IN'} region
 * @returns {Promise<object[]>} Array of movie objects where both actors starred
 */
export async function getMoviesWithBothActors(actor1Id, actor2Id, region = "US") {
  // Placeholder stub; real implementation can use fetch/credits as needed
  return [];
}

/**
 * PUBLIC_INTERFACE
 * Generates a memory trainer round.
 * @param {'US'|'IN'} region
 * @returns {Promise<object>} Object with { movie, imageUrl, recallType, answer }
 */
export async function getMemoryTrainerRound(region = "US") {
  // Minimal stub. The actual implementation would call TMDB appropriately.
  return {
    movie: {
      id: 0,
      title: "Sample Movie",
      original_language: region === "IN" ? "ta" : "en",
      credits: { cast: [] }
    },
    imageUrl: "",
    recallType: "year",
    answer: "2000"
  };
}

/**
 * PUBLIC_INTERFACE
 * Generates an IQ Challenge round.
 * @param {'US'|'IN'} region
 * @returns {Promise<object>} Object with { movie, director }
 */
export async function getIQChallengeRound(region = "US") {
  // Minimal stub only. The actual version should use TMDB API.
  return {
    movie: {
      id: 1,
      title: region === "IN" ? "தாமிரபரணி" : "Inception",
      original_language: region === "IN" ? "ta" : "en"
    },
    director: region === "IN" ? "ஹரி" : "Christopher Nolan"
  };
}

/**
 * PUBLIC_INTERFACE
 * Fetches an array of random movies (region-aware). Used for quiz decoys or multiple choice options.
 * @param {'US'|'IN'} region
 * @param {number} n - number of movies to fetch
 * @param {object} options - could include {page, genre, etc}
 * @returns {Promise<object[]>}
 */
export async function getRandomMovies(region = "US", n = 3, options = {}) {
  // Minimal stub: returns n dummy movies with proper language for region
  return Array.from({ length: n }).map((_, i) => ({
    id: 100 + i,
    title: region === "IN" ? `காதல் படம் ${i + 1}` : `Hollywood Movie ${i + 1}`,
    original_language: region === "IN" ? "ta" : "en",
    overview: "",
    poster_path: null,
  }));
}

/**
 * PUBLIC_INTERFACE
 * Returns a random sample of n elements from arr (shuffle if needed).
 * @param {Array} arr
 * @param {number} n
 * @returns {Array}
 */
export function sampleN(arr, n) {
  if (!Array.isArray(arr)) return [];
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

// You can add or re-export further helper utilities here as needed for the games, 
// e.g. actor/movie fetching logic, quiz round generators, etc.
// No further content shown (refer to each game file for their own utility logic).
