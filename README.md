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

Apply database schema and seed admin user:

```sh
pnpm db:push
pnpm db:seed
```

| Email              | Password      | Role  |
|--------------------|---------------|-------|
| admin@example.com  | adminadmin    | admin |

Admin users have access to the admin panel at `/admin`.


Start the dev server:

```sh
pnpm dev
```

App runs at http://localhost:3000

## Test Users

Run `pnpm db:seed:testdata`:

## Build

```sh
pnpm build
pnpm start
```
