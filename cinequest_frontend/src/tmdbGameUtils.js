//
// Utility functions for CineQuest games - original version, with basic helpers only
//

/**
 * PUBLIC_INTERFACE
 * Generate a round for movie recall/memory game (random movie and simple Q/A)
 */
export async function getMemoryTrainerRound(region) {
  // Use Hollywood or Kollywood, basic fetch and pick logic
  const { fetchMoviesByRegion } = await import("./tmdbApi");
  const res = await fetchMoviesByRegion(region, { page: 1 + Math.floor(Math.random() * 3) });
  if (!res || !res.results || !res.results.length) throw new Error("No movies found");
  const movie = res.results[Math.floor(Math.random() * res.results.length)];
  return {
    movie,
    imageUrl: movie.poster_path ? "https://image.tmdb.org/t/p/w342" + movie.poster_path : "",
    answer: movie.title,
    recallType: "title",
  };
}

/**
 * PUBLIC_INTERFACE
 * Generate IQ challenge round (returns movie + director + year, no keyword logic)
 */
export async function getIQChallengeRound(region) {
  const { fetchMoviesByRegion, fetchMovieCredits } = await import("./tmdbApi");
  const res = await fetchMoviesByRegion(region);
  if (!res || !res.results || !res.results.length) throw new Error("No movies found");
  const movie = res.results[Math.floor(Math.random() * res.results.length)];
  // Simple director finding
  let director = "";
  try {
    const credits = await fetchMovieCredits(movie.id);
    const dir = credits.crew && credits.crew.find(c => c.job === "Director");
    director = dir ? dir.name : "";
  } catch (e) {}
  return { movie, director, answer: movie.title, year: (movie.release_date || "").slice(0, 4) };
}

/**
 * PUBLIC_INTERFACE
 * Simple getRandomMovies for ObjectMovieGuess/MovieIQ=Challenge (returns N movies)
 */
export async function getRandomMovies(region, n, options) {
  const { fetchMoviesByRegion } = await import("./tmdbApi");
  const res = await fetchMoviesByRegion(region, { ...options });
  if (!res || !res.results) return [];
  let arr = [...res.results];
  // Shuffle and sample n
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

/**
 * PUBLIC_INTERFACE
 * Fisher-Yates sample N from array (defensively shallow copied)
 */
export function sampleN(arr, n) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}
