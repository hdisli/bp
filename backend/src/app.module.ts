import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { SearchModule } from './search/search.module';
import { AuthModule } from './auth/auth.module';
import { RatingsModule } from './ratings/ratings.module';
import { UsersModule } from './users/users.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfileCommentsModule } from './profile-comments/profile-comments.module';
import { getDatabaseConfig } from './config/database.config';
import { getAppConfig } from './config/app.config';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { AuditLogService } from './common/services/audit-log.service';
import { OnlineStatusService } from './common/services/online-status.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [getAppConfig],
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: getDatabaseConfig,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),
    HealthModule,
    ProductsModule,
    CategoriesModule,
    SearchModule,
    AuthModule,
    RatingsModule,
    UsersModule,
    FriendshipsModule,
    NotificationsModule,
    ProfileCommentsModule,
  ],
  controllers: [],
  providers: [AuditLogService, OnlineStatusService],
  exports: [AuditLogService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // CSRF-Schutz für alle API-Routen (inkl. Profile-Comments /api/users/:id/profile-comments)
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
