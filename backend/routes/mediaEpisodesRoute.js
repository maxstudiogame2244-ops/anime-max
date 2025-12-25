const express = require("express")
const aniwatchEpisodesController = require("../controllers/episodes/aniwatch/episodesController");
const consumetZoroEpisodesController = require("../controllers/episodes/consumet/zoro/episodesController");
const consumetGogoanimeEpisodesController = require("../controllers/episodes/consumet/gogoanime/episodesController");
const hianimeEpisodesController = require("../controllers/episodes/hianime/episodesController");
const toonstreamEpisodesController = require("../controllers/episodes/toonstream/episodesController");

const mediaEpisodesRoute = express.Router();

// Aniwatch routes (legacy)
mediaEpisodesRoute.get("/aniwatch/episode", aniwatchEpisodesController.getEpisodeUrl())
mediaEpisodesRoute.get("/aniwatch/all", aniwatchEpisodesController.getEpisodesByMediaId())

// Consumet routes
mediaEpisodesRoute.get("/consumet/gogoanime/episode", consumetGogoanimeEpisodesController.getEpisodeUrl())
mediaEpisodesRoute.get("/consumet/gogoanime/all", consumetGogoanimeEpisodesController.getEpisodesByMediaId())
mediaEpisodesRoute.get("/consumet/zoro/episode", consumetZoroEpisodesController.getEpisodeUrl())
mediaEpisodesRoute.get("/consumet/zoro/all", consumetZoroEpisodesController.getEpisodesByMediaId())

// HiAnime routes (ryanwtf88 API - supports Hindi dub)
mediaEpisodesRoute.get("/hianime/episode", hianimeEpisodesController.getEpisodeUrl())
mediaEpisodesRoute.get("/hianime/all", hianimeEpisodesController.getEpisodesByMediaId())
mediaEpisodesRoute.get("/hianime/servers", hianimeEpisodesController.getEpisodeServers())
mediaEpisodesRoute.get("/hianime/search", hianimeEpisodesController.searchAnime())

// ToonStream routes (Hindi dubbed anime)
mediaEpisodesRoute.get("/toonstream/episode", toonstreamEpisodesController.getEpisodeUrl())
mediaEpisodesRoute.get("/toonstream/server", toonstreamEpisodesController.getEpisodeServer())
mediaEpisodesRoute.get("/toonstream/info", toonstreamEpisodesController.getAnimeInfo())
mediaEpisodesRoute.get("/toonstream/search", toonstreamEpisodesController.searchAnime())
mediaEpisodesRoute.get("/toonstream/latest", toonstreamEpisodesController.getLatest())
mediaEpisodesRoute.get("/toonstream/home", toonstreamEpisodesController.getHome())

module.exports = mediaEpisodesRoute     