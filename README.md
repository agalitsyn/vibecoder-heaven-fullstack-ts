# Fullstack TS

A production-ready starter template with authentication, file storage, API keys, and an admin panel. Built with TanStack Start, Drizzle ORM, and PostgreSQL.

## Getting Started

```sh
cp .env.example .env
pnpm install
```

Start infrastructure (PostgreSQL + MinIO):

```sh
pnpm dev-infra
```

Apply database schema and seed test data:

```sh
pnpm db:push
pnpm db:seed
```

Start the dev server:

```sh
pnpm dev
```

App runs at http://localhost:3000

## Test Users

After running `pnpm db:seed`:

| Email              | Password      | Role  |
|--------------------|---------------|-------|
| user@example.com   | password123   | USER  |
| admin@example.com  | password123   | ADMIN |

Admin users have access to the admin panel at `/admin`.

## Build

```sh
pnpm build
pnpm start
```
