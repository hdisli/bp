import { Client } from '@opensearch-project/opensearch';
import { Logger } from '@nestjs/common';

const logger = new Logger('OpenSearchConfig');

let openSearchClient: Client | null = null;

export const getOpenSearchClient = async () => {
  if (openSearchClient) {
    return openSearchClient;
  }

  const openSearchUrl = process.env.OPENSEARCH_URL || 'http://opensearch:9200';

  try {
    logger.log(`Connecting to OpenSearch at ${openSearchUrl}`);

    const isProduction = process.env.NODE_ENV === 'production';

    openSearchClient = new Client({
      node: openSearchUrl,
      ...(isProduction ? {} : { ssl: { rejectUnauthorized: false } }),
    });

    const startTime = Date.now();
    const health = await openSearchClient.cluster.health();
    const latency = Date.now() - startTime;

    if (health.body.status === 'red') {
      logger.warn('OpenSearch cluster status is RED');
    } else {
      logger.log(`OpenSearch cluster healthy (latency: ${latency}ms)`);
    }

    return openSearchClient;
  } catch (error) {
    logger.error(`Failed to connect to OpenSearch: ${error.message}`);
    throw error;
  }
};
