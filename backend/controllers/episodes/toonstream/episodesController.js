const expressAsyncHandler = require("express-async-handler");
const setRedisKey = require("../../redisUtils").setRedisKey;

// ToonStream API - Hindi dubbed anime
// API Docs: https://github.com/ryanwtf88/toonstream-api

exports.getAnimeInfo = () => expressAsyncHandler(async (req, res) => {
    const animeId = req.query.id;
    const redisClient = req.redisClient;

    if (!animeId) {
        return res.status(400).json({ error: "Anime ID is required" });
    }

    const TOONSTREAM_INFO_URI = `${process.env.TOONSTREAM_API_URL}/api/anime/${animeId}`;

    try {
        const key = "info:anime:toonstream:" + animeId.toLowerCase();
        const value = await redisClient.get(key);

        if (value) {
            console.log("Cache HIT for key:", key);
            return res.status(202).json({
                message: `Info for: ${animeId}`,
                results: JSON.parse(value)
            });
        }

        console.log("Cache MISS for key:", key);

        const response = await fetch(TOONSTREAM_INFO_URI);
        const data = await response.json();

        if (!data.success) {
            return res.status(404).json({ message: "Anime not found", results: null });
        }

        const results = data.data || null;

        await setRedisKey({ redisClient, key, data: results });

        return res.status(200).json({
            message: `Info for: ${animeId}`,
            results: results
        });

    } catch (err) {
        console.error("Error in /toonstream/info route:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

exports.getEpisodeUrl = () => expressAsyncHandler(async (req, res) => {
    const episodeId = req.query.id;
    const redisClient = req.redisClient;

    if (!episodeId) {
        return res.status(400).json({ error: "Episode ID is required" });
    }

    const TOONSTREAM_EPISODE_URI = `${process.env.TOONSTREAM_API_URL}/api/episode/${episodeId}`;

    try {
        const key = "episode:anime:toonstream:" + episodeId.toLowerCase();
        const value = await redisClient.get(key);

        if (value) {
            console.log("Cache HIT for key:", key);
            return res.status(202).json({
                message: `Episode for: ${episodeId}`,
                results: JSON.parse(value)
            });
        }

        console.log("Cache MISS for key:", key);

        const response = await fetch(TOONSTREAM_EPISODE_URI);
        const data = await response.json();

        if (!data.success) {
            return res.status(404).json({ message: "Episode not found", results: null });
        }

        const results = data.data || null;

        await setRedisKey({ redisClient, key, data: results });

        return res.status(200).json({
            message: `Episode for: ${episodeId}`,
            results: results
        });

    } catch (err) {
        console.error("Error in /toonstream/episode route:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get streaming links for an episode with specific server
exports.getEpisodeServer = () => expressAsyncHandler(async (req, res) => {
    const episodeId = req.query.id;
    const serverId = req.query.server;
    const redisClient = req.redisClient;

    if (!episodeId || !serverId) {
        return res.status(400).json({ error: "Episode ID and Server ID are required" });
    }

    const TOONSTREAM_SERVER_URI = `${process.env.TOONSTREAM_API_URL}/api/episode/${episodeId}/server/${serverId}`;

    try {
        const key = `server:anime:toonstream:${episodeId}:${serverId}`.toLowerCase();
        const value = await redisClient.get(key);

        if (value) {
            console.log("Cache HIT for key:", key);
            return res.status(202).json({
                message: `Server for: ${episodeId}`,
                results: JSON.parse(value)
            });
        }

        console.log("Cache MISS for key:", key);

        const response = await fetch(TOONSTREAM_SERVER_URI);
        const data = await response.json();

        if (!data.success) {
            return res.status(404).json({ message: "Server not found", results: null });
        }

        const results = data.data || null;

        await setRedisKey({ redisClient, key, data: results });

        return res.status(200).json({
            message: `Server for: ${episodeId}`,
            results: results
        });

    } catch (err) {
        console.error("Error in /toonstream/server route:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Search anime on ToonStream
exports.searchAnime = () => expressAsyncHandler(async (req, res) => {
    const query = req.query.q;
    const redisClient = req.redisClient;

    if (!query) {
        return res.status(400).json({ error: "Search query is required" });
    }

    const TOONSTREAM_SEARCH_URI = `${process.env.TOONSTREAM_API_URL}/api/search?keyword=${encodeURIComponent(query)}`;

    try {
        const key = "search:anime:toonstream:" + query.toLowerCase().replace(/\s+/g, "-");
        const value = await redisClient.get(key);

        if (value) {
            console.log("Cache HIT for key:", key);
            return res.status(202).json({
                message: `Search results for: ${query}`,
                results: JSON.parse(value)
            });
        }

        console.log("Cache MISS for key:", key);

        const response = await fetch(TOONSTREAM_SEARCH_URI);
        const data = await response.json();

        if (!data.success) {
            return res.status(404).json({ message: "No results found", results: [] });
        }

        const results = data.data || [];

        await setRedisKey({ redisClient, key, data: results });

        return res.status(200).json({
            message: `Search results for: ${query}`,
            results: results
        });

    } catch (err) {
        console.error("Error in /search/toonstream route:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get latest Hindi dubbed content
exports.getLatest = () => expressAsyncHandler(async (req, res) => {
    const type = req.query.type || "series"; // series or movies
    const redisClient = req.redisClient;

    const TOONSTREAM_LATEST_URI = `${process.env.TOONSTREAM_API_URL}/api/latest/${type}`;

    try {
        const key = `latest:anime:toonstream:${type}`;
        const value = await redisClient.get(key);

        if (value) {
            console.log("Cache HIT for key:", key);
            return res.status(202).json({
                message: `Latest ${type}`,
                results: JSON.parse(value)
            });
        }

        console.log("Cache MISS for key:", key);

        const response = await fetch(TOONSTREAM_LATEST_URI);
        const data = await response.json();

        if (!data.success) {
            return res.status(404).json({ message: "No results found", results: [] });
        }

        const results = data.data || [];

        await setRedisKey({ redisClient, key, data: results });

        return res.status(200).json({
            message: `Latest ${type}`,
            results: results
        });

    } catch (err) {
        console.error("Error in /toonstream/latest route:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get home page data
exports.getHome = () => expressAsyncHandler(async (req, res) => {
    const redisClient = req.redisClient;

    const TOONSTREAM_HOME_URI = `${process.env.TOONSTREAM_API_URL}/api/home`;

    try {
        const key = "home:anime:toonstream";
        const value = await redisClient.get(key);

        if (value) {
            console.log("Cache HIT for key:", key);
            return res.status(202).json({
                message: "ToonStream Home",
                results: JSON.parse(value)
            });
        }

        console.log("Cache MISS for key:", key);

        const response = await fetch(TOONSTREAM_HOME_URI);
        const data = await response.json();

        if (!data.success) {
            return res.status(404).json({ message: "Failed to fetch home", results: null });
        }

        const results = data.data || null;

        await setRedisKey({ redisClient, key, data: results });

        return res.status(200).json({
            message: "ToonStream Home",
            results: results
        });

    } catch (err) {
        console.error("Error in /toonstream/home route:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
