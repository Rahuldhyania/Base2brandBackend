const { createClient } = require("redis");

async function connectRedis() {
  try {
    const redisUrl = process.env.REDIS_URL;

    global.redisClient = createClient({
      url: redisUrl
    });

    global.redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
      global.redisReady = false;
    });

    global.redisClient.on("connect", () => console.log("Redis: Connecting..."));
    global.redisClient.on("ready", () => {
      global.redisReady = true;
      console.log("REDIS CONNECTED SUCCESSFULLY!");
    });

    await global.redisClient.connect();
  } catch (err) {
    console.log("Redis failed (running without cache):", err.message);
    global.redisReady = false;
  }
}

module.exports = { connectRedis };