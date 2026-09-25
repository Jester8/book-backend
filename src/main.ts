import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  // Only the listed frontends may call the API from a browser.
  const origins = config
    .get('CORS_ORIGINS', { infer: true })
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins });

  // Validates every GraphQL input against its class-validator rules.
  // `transform` applies @Transform (e.g. trimming) and `whitelist` drops any
  // field that is not declared on the input class.
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Lets the process close database handles cleanly when the host stops it.
  app.enableShutdownHooks();

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
