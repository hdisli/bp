import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const databaseUrl =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/product_platform';

const url = new URL(databaseUrl);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: url.hostname,
  port: parseInt(url.port) || 5432,
  username: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
