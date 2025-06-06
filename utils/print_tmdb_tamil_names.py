import requests

TMDB_API_KEY = "5bc67d3b06aecbd18121a3cbbc16eb59"
URL = "https://api.themoviedb.org/3/discover/movie"

params = {
    "with_original_language": "ta",
    "language": "ta-IN",
    "region": "IN",
    "sort_by": "popularity.desc",
    "page": 1,
    "api_key": TMDB_API_KEY
}

def main():
    print("Fetching TMDB sample data for Tamil-language movies...\n")
    response = requests.get(URL, params=params)
    if response.status_code != 200:
        print("TMDB API error:", response.status_code, response.text)
        return

    data = response.json()
    results = data.get('results', [])
    if not results:
        print("No movies found in TMDB for Tamil language.")
        return

    fields = ["title", "original_title", "original_language", "release_date"]
    print("{:<38}  {:<38}  {:<8}  {:<12}".format("title", "original_title", "orig_lang", "release_date"))
    print("-" * 105)
    for movie in results[:20]:
        row = [
            str(movie.get("title", ""))[:36],
            str(movie.get("original_title", ""))[:36],
            movie.get("original_language", ""),
            movie.get("release_date", ""),
        ]
        print("{:<38}  {:<38}  {:<8}  {:<12}".format(*row))

    print("\nDisplayed the top {} Tamil movies by TMDB popularity with key movie name fields.".format(min(20, len(results))))
    print("Observe 'title' and 'original_title': some may be English, many will be Romanized or in Tamil script, depending on the movie.")

if __name__ == "__main__":
    main()
