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
│   │   └── _authed/        # Protected routes
│   │       ├── documents.* # Document CRUD pages
│   │       ├── profile.tsx # User profile + API keys
│   │       └── admin/      # Admin panel (users, keys, docs)
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

**Authentication:**
1. Session managed via `useAppSession()` in `src/utils/session.ts`
2. Root route fetches user in `beforeLoad` and passes to context
3. `_authed.tsx` layout checks `context.user`
4. Admin routes check `user.role === 'ADMIN'` in `beforeLoad`

**Path Aliases:**
- `~/` maps to `./src/`

### Database Tables
- `users` — email, password, role (USER/ADMIN)
- `documents` — title, file metadata (S3 key, name, type, size), userId
- `userApiKeys` — hashed keys with prefix, revoke support

### Environment

Create `.env` in project root (see `.env.example`):
- `DATABASE_URL` — PostgreSQL connection string
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` — MinIO/S3
- `SESSION_SECRET` — Session encryption key

### Test Users (after db:seed)
- user@example.com / password123 (USER)
- admin@example.com / password123 (ADMIN)

### Testing

Use Playwright MCP tools to test features in Chrome browser. After implementing UI changes:
1. The dev server is usually already running - try `http://localhost:3000/` first
2. Navigate to the relevant page using `browser_navigate`
3. Interact with elements using `browser_click`, `browser_fill_form`, etc.
4. Verify the expected behavior
5. Close browser when done
