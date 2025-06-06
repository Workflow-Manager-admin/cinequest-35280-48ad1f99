//
// Tamil-to-English (Roman) transliteration utility for CineQuest.
//
// This module enforces the display rule that Kollywood movie answers must appear in normal, readable English:
// - Use the official TMDB title or original_title field if it is in Latin/English script.
// - Only perform transliteration if no such readable title exists.
// - NEVER show blocky, letter-by-letter outputs.
//
// Provides:
//   - getKollywoodAnswerRoman(movie): Returns a well-formatted English answer for Kollywood movies.
//   - transliterateTamilToRoman(str): Utility for fallback transliteration only.

const tamilToLatinMap = {
  "\u0b85": "a", "\u0b86": "aa", "\u0b87": "i", "\u0b88": "ee", "\u0b89": "u", "\u0b8a": "oo", "\u0b8e": "e", "\u0b8f": "ae", "\u0b90": "ai",
  "\u0b92": "o", "\u0b93": "oa", "\u0b94": "au", "\u0b83": "h",
  "\u0b95": "ka", "\u0b99": "nga", "\u0b9a": "ca", "\u0b9c": "ja", "\u0b9e": "nya", "\u0b9f": "ta", "\u0ba3": "na",
  "\u0ba4": "tha", "\u0ba8": "na", "\u0baa": "pa", "\u0bae": "ma", "\u0baf": "ya", "\u0bb0": "ra", "\u0bb2": "la",
  "\u0bb5": "va", "\u0bb4": "zha", "\u0bb3": "la", "\u0bb1": "ra", "\u0ba9": "na", "\u0bb6": "sha", "\u0bb7": "sha", "\u0bb8": "sa", "\u0bb9": "ha",
  "\u0bbe": "aa", "\u0bbf": "i", "\u0bc0": "ee", "\u0bc1": "u", "\u0bc2": "oo", "\u0bc6": "e", "\u0bc7": "ae",
  "\u0bc8": "ai", "\u0bca": "o", "\u0bcb": "oa", "\u0bcc": "au", "\u0bcd": "",
  "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9"
};

// Return true if the string is already Latin/English readable.
function isLatin(str) {
  return /^[\u0020-\u024F\s'":,.\-0-9!?&()]+$/i.test((str || "").trim());
}

/**
 * PUBLIC_INTERFACE
 * transliterateTamilToRoman
 * Basic Tamil->English (Roman) transliteration for fallback display only.
 * Never used in blocky style, always as a readable phrase.
 */
export function transliterateTamilToRoman(tamilStr = "") {
  if (!tamilStr) return "";
  if (isLatin(tamilStr)) return tamilStr;
  let out = "";
  let skipNext = false;
  for (let i = 0; i < tamilStr.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    const curr = tamilStr[i];
    const next = tamilStr[i + 1] || "";
    if (tamilToLatinMap[curr + next]) {
      out += tamilToLatinMap[curr + next];
      skipNext = true;
      continue;
    }
    if (tamilToLatinMap[curr]) {
      out += tamilToLatinMap[curr];
    } else {
      out += curr;
    }
  }
  // Capitalize first letter of each word for readability
  return out.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * PUBLIC_INTERFACE
 * getKollywoodAnswerRoman
 * Returns a readable, well-capitalized English answer for Kollywood movies:
 * - Uses TMDB's English/Latin title if present and readable.
 * - Falls back to readable phonetic transliteration with proper capitalization.
 * - NEVER returns a block/letter-wise transliteration.
 * @param {object} movie – TMDB movie object with title/original_title/release_date
 * @returns {string} Well-formatted movie answer string (e.g. "Master (2021)")
 */
export function getKollywoodAnswerRoman(movie) {
  if (!movie) return "";

  // Best: TMDB title in Latin
  if (movie.title && isLatin(movie.title)) {
    return titleCaseWithYear(movie.title, movie.release_date);
  }
  // Second: TMDB original_title in Latin
  if (movie.original_title && isLatin(movie.original_title)) {
    return titleCaseWithYear(movie.original_title, movie.release_date);
  }
  // Third: explicit translit field
  if (typeof movie.translit === "string" && movie.translit.trim()) {
    return titleCaseWithYear(movie.translit, movie.release_date);
  }
  // Fallback: transliterate TMDB title, or original_title if nothing else
  let text = movie.title || movie.original_title || "";
  return titleCaseWithYear(transliterateTamilToRoman(text), movie.release_date);
}

// Title case with year append helper
function titleCaseWithYear(str, release_date) {
  // Clean up extra whitespace first
  let txt = str.replace(/\s{2,}/g, " ").trim();
  // Title case (keep existing colons, etc.)
  txt = txt.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
  // Append year if not present
  let year = "";
  if (release_date && typeof release_date === "string" && /^\d{4}/.test(release_date)) {
    year = release_date.slice(0, 4);
    if (!txt.match(/\(\d{4}\)$/)) txt += ` (${year})`;
  }
  return txt.trim();
}
