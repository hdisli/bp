export const getAppConfig = () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'debug',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://redis:6379',
  },
  opensearch: {
    url: process.env.OPENSEARCH_URL || 'http://opensearch:9200',
  },
});
