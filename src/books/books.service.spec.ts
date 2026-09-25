import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../database/data-source';
import { Book } from './book.entity';
import { BooksService } from './books.service';

/**
 * Runs the service against a real in-memory SQLite database with the real
 * migrations, rather than a mocked repository. This checks the actual SQL
 * behaviour (ordering, ids, deletes) while staying fast and isolated.
 */
describe('BooksService', () => {
  let dataSource: DataSource;
  let service: BooksService;

  beforeEach(async () => {
    dataSource = await new DataSource(buildDataSourceOptions(':memory:')).initialize();
    service = new BooksService(dataSource.getRepository(Book));
  });

  afterEach(() => dataSource.destroy());

  it('creates a book and assigns an id', async () => {
    const book = await service.create({ name: 'Arrow of God', description: 'Ezeulu and the new religion.' });
    expect(book).toEqual({ id: 1, name: 'Arrow of God', description: 'Ezeulu and the new religion.' });
  });

  it('lists books in the order they were added', async () => {
    await service.create({ name: 'First', description: 'One' });
    await service.create({ name: 'Second', description: 'Two' });
    const names = (await service.findAll()).map((book) => book.name);
    expect(names).toEqual(['First', 'Second']);
  });

  it('updates only the fields that are sent', async () => {
    const { id } = await service.create({ name: 'Draft', description: 'Keep me' });
    const updated = await service.update(id, { name: 'Final' });
    expect(updated).toEqual({ id, name: 'Final', description: 'Keep me' });
  });

  it('deletes a book and returns its id', async () => {
    const { id } = await service.create({ name: 'Temporary', description: 'Soon gone' });
    await expect(service.remove(id)).resolves.toBe(id);
    await expect(service.findAll()).resolves.toHaveLength(0);
  });

  it.each([
    ['findOne', (s: BooksService) => s.findOne(99)],
    ['update', (s: BooksService) => s.update(99, { name: 'x' })],
    ['remove', (s: BooksService) => s.remove(99)],
  ])('%s throws NotFoundException for an unknown id', async (_name, call) => {
    await expect(call(service)).rejects.toBeInstanceOf(NotFoundException);
  });
});
