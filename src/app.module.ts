import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Request } from 'express';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { formatGraphQLError } from './common/format-graphql-error';
import { type EnvironmentVariables, validateEnv } from './config/env.validation';
import { buildDataSourceOptions } from './database/data-source';
import { HealthController } from './health/health.controller';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    // Loads .env and validates it once, before anything else starts. Tests
    // skip the file so a developer's local .env can never leak into them.
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => {
        const databasePath = config.get('DATABASE_PATH', { infer: true });
        // better-sqlite3 creates the file but not missing folders.
        mkdirSync(dirname(databasePath), { recursive: true });
        return buildDataSourceOptions(databasePath);
      },
    }),

    // Code-first GraphQL: the schema is generated from the TypeScript
    // decorators and written to schema.gql, so reviewers and frontend
    // developers can read the contract without running the server.
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      // Exposes the Express request to guards (see GqlAuthGuard.getRequest).
      context: ({ req }: { req: Request }) => ({ req }),
      // Schema introspection and the Apollo Sandbox page are handy locally
      // but reveal the API's shape, so they are off in production.
      introspection: !isProduction,
      playground: false,
      includeStacktraceInErrorResponses: !isProduction,
      formatError: formatGraphQLError,
    }),

    AuthModule,
    BooksModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
