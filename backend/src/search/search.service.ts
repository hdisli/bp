import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';

export interface SearchResult {
  id: number;
  name: string;
  brand: string;
  description: string;
  category: string;
  category_id: number;
}

export interface SuggestResult {
  id: number;
  name: string;
  brand: string;
  category: string;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly client: Client;
  private readonly indexName = 'products';

  constructor() {
    this.client = new Client({
      node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
    });
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    try {
      this.logger.log(`Searching for: "${query}"`);
      const searchTerm = query.trim().toLowerCase();

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              should: [
                {
                  multi_match: {
                    query: searchTerm,
                    fields: [
                      'name^3',
                      'name.autocomplete^2',
                      'brand^2',
                      'brand.autocomplete',
                      'description',
                      'category',
                    ],
                    operator: 'or',
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                  },
                },
                {
                  prefix: {
                    'name.keyword': {
                      value: searchTerm,
                      boost: 2.5,
                    },
                  },
                },
                {
                  prefix: {
                    'brand.keyword': {
                      value: searchTerm,
                      boost: 2,
                    },
                  },
                },
                {
                  match: {
                    'name.autocomplete': {
                      query: searchTerm,
                      boost: 1.5,
                    },
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
          size: 20,
        },
      });

      const hits = response.body.hits.hits;
      this.logger.log(`Found ${hits.length} results`);

      const results: SearchResult[] = hits.map((hit: { _source: Record<string, unknown> }) => ({
        id: hit._source.id as number,
        name: hit._source.name as string,
        brand: (hit._source.brand as string) || '',
        description: (hit._source.description as string) || '',
        category: (hit._source.category as string) || '',
        category_id: hit._source.category_id as number,
      }));

      return results;
    } catch (error) {
      this.logger.error('Search failed:', error.message);

      if (error.message.includes('index_not_found_exception')) {
        throw new Error('Search index not found. Please run the sync script first.');
      }

      if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Search service unavailable');
      }

      throw new Error('Search failed: ' + error.message);
    }
  }

  async suggest(query: string): Promise<SuggestResult[]> {
    if (!query || query.trim().length < 1) {
      return [];
    }

    try {
      this.logger.log(`Suggesting for: "${query}"`);
      const searchTerm = query.trim().toLowerCase();

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              should: [
                {
                  match: {
                    'name.autocomplete': {
                      query: searchTerm,
                      boost: 4,
                    },
                  },
                },
                {
                  match: {
                    'brand.autocomplete': {
                      query: searchTerm,
                      boost: 3,
                    },
                  },
                },
                {
                  prefix: {
                    'name.keyword': {
                      value: searchTerm,
                      boost: 2,
                    },
                  },
                },
                {
                  prefix: {
                    'brand.keyword': {
                      value: searchTerm,
                      boost: 1.5,
                    },
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
          size: 8,
          _source: ['id', 'name', 'brand', 'category'],
        },
      });

      const hits = response.body.hits.hits;
      this.logger.log(`Found ${hits.length} suggestions`);

      const results: SuggestResult[] = hits.map((hit: { _source: Record<string, unknown> }) => ({
        id: hit._source.id as number,
        name: hit._source.name as string,
        brand: (hit._source.brand as string) || '',
        category: (hit._source.category as string) || '',
      }));

      return results;
    } catch (error) {
      this.logger.error('Suggest failed:', error.message);
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      this.logger.error('OpenSearch health check failed:', error.message);
      return false;
    }
  }
}
