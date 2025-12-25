const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const redis = require("redis");
const searchRoute = require('./routes/searchRoute');
const mediaInfoRoute = require('./routes/mediaInfoRoute');
const mediasByParamsRoute = require('./routes/mediasByParamsRoute');
const newsRoute = require('./routes/newsRoute');
const mediaEpisodesRoute = require('./routes/mediaEpisodesRoute');
const imdbRoute = require('./routes/imdbRoute');
const mediaChaptersRoute = require('./routes/mediaChaptersRoute');

dotenv.config();

// Redis client configuration
// Supports both Upstash (TLS) and local Redis
const getRedisConfig = () => {
    // For local development without Redis
    if (process.env.DEV_MODE === 'true' && !process.env.REDIS_HOST && !process.env.UPSTASH_REDIS_REST_URL) {
        console.log("#### -> Running without Redis (dev mode)");
        return null;
    }

    // Upstash Redis (recommended for production/serverless)
    if (process.env.REDIS_HOST?.includes('upstash.io')) {
        return {
            username: process.env.REDIS_USERNAME || 'default',
            password: process.env.REDIS_PASSWORD,
            socket: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT) || 6379,
                tls: true, // Upstash requires TLS
            }
        };
    }

    // Local Redis (for development)
    if (process.env.DEV_MODE === 'true') {
        return {};
    }

    // Standard Redis configuration
    return {
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        socket: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT) || 6379
        }
    };
};

// Create a mock Redis client for development without Redis
const createMockRedisClient = () => ({
    get: async () => null,
    set: async () => 'OK',
    setEx: async () => 'OK',
    connect: async () => {},
    ping: async () => 'PONG',
    on: () => {},
    isReady: true,
});

const redisConfig = getRedisConfig();
const redisClient = redisConfig ? redis.createClient(redisConfig) : createMockRedisClient();

(async () => {
    if (!redisConfig) {
        console.log("#### -> Using mock Redis client (no caching)");
        return;
    }

    console.log("#### -> Connecting to Redis...");

    redisClient.on("error", (err) => {
        console.error("#### -> Redis Client Error! ", err);
    })

    redisClient.on("ready", () => {
        console.log("#### -> Redis Client is ready!");
    })

    await redisClient.connect();
    await redisClient.ping();
})()

const app = express();

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    req.redisClient = redisClient;
    next();
});

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Anime Max API Server!' });
});

app.use("/search", searchRoute)
app.use("/media-info", mediaInfoRoute)
app.use("/medias", mediasByParamsRoute)
app.use("/episodes", mediaEpisodesRoute)
app.use("/chapters", mediaChaptersRoute)
app.use("/news", newsRoute)
app.use("/imdb", imdbRoute)

// Start server
app.listen(port, () => {
    console.log(`#### -> Starting Anime Max API Server...`);
    console.log(`#### -> Environment: ${process.env.DEV_MODE === 'true' ? 'Development' : 'Production'}`);
    console.log(`#### -> Server is live!`);
    console.log(`#### -> Listening on port: ${port}`);
});