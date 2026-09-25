import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { GqlAuthGuard } from './gql-auth.guard';
import { JwtStrategy } from './jwt.strategy';

/**
 * Registers the guard with APP_GUARD so it applies to every resolver and
 * controller automatically. Protection is the default: a new resolver cannot
 * be exposed by forgetting a decorator.
 *
 * The guard is also registered under its own class and aliased with
 * `useExisting`, which lets tests swap it via `overrideProvider(GqlAuthGuard)`.
 */
@Module({
  imports: [PassportModule],
  providers: [JwtStrategy, GqlAuthGuard, { provide: APP_GUARD, useExisting: GqlAuthGuard }],
})
export class AuthModule {}
