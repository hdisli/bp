import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { getRedisClient } from '../config/redis.config';
import { getOpenSearchClient } from '../config/opensearch.config';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('db')
  async checkDatabase() {
    try {
      const startTime = Date.now();
      await this.dataSource.query('SELECT 1');
      const latency = Date.now() - startTime;

      return {
        postgresql: 'connected',
        latency: `${latency}ms`,
      };
    } catch (error) {
      return {
        postgresql: 'disconnected',
        error: error.message,
      };
    }
  }

  @Get('redis')
  async checkRedis() {
    try {
      const client = await getRedisClient();
      const startTime = Date.now();
      await client.ping();
      const latency = Date.now() - startTime;

      return {
        redis: 'connected',
        latency: `${latency}ms`,
      };
    } catch (error) {
      return {
        redis: 'disconnected',
        error: error.message,
      };
    }
  }

  @Get('opensearch')
  async checkOpenSearch() {
    try {
      const client = await getOpenSearchClient();
      const startTime = Date.now();
      const health = await client.cluster.health();
      const latency = Date.now() - startTime;

      return {
        opensearch: 'connected',
        latency: `${latency}ms`,
        status: health.body.status,
      };
    } catch (error) {
      return {
        opensearch: 'disconnected',
        error: error.message,
      };
    }
  }
}
