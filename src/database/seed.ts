import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DataSource } from 'typeorm';
import { Book } from '../books/book.entity';
import { buildDataSourceOptions } from './data-source';

/**
 * Fills an empty database with a few books so the dashboard has something
 * to show on first run. It does nothing if books already exist, so it is
 * safe to run more than once.
 *
 * Usage: npm run seed
 */
const SAMPLE_BOOKS: Array<Pick<Book, 'name' | 'description'>> = [
  {
    name: 'Things Fall Apart',
    description:
      'Chinua Achebe follows Okonkwo, a proud Igbo leader, as colonial rule and missionaries unravel the world he knows.',
  },
  {
    name: 'Half of a Yellow Sun',
    description:
      'Chimamanda Ngozi Adichie tells the story of the Nigerian Civil War through three lives pulled together and apart by it.',
  },
  {
    name: 'The Famished Road',
    description: 'Ben Okri\'s Booker-winning novel about Azaro, a spirit child living between two worlds in a Lagos slum.',
  },
  {
    name: 'Clean Code',
    description: 'Robert C. Martin on writing code that other people can read, change and trust.',
  },
];

async function seed() {
  const databasePath = process.env.DATABASE_PATH ?? 'data/books.sqlite';
  mkdirSync(dirname(databasePath), { recursive: true });

  const dataSource = await new DataSource(buildDataSourceOptions(databasePath)).initialize();
  const books = dataSource.getRepository(Book);

  if ((await books.count()) > 0) {
    console.log('Database already has books, skipping seed.');
  } else {
    await books.save(SAMPLE_BOOKS.map((book) => books.create(book)));
    console.log(`Seeded ${SAMPLE_BOOKS.length} books into ${databasePath}.`);
  }

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
