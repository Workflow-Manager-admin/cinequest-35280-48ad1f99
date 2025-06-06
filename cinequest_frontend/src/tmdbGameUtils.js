//
// Utility functions for TMDB-powered CineQuest games
// Provides helpers to get movies, actors, sample quotes, find combos, pick clues, etc.
//

import {
  fetchMoviesByRegion,
  fetchMovieDetails,
  fetchMovieCredits,
  fetchPopularActors,
} from "./tmdbApi";

/**
 * PUBLIC_INTERFACE
 * Randomly sample n elements from an array.
 */
export function sampleN(arr, n) {
  if (!Array.isArray(arr)) return [];
  const arrCopy = [...arr];
  const result = [];
  for (let i = 0; i < n && arrCopy.length; i++) {
    const idx = Math.floor(Math.random() * arrCopy.length);
    result.push(arrCopy.splice(idx, 1)[0]);
  }
  return result;
}

/**
 * PUBLIC_INTERFACE
 * Get a random popular actor list for a given region.
 * Returns: [{ id, name, profile_path }]
 */
export async function getPopularActors(region = "US", opts = {}) {
  const data = await fetchPopularActors(region, opts);
  return (data && data.results) ? data.results : [];
}

/**
 * PUBLIC_INTERFACE
 * Given two actor IDs, find all movies they both appeared in.
 * Returns list of movie objects (limited to first 15 for perf)
 */
export async function getMoviesWithBothActors(actorId1, actorId2, region = "US") {
  // Fetch movies for actor1, filter by movies also with actor2's id in credits
  // TMDB workaround: first fetch credits for actor1, get film IDs, then compare with actor2's credits
  
  const fetchCredits = async (personId) => {
    const url = `https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${process.env.REACT_APP_TMDB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.cast || [];
  };

  const [movies1, movies2] = await Promise.all([
    fetchCredits(actorId1),
    fetchCredits(actorId2)
  ]);
  // Find intersection on movie id
  const idSet2 = new Set(movies2.map(m => m.id));
  const comboMovies = movies1.filter(m => idSet2.has(m.id));
  // Sort by popularity, limit 15
  comboMovies.sort((a,b)=>b.popularity-a.popularity);
  return comboMovies.slice(0, 15);
}

/**
 * PUBLIC_INTERFACE
 * Sample n movies (optionally by region), can filter on year/language.
 */
export async function getRandomMovies(region = "US", n = 1, opts = {}) {
  // We'll get a page of movies and sample randomly from page.
  const page = 1 + Math.floor(Math.random() * 3); // Randomize a bit
  const res = await fetchMoviesByRegion(region, { page, ...opts });
  if (!res || !res.results) return [];
  return sampleN(res.results, n);
}

/**
 * PUBLIC_INTERFACE
 * Get a random movie quote (uses tagline or overview as best TMDB surrogate).
 * Returns an object with: { text, movie, decoys }
 * Always pulls fresh movies, picks one with tagline or overview.
 */
export async function getRandomDialogueQuiz(region = "US", decoyCount = 3) {
  // Try up to 8 times to get a movie with a good tagline/overview
  let picked = null;
  let tries = 0;
  while (!picked && tries < 8) {
    const [movie] = await getRandomMovies(region, 1, {});
    if (
      movie &&
      ((movie.tagline && movie.tagline.length > 12) ||
        (movie.overview && movie.overview.length > 18))
    ) {
      picked = movie;
      break;
    }
    tries++;
  }
  if (!picked) return null;

  // Prepare the quote and answer
  const quote =
    (picked.tagline && picked.tagline.length > 12) ? picked.tagline : picked.overview;

  // Get decoy movies
  const decoys = [];
  let decoyTries = 0;
  while (decoys.length < decoyCount && decoyTries < 10) {
    const candidates = await getRandomMovies(region, decoyCount + 2, {});
    for (const m of candidates) {
      if (
        m.id !== picked.id &&
        !decoys.find((d) => d.id === m.id) &&
        (m.title && m.title.length > 4)
      ) {
        decoys.push(m);
        if (decoys.length === decoyCount) break;
      }
    }
    decoyTries++;
  }

  // Shuffle answers
  const allChoices = sampleN([picked, ...decoys], decoyCount + 1);

  return {
    text: quote,
    answer: picked,
    choices: allChoices,
  };
}

/**
 * PUBLIC_INTERFACE
 * Pick a movie and a still image (poster or backdrop) for MemoryTrainer.
 * Returns: { movie, imageUrl }
 */
export async function getMemoryTrainerRound(region = "US") {
  let movie = null;
  let tries = 0;
  while (!movie && tries < 7) {
    [movie] = await getRandomMovies(region, 1);
    if (
      movie &&
      (movie.backdrop_path || movie.poster_path)
    ) {
      break;
    }
    tries++;
  }
  if (!movie) return null;

  // Pick a recall question (director, year, or genre)
  let recallType = sampleN(["director", "year", "genre"], 1)[0];
  let recallQ = "";
  let answer = "";
  let credits = null;
  if (recallType === "director") {
    credits = await fetchMovieCredits(movie.id);
    const directors = credits.crew.filter(c => c.job === "Director");
    if (directors.length) {
      recallQ = "Who is the director of this movie?";
      answer = directors.map(d => d.name).join(", ");
    } else {
      recallType = "year";
    }
  }
  if (recallType === "year" && movie.release_date) {
    recallQ = "What is the release year of this movie?";
    answer = movie.release_date.slice(0, 4);
  }
  if (recallType === "genre" && movie.genre_ids && movie.genre_ids.length) {
    recallQ = "Name one of the genres of this movie.";
    // Note: genres map is not included, so fallback to year
    if (!recallQ) {
      recallQ = "What is the release year of this movie?";
      answer = movie.release_date.slice(0, 4);
    }
  }

  const posterBase = "https://image.tmdb.org/t/p/w500";
  return {
    movie,
    imageUrl: movie.backdrop_path
      ? posterBase + movie.backdrop_path
      : posterBase + movie.poster_path,
    recallType,
    recallQ,
    answer
  };
}

/**
 * PUBLIC_INTERFACE
 * For MovieIQChallenge: pick a movie and extract (year, director) for guessing.
 * Returns: { movie, director, year }
 */
export async function getIQChallengeRound(region="US") {
  let movie = null;
  let tries = 0;
  while (!movie && tries < 7) {
    [movie] = await getRandomMovies(region, 1);
    if (movie) break;
    tries++;
  }
  if (!movie) return null;
  const credits = await fetchMovieCredits(movie.id);
  const directors = credits.crew.filter(c => c.job === "Director");
  return {
    movie,
    director: directors.length ? directors.map(d=>d.name).join(", ") : "",
    year: movie.release_date ? movie.release_date.slice(0,4) : ""
  };
}

/**
 * PUBLIC_INTERFACE
 * For ObjectMovieGuess: pick a movie and generate four 'object' clues using genres, keywords, or co-stars.
 * Returns: { movie, objects }
 */
export async function getObjectGuessRound(region="US") {
  let movie = null;
  let tries = 0;
  while (!movie && tries < 7) {
    [movie] = await getRandomMovies(region, 1);
    if (movie) break;
    tries++;
  }
  if (!movie) return null;

  // Attempt to get genre names, keywords, or actors as objects.
  const objects = [];
  try {
    const details = await fetchMovieDetails(movie.id);
    // Use genres as object clues
    if (details.genres && details.genres.length) {
      objects.push(...details.genres.map(g=>g.name));
    }
    // If available, use keywords (not always available in all fetches)
    // Omit keywords fetch for minimal API usage
  } catch (e) {
    // fallback
  }
  // Add popular actor co-star
  const credits = await fetchMovieCredits(movie.id);
  if (credits.cast && credits.cast.length) {
    objects.push(...sampleN(credits.cast.map(a=>a.name), 2));
  }
  // If less than 4, fill with random words from title/tagline
  if (objects.length < 4 && movie.title) {
    objects.push(...movie.title.split(" ").slice(0,2));
  }
  // Remove duplicates, trim to 4
  const uniq = [];
  for (const o of objects) {
    if (o && !uniq.includes(o) && uniq.length < 4) uniq.push(o);
  }
  return { movie, objects: uniq.slice(0, 4) };
}
