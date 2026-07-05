// Pexels API client. Sources stock photography — used for the crew persona
// avatars shown in the "Meet the Crew" system model and available for any
// marketing imagery the funnel needs. Free API key: https://www.pexels.com/api/
const PEXELS_API_BASE = "https://api.pexels.com/v1";

export interface PexelsPhoto {
  id: number;
  photographer: string;
  photographerUrl: string;
  url: string; // the Pexels page for the photo, for attribution
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
  };
}

interface PexelsSearchResponse {
  photos: Array<{
    id: number;
    photographer: string;
    photographer_url: string;
    url: string;
    src: {
      original: string;
      large: string;
      medium: string;
      small: string;
    };
  }>;
}

function getApiKey(): string {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) throw new Error("PEXELS_API_KEY must be set (see .env.example)");
  return apiKey;
}

function toPhoto(raw: PexelsSearchResponse["photos"][number]): PexelsPhoto {
  return {
    id: raw.id,
    photographer: raw.photographer,
    photographerUrl: raw.photographer_url,
    url: raw.url,
    src: raw.src,
  };
}

export async function searchPhotos(query: string, perPage = 8): Promise<PexelsPhoto[]> {
  const url = new URL(`${PEXELS_API_BASE}/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));

  const response = await fetch(url, {
    headers: { Authorization: getApiKey() },
  });
  if (!response.ok) {
    throw new Error(`Pexels search failed: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as PexelsSearchResponse;
  return data.photos.map(toPhoto);
}

export async function getPhoto(id: number): Promise<PexelsPhoto> {
  const response = await fetch(`${PEXELS_API_BASE}/photos/${id}`, {
    headers: { Authorization: getApiKey() },
  });
  if (!response.ok) {
    throw new Error(`Pexels lookup failed: ${response.status} ${response.statusText}`);
  }
  const raw = (await response.json()) as PexelsSearchResponse["photos"][number];
  return toPhoto(raw);
}
