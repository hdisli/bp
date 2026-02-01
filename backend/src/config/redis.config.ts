import { createClient } from 'redis';
import { Logger } from '@nestjs/common';

const logger = new Logger('RedisConfig');

let redisClient: ReturnType<typeof createClient> | null = null;

export const getRedisClient = async () => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

  try {
    logger.log(`Connecting to Redis at ${redisUrl}`);

    redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis connection error: ${err.message}`);
    });

    await redisClient.connect();

    const startTime = Date.now();
    await redisClient.ping();
    const latency = Date.now() - startTime;

    logger.log(`Redis connected (latency: ${latency}ms)`);

    return redisClient;
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${error.message}`);
    throw error;
  }
};

export const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
