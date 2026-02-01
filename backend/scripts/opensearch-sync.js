const { Client } = require('@opensearch-project/opensearch');
const { Client: PgClient } = require('pg');

const opensearchClient = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
});

const pgClient = new PgClient({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'product_platform',
});

const INDEX_NAME = 'products';

async function main() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await pgClient.connect();
    console.log('✅ PostgreSQL connected');

    console.log('🔌 Connecting to OpenSearch...');
    const pingResponse = await opensearchClient.ping();
    console.log('✅ OpenSearch connected');

    console.log('📊 Fetching products from PostgreSQL...');
    const query = `
      SELECT
        p.id,
        p.name,
        p.brand,
        p.description,
        c.name as category,
        p.category_id,
        p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id ASC
    `;
    const result = await pgClient.query(query);
    const products = result.rows;
    console.log(`✅ Found ${products.length} products`);

    try {
      console.log('🗑️  Deleting existing index...');
      await opensearchClient.indices.delete({ index: INDEX_NAME });
      console.log('✅ Index deleted');
    } catch (error) {
      console.log('ℹ️  Index does not exist, creating new one');
    }

    console.log('🔨 Creating index with mapping...');
    await opensearchClient.indices.create({
      index: INDEX_NAME,
      body: {
        settings: {
          analysis: {
            analyzer: {
              lowercase_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase'],
              },
              autocomplete: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'edge_ngram_filter'],
              },
            },
            filter: {
              edge_ngram_filter: {
                type: 'edge_ngram',
                min_gram: 1,
                max_gram: 20,
              },
            },
          },
        },
        mappings: {
          properties: {
            id: { type: 'integer' },
            name: {
              type: 'text',
              analyzer: 'lowercase_analyzer',
              fields: {
                autocomplete: {
                  type: 'text',
                  analyzer: 'autocomplete',
                  search_analyzer: 'lowercase_analyzer',
                },
                keyword: {
                  type: 'keyword',
                  normalizer: 'lowercase',
                },
              },
            },
            brand: {
              type: 'text',
              analyzer: 'lowercase_analyzer',
              fields: {
                autocomplete: {
                  type: 'text',
                  analyzer: 'autocomplete',
                  search_analyzer: 'lowercase_analyzer',
                },
                keyword: {
                  type: 'keyword',
                  normalizer: 'lowercase',
                },
              },
            },
            description: { type: 'text', analyzer: 'lowercase_analyzer' },
            category: {
              type: 'text',
              analyzer: 'lowercase_analyzer',
              fields: {
                keyword: {
                  type: 'keyword',
                  normalizer: 'lowercase',
                },
              },
            },
            category_id: { type: 'integer' },
            created_at: { type: 'date' },
          },
        },
      },
    });
    console.log('✅ Index created');

    console.log('📝 Indexing products...');
    let indexed = 0;
    for (const product of products) {
      await opensearchClient.index({
        index: INDEX_NAME,
        id: String(product.id),
        body: {
          id: product.id,
          name: product.name,
          brand: product.brand || '',
          description: product.description || '',
          category: product.category || '',
          category_id: product.category_id,
          created_at: product.created_at,
        },
      });
      indexed++;
      process.stdout.write(`\r   Indexed: ${indexed}/${products.length}`);
    }
    console.log('');

    console.log('🔄 Refreshing index...');
    await opensearchClient.indices.refresh({ index: INDEX_NAME });

    console.log('');
    console.log('🎉 ✅ Successfully synced ' + products.length + ' products to OpenSearch');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Sync failed:', error.message);
    console.error('');
    process.exit(1);
  } finally {
    await pgClient.end();
  }
}

main();
