export type OpenLibraryCoverSize = "S" | "M" | "L";

export function getOpenLibraryCoverUrl(coverId: number, size: OpenLibraryCoverSize) {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export type TmdbPosterSize = "w92" | "w154" | "w185" | "w342" | "w500" | "original";

// TMDb's image base URL is documented as effectively static, so it's hardcoded
// here rather than fetched from /configuration on every render.
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export function getTmdbPosterUrl(posterPath: string, size: TmdbPosterSize) {
  return `${TMDB_IMAGE_BASE_URL}/${size}${posterPath}`;
}
