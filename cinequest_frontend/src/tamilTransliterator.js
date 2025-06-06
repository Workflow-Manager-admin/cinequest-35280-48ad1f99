//
// Tamil-to-English (Roman) transliteration utility for CineQuest.
// - Uses a lightweight mapping for basic Tamil-to-Roman conversion (sufficient for movie names).
// - Falls back to simple Latin character check (for original_title from TMDB).
// - Use in Kollywood answer displays.
//
const tamilToLatinMap = {
  "அ": "a", "ஆ": "aa", "இ": "i", "ஈ": "ee", "உ": "u", "ஊ": "oo", "எ": "e", "ஏ": "ae", "ஐ": "ai",
  "ஒ": "o", "ஓ": "oa", "ஔ": "au", "ஃ": "h",
  "க": "ka", "ங": "nga", "ச": "ca", "ஜ": "ja", "ஞ": "nya", "ட": "ta", "ண": "na",
  "த": "tha", "ந": "na", "ப": "pa", "ம": "ma", "ய": "ya", "ர": "ra", "ல": "la",
  "வ": "va", "ழ": "zha", "ள": "la", "ற": "ra", "ன": "na", "ஶ": "sha", "ஷ": "sha", "ஸ": "sa", "ஹ": "ha",
  "ா": "aa", "ி": "i", "ீ": "ee", "ு": "u", "ூ": "oo", "ெ": "e", "ே": "ae",
  "ை": "ai", "ொ": "o", "ோ": "oa", "ௌ": "au", "்": "",
  "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9"
};

function isLatin(str) {
  // Returns true if string contains only Latin script.
  return /^[\u0000-\u024F\s'".,;:!?\-()0-9]+$/.test(str);
}

// Basic Tamil->English (Roman) transliteration
// PUBLIC_INTERFACE
export function transliterateTamilToRoman(tamilStr = "") {
  if (!tamilStr) return "";
  // Fast path: title is already Latin
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
    // Try mapping for compound char+vowel
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
  // Better readability: capitalize first letter of each word
  return out.replace(/\b\w/g, c => c.toUpperCase());
}

// Get Kollywood answer in English: prefer TMDB's original_title if Latin, fallback to Romanization
// PUBLIC_INTERFACE
export function getKollywoodAnswerRoman(movie) {
  // movie: the TMDB movie object (may have original_title and title)
  if (!movie) return "";
  // Use original_title if it's present and in Latin script and not equal to Tamil title
  if (
    movie.original_title &&
    movie.original_title !== movie.title &&
    isLatin(movie.original_title)
  ) {
    return movie.original_title;
  }
  // Try title (in Tamil) converted to Roman
  if (movie.title) {
    return transliterateTamilToRoman(movie.title);
  }
  return "";
}
