import 'reflect-metadata';
import { join } from 'node:path';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { Book } from '../books/book.entity';

/**
 * TypeORM options shared by the Nest app, the migration CLI and the seed
 * script, so all three always talk to the same database in the same way.
 *
 * - `synchronize` is off: the schema only changes through migrations, which
 *   are versioned in git and reviewable, unlike automatic syncing.
 * - `migrationsRun` applies pending migrations on start-up, so a fresh
 *   deployment always has the right schema without a manual step.
 */
export function buildDataSourceOptions(databasePath: string): DataSourceOptions {
  return {
    type: 'better-sqlite3',
    database: databasePath,
    entities: [Book],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsRun: true,
    synchronize: false,
  };
}

/** Standalone data source for the TypeORM CLI (`npm run migration:*`). */
export default new DataSource(buildDataSourceOptions(process.env.DATABASE_PATH ?? 'data/books.sqlite'));
