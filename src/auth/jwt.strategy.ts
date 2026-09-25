import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { EnvironmentVariables } from '../config/env.validation';

/** The claims this API relies on from an Auth0 access token. */
export interface AuthUser {
  /** Auth0 user id, e.g. "auth0|64f1..." */
  sub: string;
  scope?: string;
}

/**
 * Verifies Auth0 access tokens.
 *
 * Auth0 signs tokens with RS256 using a private key only it holds. The
 * matching public keys are published at the tenant's JWKS endpoint;
 * `jwks-rsa` downloads them, caches them and picks the right one using the
 * token's `kid` header. No shared secret is stored in this service.
 *
 * A token is accepted only if all of these hold:
 * - the signature matches one of Auth0's public keys,
 * - `iss` is our tenant and `aud` is our API, so tokens minted for other
 *   tenants or other APIs are rejected,
 * - it has not expired (checked by passport-jwt by default).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<EnvironmentVariables, true>) {
    const issuer = config.get('AUTH0_ISSUER_URL', { infer: true });
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        jwksUri: `${issuer}.well-known/jwks.json`,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
      }),
      issuer,
      audience: config.get('AUTH0_AUDIENCE', { infer: true }),
      algorithms: ['RS256'],
    });
  }

  /** Whatever this returns becomes `req.user`. The verified payload is enough here. */
  validate(payload: AuthUser): AuthUser {
    return payload;
  }
}
