//
// Tamil Transliteration and Kollywood Answer Display Utilities
//
// - Provides transliterateTamilToEnglish (basic Tamil-to-Romanized) for fallback
// - getKollywoodDisplayAnswer: Always prefer TMDB original_title/title if in Latin/English script
// - Export getKollywoodAnswerRoman for backward compatibility
//

/**
 * Simple transliteration from Tamil script to Romanized (Latin) script.
 * Basic mapping: not 100% accurate (improvement possible).
 * Used only as a fallback if no Latin/English title is present in TMDB data.
 * @param {string} text - Tamil text to transliterate.
 * @returns {string}
 */
export function transliterateTamilToEnglish(text) {
  // Only transliterate Tamil Unicode block (U+0B80).
  // Mapping table: Only partial/simplified Unicode-character-to-Latin mapping.
  // For production, use a proper transliteration library!
  if (!text) return "";
  const tamil = [
    'அ','ஆ','இ','ஈ','உ','ஊ','எ','ஏ','ஐ','ஒ','ஓ','ஔ',
    'க','ங','ச','ஜ','ஞ','ட','ண','த','ந','ப','ம','ய','ர','ல',
    'வ','ழ','ள','ற','ன',
    'ஶ','ஷ','ஸ','ஹ','ஃ',
    'ா','ி','ீ','ு','ூ','ெ','ே','ை','ொ','ோ','ௌ','்'
  ];
  const latin = [
    'a','aa','i','ii','u','uu','e','ee','ai','o','oo','au',
    'ka','nga','sa','ja','nya','ta','na','tha','na','pa','ma','ya','ra','la',
    'va','zha','la','ra','na',
    'sha','sha','sa','ha','ak',
    'aa','i','ii','u','uu','e','ee','ai','o','oo','au',''
  ];
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const idx = tamil.indexOf(text[i]);
    result += idx >= 0 ? latin[idx] : text[i];
  }
  return result;
}

/**
 * PUBLIC_INTERFACE
 * Returns the "official" Kollywood quiz answer for a TMDB movie.
 * - Prefer TMDB's official English/Latin script (ASCII) title if available (original_title or title).
 * - Only fallback to transliteration if NO Latin/English script form is present.
 * - Used for answer reveals/displays in all Kollywood games.
 * @param {object} movie - TMDB movie object.
 * @returns {string} - Preferred display answer.
 */
export function getKollywoodDisplayAnswer(movie) {
  if (!movie) return "";
  // Check original_title first, then title, for Latin/ASCII
  function isLatin(str) {
    return !!str && /^[\x00-\x7F\s.,'":;!?&()\-]+$/.test(str);
  }
  if (isLatin(movie.original_title)) return movie.original_title.trim();
  if (isLatin(movie.title)) return movie.title.trim();
  // Fallback: transliterate title or original_title
  const source = movie.title || movie.original_title || "";
  return transliterateTamilToEnglish(source);
}

// PUBLIC_INTERFACE
// For backward compatibility with old usage.
export const getKollywoodAnswerRoman = getKollywoodDisplayAnswer;
