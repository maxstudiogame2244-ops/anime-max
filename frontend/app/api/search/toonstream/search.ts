import axios from "axios";

export interface ToonStreamSearchResult {
  id: string;
  title: string;
  image: string;
  type?: string;
  language?: string;
}

export async function toonstreamSearchMedia({ query }: { query: string }): Promise<ToonStreamSearchResult[]> {
  try {
    const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URL + "/episodes/toonstream/search";

    const data: ToonStreamSearchResult[] = await axios
      .get(BACKEND_URI, {
        params: { q: query },
      })
      .then((res) => res.data.results);

    return data || [];
  } catch (error) {
    console.error("Error searching ToonStream:", error);
    return [];
  }
}
