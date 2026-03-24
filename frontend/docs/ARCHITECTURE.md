# Frontend Architecture Notes

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Bun package/runtime tooling
- shadcn/ui components

## High-Level Flow

1. User opens frontend routes (`/login`, `/signup`, `/dashboard/*`).
2. Browser-side API calls target `/api/...`.
3. Next rewrite proxies `/api/:path*` to `${BACKEND_URL}/api/:path*`.
4. Backend authenticates via HTTP-only `Authorization` cookie.
5. Dashboard server components also verify auth by calling backend directly.

## Key Directories

- `app/` - routes/layouts/pages
- `components/` - UI and dashboard components
- `lib/api.ts` - typed frontend API client
- `lib/types.ts` - domain model types
- `lib/user-context.tsx` - authenticated user context provider

## Authentication Details

- Login page posts credentials to `/api/users/login`.
- Signup page posts to `/api/users`.
- Backend sets cookie `Authorization`.
- `app/page.tsx` and `app/dashboard/layout.tsx`:
  - read cookie via `next/headers`
  - call `${BACKEND_URL}/api/users/me`
  - redirect to `/login` when auth is missing/invalid

## API Client (`lib/api.ts`)

Design choices:

- all requests include `credentials: "include"`
- JSON request/response handling is centralized
- non-2xx responses throw `ApiError`
- domain mapping converts backend payloads to frontend types
- task status values are normalized:
  - backend `pending` -> frontend `todo`
  - backend `completed` -> frontend `done`

## State Strategy

- Data fetching is request-driven with `fetch`.
- Authenticated user is shared through `UserProvider`.
- Dashboard screens fetch and mutate via `lib/api.ts`.

## Routing & Access

- Public routes: `/login`, `/signup`
- Protected routes: `/dashboard`, `/dashboard/projects`, `/dashboard/tasks`, `/dashboard/members`
- Redirects:
  - `/auth/login` -> `/login`
  - `/auth/signup` -> `/signup`

## Environment Contract

- `BACKEND_URL` must point to reachable backend origin.
- Frontend defaults to `http://localhost:9090` when unset.
- In deployed environments, set `BACKEND_URL` explicitly (Render does this via `render.yaml`).
