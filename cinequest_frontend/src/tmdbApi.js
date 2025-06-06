// Very simple TMDB utilities for the original CineQuest delivery

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

// PUBLIC_INTERFACE
export async function fetchMoviesByRegion(region, options = {}) {
  // Only Hollywood (US) or Kollywood (IN), simple logic
  const params = {
    page: options.page || 1,
    region,
    ...(options.query ? { query: options.query } : {}),
    ...(region === "IN"
      ? { language: "ta-IN", with_original_language: "ta" }
      : { language: options.language || "en-US", with_original_language: "en" }),
  };
  const endpoint = options.query ? "/search/movie" : "/discover/movie";
  const url = new URL(API_BASE_URL + endpoint);
  url.searchParams.append("api_key", API_KEY);
  Object.entries(params).forEach(([k, v]) => v && url.searchParams.append(k, v));
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("TMDB API error");
  const data = await resp.json();
  if (region === "IN" && data.results) {
    // Only Tamil movies for Kollywood (original C.Q. version)
    data.results = data.results.filter(
      m => m && (m.original_language === "ta" || (m.spoken_languages && m.spoken_languages.some(l => l.iso_639_1 === "ta"))));
  }
  return data;
}

// PUBLIC_INTERFACE
export async function fetchMovieDetails(movieId, options = {}) {
  const url = new URL(`${API_BASE_URL}/movie/${movieId}`);
  url.searchParams.append("api_key", API_KEY);
  if (options.language) url.searchParams.append("language", options.language);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("TMDB API error");
  return await resp.json();
}

// PUBLIC_INTERFACE
export async function fetchMovieCredits(movieId) {
  const url = new URL(`${API_BASE_URL}/movie/${movieId}/credits`);
  url.searchParams.append("api_key", API_KEY);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("TMDB API error");
  return await resp.json();
}

// PUBLIC_INTERFACE
export async function fetchPopularActors(region, options = {}) {
  // No Kollywood filter; use original_language as hint (original version)
  const params = {
    page: options.page || 1,
    ...(region === "IN" ? { with_original_language: "ta" } : {}),
  };
  const url = new URL(`${API_BASE_URL}/person/popular`);
  url.searchParams.append("api_key", API_KEY);
  Object.entries(params).forEach(([k, v]) => v && url.searchParams.append(k, v));
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("TMDB API error");
  return await resp.json();
}
