//
// Utility module to interact with TheMovieDB API for CineQuest
//
// - Provides functions to fetch Hollywood and Kollywood movie data
// - Handles API key via environment variables for security
// - Designed to be imported by game and quiz features
//

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

/**
 * Helper to construct full TMDB API url with api_key param.
 * @param {string} endpoint - API endpoint (e.g., '/search/movie')
 * @param {object} params - Extra params as a flat object
 * @returns {string}
 */
function buildUrl(endpoint, params = {}) {
  const url = new URL(API_BASE_URL + endpoint);

  url.searchParams.append("api_key", API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.append(k, v);
  });
  return url.toString();
}

/**
 * PUBLIC_INTERFACE
 * Fetches movies filtered by a given ISO 3166-1 country code (for Hollywood: "US", Kollywood: "IN").
 * Can be used to get lists for quiz/game features.
 * 
 * @param {'US'|'IN'} region - "US" for Hollywood, "IN" for Kollywood.
 * @param {object} options - { query, page, with_genres, year, language }
 *        e.g. { query: 'Inception', page: 1 }
 * @returns {Promise<object>} Movie search results
 */
export async function fetchMoviesByRegion(region, options = {}) {
  // Kollywood requires more specificity since TMDB's default language/region for "IN" brings up Bollywood.
  // We'll use language param plus either genre or with_original_language.
  const params = {
    page: options.page || 1,
    region,
    ...(options.query ? { query: options.query } : {}),
    ...(options.year ? { year: options.year } : {}),
    ...(options.language ? { language: options.language } : {}),
    ...(region === "US" ? { with_original_language: "en" }
      : { with_original_language: "ta" }), // "ta" = Tamil
  };

  // TMDB does not have a "kollywood" filter. Using original_language=ta (Tamil) to approximate.
  const endpoint = options.query ? "/search/movie" : "/discover/movie";
  const url = buildUrl(endpoint, params);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB API error (${response.status}): ${response.statusText}`);
  }
  return await response.json();
}

/**
 * PUBLIC_INTERFACE
 * Fetches details for a specific movie by TMDB movie ID.
 * 
 * @param {number} movieId
 * @param {object} options - { language: string }
 * @returns {Promise<object>} Movie details
 */
export async function fetchMovieDetails(movieId, options = {}) {
  const params = {
    ...(options.language ? { language: options.language } : {})
  };

  const url = buildUrl(`/movie/${movieId}`, params);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB API error (${response.status}): ${response.statusText}`);
  }
  return await response.json();
}

/**
 * PUBLIC_INTERFACE
 * Fetches cast and crew for a given movie.
 * 
 * @param {number} movieId
 * @returns {Promise<object>} credit info { cast, crew }
 */
export async function fetchMovieCredits(movieId) {
  const url = buildUrl(`/movie/${movieId}/credits`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB API error (${response.status}): ${response.statusText}`);
  }
  return await response.json();
}

/**
 * PUBLIC_INTERFACE
 * Fetches popular actors (optionally filtering for region/language).
 * 
 * @param {'US'|'IN'} region
 * @param {object} options
 * @returns {Promise<object>} actors result
 */
export async function fetchPopularActors(region, options = {}) {
  // No Kollywood filter; use original_language as hint
  const params = {
    page: options.page || 1,
    ...(region === "IN" ? { with_original_language: "ta" } : {})
  };
  const url = buildUrl("/person/popular", params);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB API error (${response.status}): ${response.statusText}`);
  }
  return await response.json();
}
