//
// Simple romanization helpers for Kollywood (Tamil) game support,
// as used in original CineQuest delivery. Minimal, stateless.
//

// Map Tamil characters to simple romanization (focussed on movie/game display only)
const TAM_TO_ROMAN = {
  "அ": "a", "ஆ": "aa", "இ": "i", "ஈ": "ii", "உ": "u", "ஊ": "uu",
  "எ": "e", "ஏ": "ee", "ஐ": "ai", "ஒ": "o", "ஓ": "oo", "ஔ": "au",
  // Some consonants and combos for demo/fuzzy match
  "க": "ka", "ச": "sa", "ட": "ta", "த": "tha", "ப": "pa", "ஞ": "nya", "ய": "ya", "ர": "ra", "ள": "la", "வ": "va", "ழ": "zha", "ஜ": "ja"
};

function romanizeTamilTitle(tamil) {
  if (!tamil || typeof tamil !== "string") return tamil;
  return tamil.split("").map(c => TAM_TO_ROMAN[c] || c).join("");
}

// PUBLIC_INTERFACE
export function getKollywoodDisplayAnswer(movie) {
  // If standard title is in Latin, show as is, otherwise romanize first word
  if (!movie || !movie.title) return "";
  const t = movie.title;
  if (/^[A-Za-z0-9]/.test(t)) return t;
  // Romanize, fallback to original if not Tamil-like
  return romanizeTamilTitle(t.split(" ")[0] || t);
}

// PUBLIC_INTERFACE
export function getKollywoodAnswerRoman(movie) {
  // Just romanize all, for demo UI (refine later)
  if (!movie || !movie.title) return "";
  const t = movie.title;
  return romanizeTamilTitle(t);
}
