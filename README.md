# Book Admin API

NestJS GraphQL API behind the Book Admin dashboard. Admins create, read, update and delete books. Every GraphQL operation requires a valid Auth0 access token.

Frontend repository: [Jester8/Book](https://github.com/Jester8/Book)

## Stack

| Concern | Choice |
| --- | --- |
| Framework | NestJS 11, TypeScript |
| API | GraphQL, code-first, Apollo Server 5 |
| Database | SQLite (`data/books.sqlite`, committed) through TypeORM and better-sqlite3 |
| Auth | Auth0 access tokens (RS256 JWT), verified with passport-jwt and jwks-rsa |
| Validation | class-validator on every input |
| Tests | Jest and Supertest |

## Getting started

Requires Node 20.11 or newer.

```bash
npm install
cp .env.example .env    # then fill in your Auth0 values
npm run start:dev
```

The API listens on http://localhost:3000:

- `POST /graphql`: the GraphQL endpoint (token required)
- `GET /health`: public liveness check

Pending migrations run automatically on start-up.

### Environment variables

| Variable | Description |
| --- | --- |
| `PORT` | HTTP port. Defaults to `3000`. |
| `AUTH0_ISSUER_URL` | Tenant URL, e.g. `https://your-tenant.us.auth0.com/` |
| `AUTH0_AUDIENCE` | Identifier of the Auth0 API, e.g. `https://book-admin` |
| `CORS_ORIGINS` | Comma-separated frontend origins, e.g. `http://localhost:5173` |
| `DATABASE_PATH` | SQLite file. Defaults to `data/books.sqlite`. |

The server validates these on boot and refuses to start with a clear message if one is missing or malformed.

## GraphQL schema

The schema is generated from the code into [`schema.gql`](schema.gql):

```graphql
type Book { id: Int!, name: String!, description: String! }

type Query {
  books: [Book!]!
  book(id: Int!): Book!
}

type Mutation {
  createBook(input: CreateBookInput!): Book!
  updateBook(id: Int!, input: UpdateBookInput!): Book!
  deleteBook(id: Int!): Int!   # returns the deleted id
}
```

Errors use standard codes: `UNAUTHENTICATED` (missing or invalid token), `BAD_REQUEST` (validation, with the reasons in `message`) and `NOT_FOUND`.

### Trying it by hand

Get a token for your user from the frontend (or Auth0's API "Test" tab), then:

```bash
curl http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access token>" \
  -d '{"query":"{ books { id name description } }"}'
```

## How authorization works

1. The frontend signs the admin in with Auth0 and requests an access token for the audience `AUTH0_AUDIENCE`.
2. Each GraphQL request sends it as `Authorization: Bearer <token>`.
3. `GqlAuthGuard` is registered globally (`APP_GUARD`), so it runs before every resolver. A new resolver is protected by default.
4. `JwtStrategy` verifies the RS256 signature against Auth0's published keys (JWKS, cached), plus the issuer, audience and expiry. No secret is stored in this service.
5. Routes that must stay open, only `/health`, opt out with `@Public()`.

GraphQL introspection is disabled in production, so the schema isn't exposed to anonymous callers.

## Project structure

```
src/
├── main.ts                        Bootstrap: CORS, validation pipe
├── app.module.ts                  Config, database, GraphQL wiring
├── config/env.validation.ts       Typed, validated environment
├── auth/                          JWT strategy, global guard, @Public()
├── books/                         Entity, inputs, service, resolver
├── common/format-graphql-error.ts Maps HTTP exceptions to GraphQL errors
├── database/
│   ├── data-source.ts             Shared TypeORM options and CLI data source
│   ├── migrations/                Versioned schema changes
│   └── seed.ts                    Sample books for an empty database
└── health/                        Public health check
data/books.sqlite                  The committed database
test/                              End-to-end tests
```

## Design decisions

- **Code-first GraphQL.** The TypeScript classes are the single source of truth, and `schema.gql` is generated from them.
- **One class for entity and GraphQL type.** The model has three fields. Two identical classes would only add drift.
- **Migrations, not `synchronize`.** Schema changes are explicit, reviewable and versioned. `migrationsRun` applies them on boot.
- **Thin resolver, testable service.** Resolvers only map arguments. Rules and not-found handling live in `BooksService`.
- **Validation at the edge.** Inputs are trimmed and length-checked before they reach the service. The limits match the column sizes.
- **Real database in tests.** Unit tests run the service against in-memory SQLite with the real migrations, instead of mocking the repository.

## Scripts

| Command | Description |
| --- | --- |
| `npm run start:dev` | Start with reload on change |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled app |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests (in-memory database) |
| `npm run seed` | Add sample books to an empty database |
| `npm run migration:generate -- src/database/migrations/Name` | Generate a migration from entity changes |

## Deployment (Render)

`render.yaml` describes the service. In Render, choose **New → Blueprint**, select this repository, then set `AUTH0_ISSUER_URL`, `AUTH0_AUDIENCE` and `CORS_ORIGINS` (the Netlify URL).

**Note on SQLite and free hosting:** Render's free plan has no persistent disk. The committed `data/books.sqlite` is the starting state on every deploy or restart, and changes made in between are lost at that point. That's acceptable for this exercise. For real use, attach a persistent disk and point `DATABASE_PATH` at it, or switch TypeORM to a hosted database such as Postgres or MySQL, which needs only a config change.
