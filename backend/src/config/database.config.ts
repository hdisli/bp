import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';

const logger = new Logger('DatabaseConfig');

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logger.error('DATABASE_URL environment variable is not set');
    throw new Error('DATABASE_URL is required');
  }

  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':***@');
  logger.log(`Connecting to ${maskedUrl}`);

  try {
    const url = new URL(databaseUrl);

    const config: TypeOrmModuleOptions = {
      type: 'postgres',
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      entities: [],
      synchronize: false,
      migrationsRun: true,
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      logging: process.env.NODE_ENV === 'development',
      autoLoadEntities: true,
    };

    logger.log('Database configuration loaded successfully');
    return config;
  } catch (error) {
    logger.error(`Failed to parse DATABASE_URL: ${error.message}`);
    throw new Error('Invalid DATABASE_URL format');
  }
};
