"use client";
import styles from "./component.module.css";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { MediaDataFullInfo } from "@/app/ts/interfaces/anilistMediaData";
import React, { useEffect, useState } from "react";
import { MediaPlayer, MediaProvider, Track } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import { CaptionsFileFormat, CaptionsParserFactory } from "media-captions";
import { AnimatePresence, motion } from "framer-motion";
import {
  EpisodeLinksGoGoAnime,
  GogoanimeMediaEpisodes,
} from "@/app/ts/interfaces/gogoanimeData";
import {
  EpisodeAnimeWatch,
  EpisodeLinksAnimeWatch,
} from "@/app/ts/interfaces/aniwatchData";
import { useRouter, useSearchParams } from "next/navigation";
import { SourceType } from "@/app/ts/interfaces/episodesSource";
import SkipSvg from "@/public/assets/chevron-double-right.svg";
import PlaySvg from "@/public/assets/play.svg";
import { useAppSelector } from "@/app/lib/redux/hooks";
import { KeepWatchingMediaData } from "@/app/ts/interfaces/firestoreData";
import anilistUsers from "@/app/api/anilist/anilistUsers";
import { getAniwatchEpisodeByEpisodeId } from "@/app/api/episodes/aniwatch/episodesInfo";
import { consumetEpisodeByEpisodeId } from "@/app/api/episodes/consumet/episodesInfo";
import { getHiAnimeEpisodeByEpisodeId, HiAnimeEpisode } from "@/app/api/episodes/hianime/episodesInfo";
import { getToonStreamEpisodeUrl, ToonStreamEpisode } from "@/app/api/episodes/toonstream/episodesInfo";
// Appwrite imports
import { useAuthState } from "@/app/lib/appwrite/useAuth";
import {
  getUserDocument,
  updateUserDocument,
  updateKeepWatching,
  updateEpisodesWatched,
} from "@/app/lib/appwrite/database";

type VideoPlayerType = {
  mediaSource: Omit<SourceType["source"], "crunchyroll">;
  mediaInfo: MediaDataFullInfo;
  mediaEpisodes?: GogoanimeMediaEpisodes[] | EpisodeAnimeWatch[];
  videoInfo: {
    urlSource: string;
    currentLastStop?: string;
    subtitleLang: string;
    subtitlesList?: EpisodeLinksAnimeWatch["tracks"] | undefined;
    videoQualities?: {
      url: string;
      quality: "360p" | "480p" | "720p" | "1080p" | "default" | "backup";
      isM3U8: boolean;
    }[];
  };
  episodeInfo: {
    episodeNumber: string;
    episodeId: string;
    episodeIntro?: { start: number; end: number };
    episodeOutro?: { start: number; end: number };
    episodeImg: string;
  };
};

type SubtitlesType = {
  src: string | undefined;
  kind: string | TextTrackKind;
  label: string | undefined;
  srcLang: string | undefined;
  type: string | CaptionsParserFactory | undefined;
  default: boolean | undefined;
};

export default function VideoPlayer({
  mediaSource,
  videoInfo,
  mediaInfo,
  mediaEpisodes,
  episodeInfo,
}: VideoPlayerType) {
  const [subtitles, setSubtitles] = useState<SubtitlesType[] | undefined>(
    undefined
  );

  const [nextEpisodeInfo, setNextEpisodeInfo] = useState<
    { id: string; src: string } | undefined
  >(undefined);
  const [wasWatched, setWasWatched] = useState<boolean>(false);
  const [showActionButtons, setShowActionButtons] = useState<boolean>(false);
  const [episodeLastStop, setEpisodeLastStop] = useState<number>();
  const [timeskipLimit, setTimeskipLimit] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>(videoInfo.urlSource);
  const [enableAutoSkipIntroAndOutro, setEnableAutoSkipIntroAndOutro] = useState<boolean>(false);
  const [enableAutoNextEpisode, setEnableAutoNextEpisode] = useState<boolean>(false);

  const anilistUser = useAppSelector((state) => state.UserInfo.value);

  // Use Appwrite auth hook instead of Firebase
  const [user, loading] = useAuthState();

  const router = useRouter();
  const searchParams = useSearchParams();

  // Get user ID (from Appwrite or Anilist)
  const getUserId = () => user?.$id || (anilistUser ? `${anilistUser.id}` : null);

  useEffect(() => {
    setVideoUrl(videoInfo.urlSource);
    setEpisodeLastStop(Number(videoInfo.currentLastStop) || 0);
  }, [videoInfo.urlSource]);

  useEffect(() => {
    if (!loading) getUserPreferences();
  }, [user, anilistUser, loading, episodeInfo.episodeId]);

  useEffect(() => {
    fetchNextEpisodeInfo();
  }, [videoUrl, episodeInfo.episodeNumber]);

  async function getUserPreferences() {
    const userId = getUserId();
    
    getUserPreferredLanguage();

    if (!userId) {
      setWasWatched(false);
      setEpisodeLastStop(0);
      setEnableAutoSkipIntroAndOutro(false);
      setEnableAutoNextEpisode(true);
      return;
    }

    const userDoc = await getUserDocument(userId);
    
    if (!userDoc) {
      setWasWatched(false);
      setEpisodeLastStop(0);
      setEnableAutoSkipIntroAndOutro(false);
      setEnableAutoNextEpisode(true);
      return;
    }

    // Check if episode was watched
    const episodesWatched = JSON.parse(userDoc.episodesWatched || "{}");
    const episodeAddedOnWatchedList = episodesWatched[mediaInfo.id]?.find(
      (item: { episodeNumber: number }) =>
        Number(item.episodeNumber) == Number(episodeInfo.episodeNumber)
    );
    setWasWatched(!!episodeAddedOnWatchedList);

    // Get auto skip settings
    setEnableAutoSkipIntroAndOutro(userDoc.autoSkipIntroAndOutro || false);
    setEnableAutoNextEpisode(userDoc.autoNextEpisode ?? true);

    // Get last stop position
    if (!videoInfo.currentLastStop) {
      const keepWatching = JSON.parse(userDoc.keepWatching || "{}");
      const mediaKeepWatching = keepWatching[mediaInfo.id] as KeepWatchingMediaData;
      if (mediaKeepWatching) {
        setEpisodeLastStop(mediaKeepWatching.episodeTimeLastStop || 0);
      }
    }
  }

  async function getUserPreferredLanguage() {
    const subtitleLanguage = videoInfo.subtitleLang;
    const subtitleListMapped: SubtitlesType[] = [];

    videoInfo.subtitlesList?.map((subtitle) => {
      const isDefault = subtitle.label?.toLowerCase().includes(subtitleLanguage.toLowerCase());

      subtitleListMapped.push({
        kind: subtitle.kind,
        srcLang: subtitle.label,
        src: subtitle.file,
        default: isDefault,
        label: subtitle.label,
        type: subtitle.kind,
      });
    });

    setSubtitles(subtitleListMapped);
  }

  async function markCurrEpisodeAsWatched() {
    const userId = getUserId();
    if (!userId) return;

    const episodeData = {
      mediaId: mediaInfo.id,
      episodeNumber: Number(episodeInfo.episodeNumber),
      episodeTitle: `Episode ${episodeInfo.episodeNumber}`,
    };

    await updateEpisodesWatched(userId, mediaInfo.id, episodeData);

    if (anilistUser) {
      await anilistUsers.addMediaToSelectedList({
        mediaId: mediaInfo.id,
        status: mediaInfo.episodes == Number(episodeInfo.episodeNumber) ? "COMPLETED" : "CURRENT",
        episodeOrChapterNumber: Number(episodeInfo.episodeNumber),
      });
    }

    setWasWatched(true);
  }

  async function handleEpisodeTimeTrackingOnKeepWatching(
    currentEpisodeTime: number,
    videoDuration: number
  ) {
    const userId = getUserId();
    if (!userId) return;

    let saveNextEpisodeInfo = false;
    if (Math.round((currentEpisodeTime / videoDuration) * 100) > 95) {
      if (nextEpisodeInfo) saveNextEpisodeInfo = true;
    }

    const episodeData = {
      id: mediaInfo.id,
      title: { romaji: mediaInfo.title.romaji },
      format: mediaInfo.format,
      coverImage: {
        extraLarge: mediaInfo.coverImage.extraLarge,
        large: mediaInfo.coverImage.large,
      },
      episode: saveNextEpisodeInfo ? Number(episodeInfo.episodeNumber) + 1 : episodeInfo.episodeNumber,
      episodeId: saveNextEpisodeInfo ? nextEpisodeInfo!.id : episodeInfo.episodeId,
      episodeImg: episodeInfo.episodeImg || null,
      episodeTimeLastStop: saveNextEpisodeInfo ? 0 : currentEpisodeTime,
      episodeDuration: videoDuration,
      dub: searchParams?.get("dub") == "true",
      source: mediaSource,
      updatedAt: Date.parse(`${new Date()}`) / 1000,
    };

    await updateKeepWatching(userId, mediaInfo.id, episodeData);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleSkipEpisodeIntrosAndOutros(e: any) {
    const currentTime = Math.round(e.currentTime);
    const duration = Math.round(e.duration);
    const isUserLoggedIn = user || anilistUser;

    if (episodeInfo.episodeIntro || episodeInfo.episodeOutro) {
      if (
        episodeInfo.episodeIntro &&
        currentTime >= episodeInfo.episodeIntro.start &&
        currentTime < episodeInfo.episodeIntro.end
      ) {
        if (timeskipLimit == null) setTimeskipLimit(episodeInfo.episodeIntro.end);
        if (isUserLoggedIn && enableAutoSkipIntroAndOutro && timeskipLimit != null && currentTime >= episodeInfo.episodeIntro.start + 4) {
          skipEpisodeIntroOrOutro();
        }
      } else if (
        episodeInfo.episodeOutro &&
        currentTime >= episodeInfo.episodeOutro.start &&
        currentTime < episodeInfo.episodeOutro.end
      ) {
        if (timeskipLimit == null) setTimeskipLimit(episodeInfo.episodeOutro.end);
        if (isUserLoggedIn && enableAutoSkipIntroAndOutro && timeskipLimit != null && currentTime >= episodeInfo.episodeOutro.start + 4) {
          skipEpisodeIntroOrOutro();
        }
      } else {
        setTimeskipLimit(null);
      }
    }

    if (isUserLoggedIn && currentTime % 45 === 0) {
      handleEpisodeTimeTrackingOnKeepWatching(currentTime, duration);
    }

    if (nextEpisodeInfo && Math.round((currentTime / duration) * 100) > 95) {
      setShowActionButtons(true);
      if (!wasWatched) markCurrEpisodeAsWatched();
    } else {
      if (showActionButtons) setShowActionButtons(false);
    }
  }

  async function fetchNextEpisodeInfo() {
    if (!mediaEpisodes) return;

    const nextEpisode = mediaEpisodes.find(
      (item: { number: number }) => item.number == Number(episodeInfo.episodeNumber) + 1
    );

    if (!nextEpisode) return;

    let nextEpisodeId: string = "";

    switch (mediaSource) {
      case "gogoanime":
        nextEpisodeId = (nextEpisode as GogoanimeMediaEpisodes).id;
        const gogoEpisode = await consumetEpisodeByEpisodeId({ episodeId: nextEpisodeId }) as EpisodeLinksGoGoAnime;
        const gogoUrl = gogoEpisode?.sources?.find((item) => item.quality == "default")?.url || gogoEpisode?.sources?.[0]?.url;
        if (gogoUrl) setNextEpisodeInfo({ id: nextEpisodeId, src: gogoUrl });
        break;

      case "aniwatch":
        nextEpisodeId = (nextEpisode as EpisodeAnimeWatch).episodeId;
        const aniwatchEp = await getAniwatchEpisodeByEpisodeId({
          episodeId: nextEpisodeId,
          category: searchParams?.get("dub") == "true" ? "dub" : "sub",
        }) as EpisodeLinksAnimeWatch;
        if (aniwatchEp?.sources?.[0]?.url) setNextEpisodeInfo({ id: nextEpisodeId, src: aniwatchEp.sources[0].url });
        break;

      case "hianime":
      case "hianime-hindi":
        nextEpisodeId = (nextEpisode as unknown as HiAnimeEpisode).episodeId;
        const hiAnimeEp = await getHiAnimeEpisodeByEpisodeId({
          episodeId: nextEpisodeId,
          category: mediaSource === "hianime-hindi" || searchParams?.get("dub") == "true" ? "dub" : "sub",
        });
        if (hiAnimeEp?.sources?.[0]?.url) setNextEpisodeInfo({ id: nextEpisodeId, src: hiAnimeEp.sources[0].url });
        break;

      case "toonstream":
        nextEpisodeId = (nextEpisode as unknown as ToonStreamEpisode).id;
        const toonEp = await getToonStreamEpisodeUrl({ episodeId: nextEpisodeId });
        if (toonEp?.sources?.[0]?.url) setNextEpisodeInfo({ id: nextEpisodeId, src: toonEp.sources[0].url });
        break;
    }
  }

  function skipEpisodeIntroOrOutro() {
    setEpisodeLastStop(timeskipLimit as number);
    setTimeskipLimit(null);
  }

  function handlePlayNextEpisode() {
    if (!nextEpisodeInfo) return;
    router.push(
      `/watch/${mediaInfo.id}?source=${mediaSource}&episode=${Number(episodeInfo.episodeNumber) + 1}&q=${nextEpisodeInfo.id}${searchParams?.get("dub") == "true" ? "&dub=true" : ""}`
    );
    setVideoUrl(nextEpisodeInfo.src);
  }

  return (
    !loading && subtitles && (
      <MediaPlayer
        playsInline
        autoPlay
        src={videoUrl}
        className={styles.container}
        title={`Ep. ${episodeInfo.episodeNumber} - ${mediaInfo.title.userPreferred}`}
        currentTime={episodeLastStop}
        onVolumeChange={(e) => localStorage.setItem("videoPlayerVolume", `${e.volume}`)}
        volume={Number(localStorage.getItem("videoPlayerVolume")) || 0.5}
        onProgressCapture={(e) => handleSkipEpisodeIntrosAndOutros(e.target)}
        onEnded={() => enableAutoNextEpisode && handlePlayNextEpisode()}
      >
        <SkipIntroOrOutroButton
          callFunction={skipEpisodeIntroOrOutro}
          isActive={timeskipLimit != null}
          isAnimationActive={enableAutoSkipIntroAndOutro}
        />
        <NextEpisodeButton
          callFunction={handlePlayNextEpisode}
          isActive={!!(nextEpisodeInfo && showActionButtons)}
        />
        <MediaProvider>
          {subtitles?.map((subtitle) => (
            <Track
              key={subtitle.src}
              src={subtitle.src}
              kind={subtitle.kind as TextTrackKind}
              label={subtitle.label}
              lang={subtitle.srcLang}
              type={subtitle.kind as CaptionsFileFormat}
              default={subtitle.default}
            />
          ))}
        </MediaProvider>
        <DefaultVideoLayout icons={defaultLayoutIcons} thumbnails={mediaInfo.bannerImage || undefined} />
      </MediaPlayer>
    )
  );
}

function SkipIntroOrOutroButton({ isActive, isAnimationActive, callFunction }: { isActive: boolean; isAnimationActive: boolean; callFunction: () => void }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.button id={styles.skip_btn} onClick={callFunction} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 1.5 } }} exit={{ opacity: 0 }} whileTap={{ scale: 0.95 }}>
          <motion.span className={styles.moving_bar} initial={{ scaleX: 0 }} animate={isAnimationActive ? { scaleX: 1, transition: { duration: 4 } } : { scaleX: 1, backgroundColor: "transparent" }} />
          <motion.span className={styles.btn_text}>{isAnimationActive ? "Auto Skip" : "Skip"} <SkipSvg width={16} height={16} /></motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function NextEpisodeButton({ isActive, callFunction }: { isActive: boolean; callFunction: () => void }) {
  return isActive && (
    <motion.button id={styles.next_episode_btn} onClick={callFunction} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 1.5 } }} exit={{ opacity: 0 }} whileTap={{ scale: 0.95 }}>
      <PlaySvg width={16} height={16} /> Next Episode
    </motion.button>
  );
}
