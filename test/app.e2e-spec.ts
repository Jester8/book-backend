import { type ExecutionContext, type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { GqlAuthGuard } from '../src/auth/gql-auth.guard';

/**
 * End-to-end tests over real HTTP against the full Nest app, using an
 * in-memory database (see setup-env.ts) so the committed SQLite file is
 * never touched.
 */
async function createApp(options: { bypassAuth: boolean }): Promise<INestApplication<App>> {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (options.bypassAuth) {
    // Stands in for a verified Auth0 token, so the CRUD tests do not need a
    // live tenant. The real guard is covered by the "authorization" tests.
    builder = builder.overrideProvider(GqlAuthGuard).useValue({
      canActivate: (_context: ExecutionContext) => true,
    });
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.init();
  return app;
}

const gql = (app: INestApplication<App>, query: string, variables?: object, token?: string) => {
  const req = request(app.getHttpServer()).post('/graphql').send({ query, variables });
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

describe('authorization', () => {
  let app: INestApplication<App>;
  beforeAll(async () => (app = await createApp({ bypassAuth: false })));
  afterAll(() => app.close());

  it('rejects GraphQL requests without a token', async () => {
    const res = await gql(app, '{ books { id } }');
    expect(res.body.data).toBeNull();
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('rejects GraphQL requests with a malformed token', async () => {
    const res = await gql(app, '{ books { id } }', undefined, 'not-a-jwt');
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('leaves the health check public', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' });
  });
});

describe('books API (authorized)', () => {
  let app: INestApplication<App>;
  beforeAll(async () => (app = await createApp({ bypassAuth: true })));
  afterAll(() => app.close());

  it('creates, lists, updates and deletes a book', async () => {
    const created = await gql(
      app,
      'mutation ($input: CreateBookInput!) { createBook(input: $input) { id name description } }',
      { input: { name: '  Anthills of the Savannah  ', description: 'Three friends and a dictator.' } },
    );
    const book = created.body.data.createBook;
    // Surrounding whitespace is trimmed by the input DTO.
    expect(book).toMatchObject({ name: 'Anthills of the Savannah' });

    const listed = await gql(app, '{ books { id name } }');
    expect(listed.body.data.books).toEqual([{ id: book.id, name: 'Anthills of the Savannah' }]);

    const updated = await gql(
      app,
      'mutation ($id: Int!, $input: UpdateBookInput!) { updateBook(id: $id, input: $input) { name description } }',
      { id: book.id, input: { name: 'Anthills' } },
    );
    expect(updated.body.data.updateBook).toEqual({ name: 'Anthills', description: 'Three friends and a dictator.' });

    const deleted = await gql(app, 'mutation ($id: Int!) { deleteBook(id: $id) }', { id: book.id });
    expect(deleted.body.data.deleteBook).toBe(book.id);
  });

  it('rejects an empty name with a validation error', async () => {
    const res = await gql(app, 'mutation ($input: CreateBookInput!) { createBook(input: $input) { id } }', {
      input: { name: '   ', description: 'Something' },
    });
    expect(res.body.errors[0].extensions.code).toBe('BAD_REQUEST');
    expect(JSON.stringify(res.body.errors[0])).toContain('Name is required.');
  });

  it('returns NOT_FOUND for a missing book', async () => {
    const res = await gql(app, '{ book(id: 999) { id } }');
    expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND');
  });
});
