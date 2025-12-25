import axios from "axios";

export interface ToonStreamAnimeInfo {
  id: string;
  title: string;
  image: string;
  description?: string;
  episodes?: ToonStreamEpisode[];
}

export interface ToonStreamEpisode {
  id: string;
  number: number;
  title?: string;
}

export interface ToonStreamEpisodeSource {
  sources: {
    url: string;
    quality: string;
  }[];
  servers?: {
    name: string;
    id: string;
  }[];
}

export async function getToonStreamAnimeInfo({ animeId }: { animeId: string }) {
  try {
    const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URL + "/episodes/toonstream/info";

    const data: ToonStreamAnimeInfo = await axios
      .get(BACKEND_URI, {
        params: { id: animeId },
      })
      .then((res) => res.data.results);

    return data;
  } catch (error) {
    console.error("Error fetching ToonStream anime info:", error);
    return null;
  }
}

export async function getToonStreamEpisodeUrl({ episodeId }: { episodeId: string }) {
  try {
    const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URL + "/episodes/toonstream/episode";

    const data: ToonStreamEpisodeSource = await axios
      .get(BACKEND_URI, {
        params: { id: episodeId },
      })
      .then((res) => res.data.results);

    if (!data || !data.sources || data.sources.length === 0) {
      throw new Error("No sources found for this episode");
    }

    return data;
  } catch (error) {
    console.error("Error fetching ToonStream episode:", error);
    return null;
  }
}

export async function getToonStreamEpisodeServer({
  episodeId,
  serverId,
}: {
  episodeId: string;
  serverId: string;
}) {
  try {
    const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URL + "/episodes/toonstream/server";

    const data = await axios
      .get(BACKEND_URI, {
        params: {
          id: episodeId,
          server: serverId,
        },
      })
      .then((res) => res.data.results);

    return data;
  } catch (error) {
    console.error("Error fetching ToonStream server:", error);
    return null;
  }
}

export async function searchToonStream({ query }: { query: string }) {
  try {
    const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URL + "/episodes/toonstream/search";

    const data = await axios
      .get(BACKEND_URI, {
        params: { q: query },
      })
      .then((res) => res.data.results);

    return data;
  } catch (error) {
    console.error("Error searching ToonStream:", error);
    return [];
  }
}

export async function getToonStreamLatest({ type = "series" }: { type?: "series" | "movies" }) {
  try {
    const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URL + "/episodes/toonstream/latest";

    const data = await axios
      .get(BACKEND_URI, {
        params: { type },
      })
      .then((res) => res.data.results);

    return data;
  } catch (error) {
    console.error("Error fetching ToonStream latest:", error);
    return [];
  }
}

export async function getToonStreamHome() {
  try {
    const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URL + "/episodes/toonstream/home";

    const data = await axios.get(BACKEND_URI).then((res) => res.data.results);

    return data;
  } catch (error) {
    console.error("Error fetching ToonStream home:", error);
    return null;
  }
}
