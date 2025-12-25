const expressAsyncHandler = require("express-async-handler");
const setRedisKey = require("../../redisUtils").setRedisKey;

// HiAnime API (ryanwtf88 version) - supports Hindi dubbed
// API Docs: https://github.com/ryanwtf88/hianime-api

exports.getEpisodesByMediaId = () => expressAsyncHandler(async (req, res) => {
    const mediaId = req.query.id;
    const redisClient = req.redisClient;

    if (!mediaId) {
        return res.status(400).json({ error: "Media ID is required" });
    }

    const HIANIME_EPISODES_URI = `${process.env.HIANIME_API_URL}/api/v1/anime/${mediaId}/episodes`;

    try {
        const key = "episodes:anime:hianime:" + mediaId.toLowerCase();
        const value = await redisClient.get(key);

        if (value) {
            console.log("Cache HIT for key:", key);
            return res.status(202).json({
                message: `Episodes for: ${mediaId.toUpperCase()}`,
                results: JSON.parse(value)
            });
        }

        console.log("Cache MISS for key:", key);

        const response = await fetch(HIANIME_EPISODES_URI);
        const data = await response.json();

        if (!data.success) {
            return res.status(404).json({ message: "No results found", results: [] });
        }

        const results = data.data?.episodes || [];

        if (results.length === 0) {
            return res.status(404).json({ message: "No episodes found", results: [] });
        }

        await setRedisKey({ redisClient, key, data: results });

        return res.status(200).json({
            message: `Results for: ${mediaId.toUpperCase()}`,
            results: results
        });

    } catch (err) {
        console.error("Error in /episodes/hianime/all route:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

exports.getEpisodeUrl = () => expressAsyncHandler(async (req, res) => {
    const episodeId = req.query.id;
    const category = req.query.category || "sub"; // sub, dub, or raw
    const server = req.query.server || "hd-1";
    const redisClient = req.redisClient;

    if (!episodeId) {
        return res.status(400).json({ error: "Episode ID is required" });
    }

    // Build query params
    const params = new URLSearchParams({
        animeEpisodeId: episodeId,
        server: server,
        category: category
    });

    const HIANIME_EPISODE_URI = `${process.env.HIANIME_API_URL}/api/v1/episode/sources?${params}`;

    try {
        const key = `episode:anime:hianime:${episodeId}:${category}:${server}`.toLowerCase();
        const value = await redisClient.get(key);

        if (value) {
            console.log("Cache HIT for key:", key);
            return res.status(202).json({
                message: `Episode for: ${episodeId.toUpperCase()}`,
                results: JSON.parse(value)
            });
        }

        console.log("Cache MISS for key:", key);

        const response = await fetch(HIANIME_EPISODE_URI);
        const data = await response.json();

        if (!data.success) {
            return res.status(404).json({ message: "No sources found", results: null });
        }

        const results = data.data || null;

        if (!results || !results.sources || results.sources.length === 0) {
            return res.status(404).json({ message: "No sources found", results: null });
        }

        await setRedisKey({ redisClient, key, data: results });

        return res.status(200).json({
            message: `Results for: ${episodeId.toUpperCase()}`,
            results: results
        });

    } catch (err) {
        console.error("Error in /episodes/hianime/episode route:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get available servers for an episode
exports.getEpisodeServers = () => expressAsyncHandler(async (req, res) => {
    const episodeId = req.query.id;
    const redisClient = req.redisClient;

    if (!episodeId) {
        return res.status(400).json({ error: "Episode ID is required" });
    }

    const HIANIME_SERVERS_URI = `${process.env.HIANIME_API_URL}/api/v1/episode/servers?animeEpisodeId=${episodeId}`;

    try {
        const key = "servers:anime:hianime:" + episodeId.toLowerCase();
        const value = await redisClient.get(key);

        if (value) {
            console.log("Cache HIT for key:", key);
            return res.status(202).json({
                message: `Servers for: ${episodeId.toUpperCase()}`,
                results: JSON.parse(value)
            });
        }

        console.log("Cache MISS for key:", key);

        const response = await fetch(HIANIME_SERVERS_URI);
        const data = await response.json();

        if (!data.success) {
            return res.status(404).json({ message: "No servers found", results: null });
        }

        const results = data.data || null;

        await setRedisKey({ redisClient, key, data: results });

        return res.status(200).json({
            message: `Servers for: ${episodeId.toUpperCase()}`,
            results: results
        });

    } catch (err) {
        console.error("Error in /episodes/hianime/servers route:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Search anime on HiAnime
exports.searchAnime = () => expressAsyncHandler(async (req, res) => {
    const query = req.query.q;
    const redisClient = req.redisClient;

    if (!query) {
        return res.status(400).json({ error: "Search query is required" });
    }

    const HIANIME_SEARCH_URI = `${process.env.HIANIME_API_URL}/api/v1/search?q=${encodeURIComponent(query)}`;

    try {
        const key = "search:anime:hianime:" + query.toLowerCase().replace(/\s+/g, "-");
        const value = await redisClient.get(key);

        if (value) {
            console.log("Cache HIT for key:", key);
            return res.status(202).json({
                message: `Search results for: ${query}`,
                results: JSON.parse(value)
            });
        }

        console.log("Cache MISS for key:", key);

        const response = await fetch(HIANIME_SEARCH_URI);
        const data = await response.json();

        if (!data.success) {
            return res.status(404).json({ message: "No results found", results: [] });
        }

        const results = data.data?.animes || [];

        await setRedisKey({ redisClient, key, data: results });

        return res.status(200).json({
            message: `Search results for: ${query}`,
            results: results
        });

    } catch (err) {
        console.error("Error in /search/hianime route:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
