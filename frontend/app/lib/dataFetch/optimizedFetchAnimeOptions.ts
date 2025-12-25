import { AniwatchMediaData } from "../../ts/interfaces/aniwatchData";
import simulateRange from "../simulateRange";
import { GogoanimeMediaEpisodes } from "../../ts/interfaces/gogoanimeData";
import stringToOnlyAlphabetic from "../convertStrings";
import { checkAnilistTitleMisspelling } from "../checkApiMediaMisspelling";
import { aniwatchSearchMedia } from "@/app/api/search/aniwatch/search";
import { getAniwatchMediaEpisodes } from "@/app/api/episodes/aniwatch/episodesInfo";
import { consumetSearchMedia } from "@/app/api/search/consumet/search";
import { consumetMediaInfo } from "@/app/api/mediaInfo/consumet/mediaInfo";
import { hianimeSearchMedia, HiAnimeSearchResult } from "@/app/api/search/hianime/search";
import { getHiAnimeMediaEpisodes } from "@/app/api/episodes/hianime/episodesInfo";
import { toonstreamSearchMedia, ToonStreamSearchResult } from "@/app/api/search/toonstream/search";
import { getToonStreamAnimeInfo } from "@/app/api/episodes/toonstream/episodesInfo";

// Always tries to give at least one result that resembles the query
export async function optimizedFetchOnGoGoAnime({
  textToSearch,
  only,
  isDubbed,
}: {
  textToSearch: string;
  only?: "episodes";
  isDubbed?: boolean;
}) {
  const titleFixed = stringToOnlyAlphabetic(
    checkAnilistTitleMisspelling(textToSearch)
  ).toLowerCase();

  let mediaInfo = await consumetMediaInfo({
    query: titleFixed,
    provider: "gogoanime",
  });

  if (mediaInfo && !only) return mediaInfo;

  const resultsForMediaSearch = await consumetSearchMedia({
    query: titleFixed,
    provider: "gogoanime",
  });

  if (resultsForMediaSearch.length == 0) return null;

  let closestResultsByMediaTitle;

  if (isDubbed) {
    closestResultsByMediaTitle = resultsForMediaSearch.filter(
      (media) => media.subOrDub == "dub"
    );
  } else {
    closestResultsByMediaTitle = resultsForMediaSearch.filter(
      (media) =>
        stringToOnlyAlphabetic(media.title)
          .toLowerCase()
          .indexOf(titleFixed) !== -1
    );
  }

  mediaInfo =
    (await consumetMediaInfo({
      query: closestResultsByMediaTitle[0]?.id || resultsForMediaSearch![0]?.id,
      provider: "gogoanime",
    })) || null;

  if (!mediaInfo) return null;

  if (only == "episodes") {
    const episodesList: GogoanimeMediaEpisodes[] = [];

    simulateRange(mediaInfo.totalEpisodes).map((item, key) => {
      episodesList.push({
        number: key + 1,
        id: `${mediaInfo!.id.toLowerCase()}-episode-${key + 1}`,
        url: "",
      });
    });

    return mediaInfo.episodes.length == 0 ? episodesList : mediaInfo.episodes;
  }

  return mediaInfo;
}

export async function optimizedFetchOnZoro({
  textToSearch,
  only,
  isDubbed,
}: {
  textToSearch: string;
  only?: "episodes";
  isDubbed?: boolean;
}) {
  const titleFixed = stringToOnlyAlphabetic(
    checkAnilistTitleMisspelling(textToSearch)
  ).toLowerCase();

  let mediaInfo = await consumetMediaInfo({
    query: titleFixed,
    provider: "zoro",
  });

  if (mediaInfo && !only) return mediaInfo;

  const resultsForMediaSearch = await consumetSearchMedia({
    query: titleFixed,
    provider: "zoro",
  });

  if (resultsForMediaSearch.length == 0) return null;
  
  let closestResultsByMediaTitle;

  if (isDubbed) {
    closestResultsByMediaTitle = resultsForMediaSearch.filter(
      (media) => media.subOrDub == "dub"
    );
  } else {
    closestResultsByMediaTitle = resultsForMediaSearch.filter(
      (media) =>
        stringToOnlyAlphabetic(media.title)
          .toLowerCase()
          .indexOf(titleFixed) !== -1
    );
  }

  mediaInfo =
    (await consumetMediaInfo({
      query: closestResultsByMediaTitle[0]?.id || resultsForMediaSearch![0]?.id,
      provider: "zoro",
    })) || null;

  if (!mediaInfo) return null;

  if (only == "episodes") {
    return mediaInfo.episodes;
  }

  return mediaInfo;
}
// Always tries to give at least one result that resembles the query
export async function optimizedFetchOnAniwatch({
  textToSearch,
  only,
  format,
  mediaTotalEpisodes,
  idToMatch,
}: {
  textToSearch: string;
  only?: "episodes" | "search_list";
  format?: string;
  mediaTotalEpisodes?: number;
  idToMatch?: string;
}) {
  const titleFixed = stringToOnlyAlphabetic(
    checkAnilistTitleMisspelling(textToSearch)
  ).toLowerCase();

  let resultsForMediaSearch = await aniwatchSearchMedia({ query: titleFixed });

  if (format) {
    const filterFormat = resultsForMediaSearch.filter(
      (media) => media.type.toLowerCase() == format.toLowerCase()
    );

    if (filterFormat.length > 0) resultsForMediaSearch = filterFormat;
  }

  let mediasWithSameTitle: AniwatchMediaData[] | undefined =
    resultsForMediaSearch.filter(
      (media) => stringToOnlyAlphabetic(media.name).toLowerCase() == titleFixed
    );

  if (only == "search_list" && mediasWithSameTitle.length != 0)
    return mediasWithSameTitle;

  mediasWithSameTitle =
    mediasWithSameTitle.length == 0
      ? resultsForMediaSearch
      : mediasWithSameTitle;

  if (mediaTotalEpisodes) {
    const mediaWithSameEpisodesAmount = mediasWithSameTitle.filter(
      (media) => media.episodes.sub == mediaTotalEpisodes
    );

    if (mediaWithSameEpisodesAmount.length != 0)
      mediasWithSameTitle = mediaWithSameEpisodesAmount;
  }

  if (only == "search_list")
    return mediasWithSameTitle.length > 0
      ? mediasWithSameTitle
      : resultsForMediaSearch;

  if (mediasWithSameTitle.length == 0) {
    mediasWithSameTitle = resultsForMediaSearch.filter(
      (media) =>
        stringToOnlyAlphabetic(media.name).toLowerCase().includes(titleFixed) ||
        resultsForMediaSearch[0]
    );
  }

  if (only == "episodes") {
    if (mediasWithSameTitle.length == 0) return null;

    let mediaFoundByID = null;

    // if ANIWATCH MEDIA ID is provided
    if (idToMatch)
      mediaFoundByID = mediasWithSameTitle.find(
        (media) => media.id == idToMatch
      );

    const mediaEpisodesList = await getAniwatchMediaEpisodes({
      query: mediaFoundByID?.id || mediasWithSameTitle[0].id,
    });

    return mediaEpisodesList?.length == 0
      ? null
      : {
          episodesDub:
            mediaFoundByID?.episodes?.dub ||
            mediasWithSameTitle[0]?.episodes?.dub ||
            0,
          episodesSub:
            mediaFoundByID?.episodes?.sub ||
            mediasWithSameTitle[0]?.episodes?.sub ||
            0,
          episodes: mediaEpisodesList,
        };
  }

  return mediasWithSameTitle;
}

// HiAnime API - supports Hindi dubbed content
export async function optimizedFetchOnHiAnime({
  textToSearch,
  only,
  format,
  idToMatch,
  isHindi,
}: {
  textToSearch: string;
  only?: "episodes" | "search_list";
  format?: string;
  idToMatch?: string;
  isHindi?: boolean;
}) {
  const titleFixed = stringToOnlyAlphabetic(
    checkAnilistTitleMisspelling(textToSearch)
  ).toLowerCase();

  let resultsForMediaSearch = await hianimeSearchMedia({ query: titleFixed });

  if (resultsForMediaSearch.length === 0) return null;

  // Filter by format if provided (TV, Movie, OVA, etc.)
  if (format) {
    const filterFormat = resultsForMediaSearch.filter(
      (media) => media.type?.toLowerCase() === format.toLowerCase()
    );
    if (filterFormat.length > 0) resultsForMediaSearch = filterFormat;
  }

  // Filter for Hindi dubbed if requested
  if (isHindi) {
    const hindiDubbed = resultsForMediaSearch.filter(
      (media) => media.episodes?.dub && media.episodes.dub > 0
    );
    if (hindiDubbed.length > 0) resultsForMediaSearch = hindiDubbed;
  }

  let mediasWithSameTitle: HiAnimeSearchResult[] = resultsForMediaSearch.filter(
    (media) => stringToOnlyAlphabetic(media.name).toLowerCase() === titleFixed
  );

  if (only === "search_list" && mediasWithSameTitle.length !== 0)
    return mediasWithSameTitle;

  mediasWithSameTitle =
    mediasWithSameTitle.length === 0
      ? resultsForMediaSearch
      : mediasWithSameTitle;

  if (only === "search_list")
    return mediasWithSameTitle.length > 0
      ? mediasWithSameTitle
      : resultsForMediaSearch;

  if (mediasWithSameTitle.length === 0) {
    mediasWithSameTitle = resultsForMediaSearch.filter(
      (media) =>
        stringToOnlyAlphabetic(media.name).toLowerCase().includes(titleFixed) ||
        resultsForMediaSearch[0]
    );
  }

  if (only === "episodes") {
    if (mediasWithSameTitle.length === 0) return null;

    let mediaFoundByID = null;

    if (idToMatch)
      mediaFoundByID = mediasWithSameTitle.find(
        (media) => media.id === idToMatch
      );

    const mediaEpisodesList = await getHiAnimeMediaEpisodes({
      query: mediaFoundByID?.id || mediasWithSameTitle[0].id,
    });

    return mediaEpisodesList?.length === 0
      ? null
      : {
          episodesDub:
            mediaFoundByID?.episodes?.dub ||
            mediasWithSameTitle[0]?.episodes?.dub ||
            0,
          episodesSub:
            mediaFoundByID?.episodes?.sub ||
            mediasWithSameTitle[0]?.episodes?.sub ||
            0,
          episodes: mediaEpisodesList,
        };
  }

  return mediasWithSameTitle;
}

// ToonStream API - Hindi dubbed anime
export async function optimizedFetchOnToonStream({
  textToSearch,
  only,
}: {
  textToSearch: string;
  only?: "episodes" | "search_list";
}) {
  const titleFixed = stringToOnlyAlphabetic(
    checkAnilistTitleMisspelling(textToSearch)
  ).toLowerCase();

  const resultsForMediaSearch = await toonstreamSearchMedia({ query: titleFixed });

  if (resultsForMediaSearch.length === 0) return null;

  let mediasWithSameTitle: ToonStreamSearchResult[] = resultsForMediaSearch.filter(
    (media) => stringToOnlyAlphabetic(media.title).toLowerCase() === titleFixed
  );

  if (only === "search_list" && mediasWithSameTitle.length !== 0)
    return mediasWithSameTitle;

  mediasWithSameTitle =
    mediasWithSameTitle.length === 0
      ? resultsForMediaSearch
      : mediasWithSameTitle;

  if (only === "search_list")
    return mediasWithSameTitle.length > 0
      ? mediasWithSameTitle
      : resultsForMediaSearch;

  if (mediasWithSameTitle.length === 0) {
    mediasWithSameTitle = resultsForMediaSearch.filter(
      (media) =>
        stringToOnlyAlphabetic(media.title).toLowerCase().includes(titleFixed) ||
        resultsForMediaSearch[0]
    );
  }

  if (only === "episodes") {
    if (mediasWithSameTitle.length === 0) return null;

    const animeInfo = await getToonStreamAnimeInfo({
      animeId: mediasWithSameTitle[0].id,
    });

    if (!animeInfo || !animeInfo.episodes) return null;

    return {
      episodes: animeInfo.episodes,
      animeInfo: animeInfo,
    };
  }

  return mediasWithSameTitle;
}
