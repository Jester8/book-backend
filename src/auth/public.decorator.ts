import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route out of the global auth guard. Everything is private by
 * default; only routes marked `@Public()` (such as the health check) are not.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
