import { plainToInstance, Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, IsUrl, Max, Min, validateSync } from 'class-validator';

/**
 * Shape of the environment the API needs to start.
 *
 * Validating it once at boot means a missing or malformed value stops the
 * server immediately with a readable message, instead of failing later on the
 * first request (for example, every token being rejected because the issuer
 * URL has a typo).
 */
export class EnvironmentVariables {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  /** Auth0 tenant URL. A trailing slash is added if missing, because the `iss` claim always has one. */
  @Transform(({ value }) => (typeof value === 'string' && !value.endsWith('/') ? `${value}/` : value))
  @IsUrl({ require_tld: true, require_protocol: true })
  AUTH0_ISSUER_URL!: string;

  @IsString()
  @IsNotEmpty()
  AUTH0_AUDIENCE!: string;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS!: string;

  @IsString()
  DATABASE_PATH: string = 'data/books.sqlite';
}

/** Used by ConfigModule to validate and type-convert `process.env`. */
export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  // `exposeDefaultValues` keeps the defaults above for variables that are
  // not set, instead of overwriting them with undefined.
  const env = plainToInstance(EnvironmentVariables, config, { exposeDefaultValues: true });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors.map((error) => Object.values(error.constraints ?? {}).join(', ')).join('\n  ');
    throw new Error(`Invalid environment configuration:\n  ${details}`);
  }
  return env;
}
