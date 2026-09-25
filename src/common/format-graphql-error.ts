import type { GraphQLFormattedError } from 'graphql';

/** The part of a Nest HttpException that the Apollo driver copies into `extensions.originalError`. */
interface NestOriginalError {
  statusCode?: number;
  message?: string | string[];
}

/**
 * Makes HTTP exceptions thrown in services read well as GraphQL errors.
 *
 * - Nest's Apollo driver only maps 400/401/403/422 to GraphQL codes, so a
 *   NotFoundException would otherwise reach the client as
 *   INTERNAL_SERVER_ERROR. It is given the NOT_FOUND code here.
 * - For validation failures the top-level message is the generic
 *   "Bad Request Exception" while the useful messages sit in an array.
 *   They are lifted into `message`, which is what the frontend shows.
 * - `originalError` is dropped because it duplicates what is now in the
 *   error and would leak internal details.
 */
export function formatGraphQLError(formatted: GraphQLFormattedError): GraphQLFormattedError {
  const { originalError, ...extensions } = (formatted.extensions ?? {}) as Record<string, unknown> & {
    originalError?: NestOriginalError;
  };
  if (!originalError) return formatted;

  const details = originalError.message;
  const message = Array.isArray(details) ? details.join(' ') : (details ?? formatted.message);
  const code = originalError.statusCode === 404 ? 'NOT_FOUND' : extensions.code;

  return { ...formatted, message, extensions: { ...extensions, code } };
}
