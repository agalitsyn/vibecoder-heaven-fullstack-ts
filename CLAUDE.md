# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Fullstack TypeScript starter template with authentication, file storage (S3), API keys, and an admin panel.

**Main application language: English.** All user-facing text should be in English.

## Structure

```
├── src/
│   ├── components/         # React components
│   │   ├── ui/             # shadcn/ui components
│   │   └── profile/        # Profile page component
│   ├── routes/             # File-based routes + API endpoints
│   │   ├── __root.tsx      # Root layout with nav
│   │   ├── _authed.tsx     # Auth guard layout
│   │   ├── api/auth/$.ts   # Better Auth API route handler
│   │   └── _authed/        # Protected routes
│   │       ├── documents.* # Document CRUD pages
│   │       ├── profile.tsx # User profile + API keys
│   │       └── admin/      # Admin panel (users, keys, docs)
│   ├── lib/                # Auth configuration
│   │   ├── auth.ts         # Better Auth server config
│   │   ├── auth-client.ts  # Better Auth client config
│   │   ├── auth-session.ts # getSession server function (safe for client import)
│   │   └── auth-helpers.ts # requireAuth/requireAdmin helpers (server-only)
│   ├── db/                 # Drizzle ORM schema and seeds
│   ├── utils/              # Server functions and utilities
│   └── hooks/              # React hooks
├── drizzle/                # Database migrations
├── package.json
└── docker-compose.yml
```

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev              # Start dev server on port 3000
pnpm dev-infra        # Start PostgreSQL + MinIO

# Build & Production
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm start            # Run production server

# Database (Drizzle)
pnpm db:generate      # Generate migrations from schema changes
pnpm db:migrate       # Apply pending migrations
pnpm db:push          # Push schema directly (dev only)
pnpm db:studio        # Open Drizzle Studio
pnpm db:seed          # Seed database with test data
pnpm db:seed:admin    # Create admin user only
```

## Architecture

### Tech Stack
- **TanStack Start** (React) — full-stack framework with server functions
- **TanStack Router** — file-based routing with type-safe navigation
- **Better Auth** — authentication library with admin & API key plugins
- **Drizzle ORM** — PostgreSQL database with migrations
- **Tailwind CSS v4** + **shadcn/ui** — styling and UI components
- **S3/MinIO** — file storage with presigned URLs

### Key Patterns

**Server Functions:**
```typescript
import { createServerFn } from '@tanstack/react-start'

export const fetchData = createServerFn({ method: 'GET' })
  .inputValidator((input: InputType) => input)
  .handler(async ({ data }) => { /* server code */ })
```

**Authentication (Better Auth):**
1. Server config in `src/lib/auth.ts` with Drizzle adapter, admin plugin, API key plugin
2. Client config in `src/lib/auth-client.ts` with `createAuthClient()`
3. API route handler at `src/routes/api/auth/$.ts` handles all `/api/auth/*` requests
4. Root route fetches session via `getSession()` in `beforeLoad` and passes `user` to context
5. `_authed.tsx` layout checks `context.user`
6. Admin routes check `user.role === 'admin'` in `beforeLoad`
7. Server functions use `requireAuth()` / `requireAdmin()` from `src/lib/auth-helpers.ts`

**Path Aliases:**
- `~/` maps to `./src/`

### Database Tables (Better Auth managed)
- `user` — id, name, email, emailVerified, role, banned, etc.
- `session` — token-based sessions with expiry
- `account` — OAuth/credential provider accounts
- `verification` — email verification tokens
- `apikey` — API keys with rate limiting support
- `Document` — title, file metadata (S3 key, name, type, size), userId

### Environment

Create `.env` in project root (see `.env.example`):
- `DATABASE_URL` — PostgreSQL connection string
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` — MinIO/S3
- `BETTER_AUTH_SECRET` — Auth encryption secret (min 32 chars)
- `BETTER_AUTH_URL` — Base URL for auth (e.g., http://localhost:3000)

### Test Users (after db:seed)
- user@example.com / user (user role)
- admin@example.com / admin (admin role)

### Testing

Use Playwright MCP tools to test features in Chrome browser. After implementing UI changes:
1. The dev server is usually already running - try `http://localhost:3000/` first
2. Navigate to the relevant page using `browser_navigate`
3. Interact with elements using `browser_click`, `browser_fill_form`, etc.
4. Verify the expected behavior
5. Close browser when done
