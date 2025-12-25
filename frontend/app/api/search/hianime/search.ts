import axios from "axios";

export interface HiAnimeSearchResult {
  id: string;
  name: string;
  poster: string;
  duration: string;
  type: string;
  rating: string;
  episodes: {
    sub: number;
    dub: number;
  };
}

export async function hianimeSearchMedia({ query }: { query: string }): Promise<HiAnimeSearchResult[]> {
  try {
    const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URL + "/episodes/hianime/search";

    const data: HiAnimeSearchResult[] = await axios
      .get(BACKEND_URI, {
        params: { q: query },
      })
      .then((res) => res.data.results);

    return data || [];
  } catch (error) {
    console.error("Error searching HiAnime:", error);
    return [];
  }
}
