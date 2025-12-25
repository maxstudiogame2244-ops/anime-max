import { SourceType } from "@/app/ts/interfaces/episodesSource";

export const sourcesAvailable: {
  name: string;
  value: SourceType["source"];
  isAvailable: boolean;
  apiOrigin: "consumet" | "aniwatch" | "anilist" | "hianime" | "toonstream";
  language?: "sub" | "dub" | "hindi";
}[] = [
  {
    name: "Crunchyroll",
    value: "crunchyroll",
    isAvailable: false, // initiates as false
    apiOrigin: "anilist",
  },
  {
    name: "GoGoAnime",
    value: "gogoanime",
    isAvailable: false,
    apiOrigin: "consumet",
  },
  {
    name: "Zoro",
    value: "zoro",
    isAvailable: false,
    apiOrigin: "consumet",
  },
  {
    name: "Aniwatch",
    value: "aniwatch",
    isAvailable: false,
    apiOrigin: "aniwatch",
  },
  {
    name: "HiAnime",
    value: "hianime",
    isAvailable: false,
    apiOrigin: "hianime",
  },
  {
    name: "HiAnime (Hindi)",
    value: "hianime-hindi",
    isAvailable: false,
    apiOrigin: "hianime",
    language: "hindi",
  },
  {
    name: "ToonStream (Hindi)",
    value: "toonstream",
    isAvailable: false,
    apiOrigin: "toonstream",
    language: "hindi",
  },
];
