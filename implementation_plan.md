1. Identify all game components requiring answer/title reveal logic:
   - FilmDetective.js
   - MovieDialogueQuiz.js
   - MemoryTrainer.js
   - MovieIQChallenge.js
   - ObjectMovieGuess.js

2. For each, audit how/when movie answers/titles are shown. Refactor so:
   - The correct answer or movie title is never displayed automatically.
   - A "Reveal Answer" button is rendered.
   - Only after the user clicks "Reveal Answer" is the answer/title fetched (if not already) and shown.

3. Ensure answer fetch goes via TMDB API integration:
   - Use TMDB-provided title, no hardcoded/cached answers.
   - If a component does not already use the TMDB API directly to fetch the answer, refactor to do so.
   - Handle errors if TMDB fails to provide a title at reveal time.

4. Clean up any feedback logic so “Wrong!”/“Skipped!” never auto-reveals the answer: answer is hidden unless revealed.

5. For MemoryTrainer and ObjectMovieGuess, where the answer/title may appear elsewhere (e.g. as context or after time-out), audit UI and ensure the answer is gated behind the Reveal button only.

6. Ensure code comments document the UI contract for future devs on every public interface.

Assumptions:
- All relevant TMDB-fetching code lives in/can use existing tmdbApi.js or tmdbGameUtils.js.
- The reveal button’s usage matches accessibility and app’s look/feel.
- Movie answer = movie title (from TMDB response).

Files to be edited:
- cinequest_frontend/src/pages/games/FilmDetective.js
- cinequest_frontend/src/pages/games/MovieDialogueQuiz.js
- cinequest_frontend/src/pages/games/MemoryTrainer.js
- cinequest_frontend/src/pages/games/MovieIQChallenge.js
- cinequest_frontend/src/pages/games/ObjectMovieGuess.js
