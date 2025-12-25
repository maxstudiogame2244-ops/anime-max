import axios from "axios";

export interface HiAnimeEpisode {
  episodeId: string;
  number: number;
  title: string;
  isFiller: boolean;
}

export interface HiAnimeEpisodeSource {
  sources: {
    url: string;
    type: string;
  }[];
  subtitles?: {
    url: string;
    lang: string;
  }[];
  intro?: {
    start: number;
    end: number;
  };
  outro?: {
    start: number;
    end: number;
  };
}

export interface HiAnimeServer {
  sub: { serverName: string; serverId: string }[];
  dub: { serverName: string; serverId: string }[];
  raw: { serverName: string; serverId: string }[];
}

export async function getHiAnimeMediaEpisodes({ query }: { query: string }) {
  try {
    const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URL + "/episodes/hianime/all";

    const data: HiAnimeEpisode[] = await axios
      .get(BACKEND_URI, {
        params: { id: query },
      })
      .then((res) => res.data.results);

    return data;
  } catch (error) {
    console.error("Error fetching HiAnime media episodes:", error);
    return [];
  }
}

export async function getHiAnimeEpisodeByEpisodeId({
  episodeId,
  server,
  category,
}: {
  episodeId: string;
  server?: string;
  category?: "sub" | "dub" | "raw";
}) {
  try {
    const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URL + "/episodes/hianime/episode";

    const data: HiAnimeEpisodeSource = await axios
      .get(BACKEND_URI, {
        params: {
          id: episodeId,
          server: server || "hd-1",
          category: category || "sub",
        },
      })
      .then((res) => res.data.results);

    if (!data || !data.sources || data.sources.length === 0) {
      throw new Error("No sources found for this episode");
    }

    return data;
  } catch (error) {
    console.error("Error fetching HiAnime episode:", error);
    return null;
  }
}

export async function getHiAnimeEpisodeServers({ episodeId }: { episodeId: string }) {
  try {
    const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URL + "/episodes/hianime/servers";

    const data: HiAnimeServer = await axios
      .get(BACKEND_URI, {
        params: { id: episodeId },
      })
      .then((res) => res.data.results);

    return data;
  } catch (error) {
    console.error("Error fetching HiAnime servers:", error);
    return null;
  }
}

export async function searchHiAnime({ query }: { query: string }) {
  try {
    const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URL + "/episodes/hianime/search";

    const data = await axios
      .get(BACKEND_URI, {
        params: { q: query },
      })
      .then((res) => res.data.results);

    return data;
  } catch (error) {
    console.error("Error searching HiAnime:", error);
    return [];
  }
}
