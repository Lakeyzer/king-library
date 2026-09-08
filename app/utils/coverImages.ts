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

// Cover for a specific Open Library edition a user has added to their
// collection - see supabase-conventions "Cover images". Never persisted;
// built on demand from the id the same way getOpenLibraryCoverUrl builds one
// from a numeric id.
//
// `editionId` is `user_book_editions.edition_id`, which is stored verbatim
// from Open Library's editions.json `entries[].key` field - that field is a
// full resource path (e.g. "/books/OL7353617M"), not a bare OLID, since
// every Open Library "key" is formatted that way. The covers.openlibrary.org
// olid endpoint wants just the bare id, so strip everything up to the last
// "/" (a no-op if a bare id is ever passed instead).
export function getEditionCoverUrl(editionId: string, size: OpenLibraryCoverSize) {
  const olid = editionId.split("/").pop() || editionId;
  return `https://covers.openlibrary.org/b/olid/${olid}-${size}.jpg`;
}

// Fallback cover for a King work marked owned with no edition picked - live
// fetch of the work's own Open Library record rather than a persisted id,
// per supabase-conventions "Fallback for owned-without-edition". Returns
// null (no cover) rather than throwing when the work has no Open Library
// work key or the fetch fails, matching WorkEditionList's "supplementary,
// not blocking" treatment of Open Library calls.
export async function getWorkCoverUrl(workKey: string, size: OpenLibraryCoverSize): Promise<string | null> {
  try {
    const data = await $fetch<{ covers?: number[] }>(`https://openlibrary.org/works/${workKey}.json`);
    const coverId = data.covers?.find((id) => id > 0) ?? null;
    return coverId ? getOpenLibraryCoverUrl(coverId, size) : null;
  } catch {
    return null;
  }
}
