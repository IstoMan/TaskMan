# Frontend Documentation

Next.js 16 frontend for Taskmanager.

- Framework: Next.js (App Router)
- Runtime/tooling: Bun
- UI: React 19 + shadcn/ui components

## Requirements

- Bun `1.x`
- Running backend API (default `http://localhost:9090`)

## Run Locally

```bash
cd frontend
cp .env.example .env
bun install
bun run dev
```

App URL: `http://localhost:3000`

## Environment Variables

### `BACKEND_URL`

Backend base URL used in two places:

1. `next.config.ts` rewrite of `/api/:path*` -> `${BACKEND_URL}/api/:path*`
2. Server components (`app/page.tsx`, `app/dashboard/layout.tsx`) for auth checks

Default when unset: `http://localhost:9090`

Example `.env`:

```env
BACKEND_URL=http://localhost:9090
```

## Scripts (Bun)

- `bun run dev` - start development server
- `bun run build` - production build
- `bun run start` - run production server
- `bun run lint` - ESLint checks

## Authentication Flow

- Signup/login pages call `/api/users` and `/api/users/login`.
- Next rewrite proxies those to backend `/api/...`.
- Backend sets HTTP-only `Authorization` cookie.
- Protected pages read cookie server-side and call `/api/users/me`.
- Missing/invalid auth redirects user to `/login`.

## Route Overview

- `/login` - login form
- `/signup` - account creation
- `/dashboard` - authenticated dashboard
- `/dashboard/projects` - projects management
- `/dashboard/tasks` - tasks management
- `/dashboard/members` - members management

Legacy redirects are handled:

- `/auth/login` -> `/login`
- `/auth/signup` -> `/signup`

## API Usage in Frontend

Main API client: `lib/api.ts`

- uses `fetch("/api...")`
- always sends credentials (`credentials: "include"`)
- normalizes backend status values (`pending/completed` to `todo/done`)

Primary methods include:

- `getDashboard`, `getProjects`, `createProject`, `updateProject`, `deleteProject`
- `getTasks`, `createTask`, `updateTask`
- `getMembers`, `updateMemberTitle`
- `getCurrentUser`, `logout`

## Docker

The container:

- builds with `oven/bun:1`
- runs with `oven/bun:1-slim`
- exposes port `10000`

Build/run:

```bash
cd frontend
docker build -t taskmanager-frontend .
docker run --rm -p 10000:10000 \
  -e PORT=10000 \
  -e BACKEND_URL=http://host.docker.internal:9090 \
  taskmanager-frontend
```

## Additional Docs

- `../README.md` (repo-level quickstart)
- `docs/ARCHITECTURE.md` (frontend internals)
