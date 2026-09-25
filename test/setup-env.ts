/**
 * Runs before any test file is imported. ConfigModule reads the environment
 * at import time, so these values must be in place first. Pointing the
 * database at ":memory:" guarantees tests never touch data/books.sqlite.
 */
process.env.AUTH0_ISSUER_URL = 'https://example.auth0.com/';
process.env.AUTH0_AUDIENCE = 'https://book-admin';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.DATABASE_PATH = ':memory:';
