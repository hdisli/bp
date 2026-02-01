import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') q: string) {
    if (!q || q.trim().length === 0) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'MISSING_QUERY',
            message: 'Search query parameter "q" is required',
            statusCode: HttpStatus.BAD_REQUEST,
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (q.trim().length < 2) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: 'Search query must be at least 2 characters',
            statusCode: HttpStatus.BAD_REQUEST,
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (q.trim().length > 200) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'QUERY_TOO_LONG',
            message: 'Search query must not exceed 200 characters',
            statusCode: HttpStatus.BAD_REQUEST,
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const results = await this.searchService.search(q);

      return {
        success: true,
        data: results,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
          query: q.trim(),
          total: results.length,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'SEARCH_ERROR',
            message: error.message || 'Search service unavailable',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('suggest')
  async suggest(@Query('q') q: string) {
    if (!q || q.trim().length === 0) {
      return {
        success: true,
        data: [],
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    }

    if (q.trim().length > 200) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'QUERY_TOO_LONG',
            message: 'Search query must not exceed 200 characters',
            statusCode: HttpStatus.BAD_REQUEST,
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const results = await this.searchService.suggest(q);

      return {
        success: true,
        data: results,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
          query: q.trim(),
          total: results.length,
        },
      };
    } catch (_error) {
      return {
        success: true,
        data: [],
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    }
  }
}
