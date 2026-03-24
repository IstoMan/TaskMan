# Taskmanager

Taskmanager is a full-stack app for managing projects, tasks, and team members with role-based access.

- `frontend`: Next.js 16 (App Router) + React 19 + Bun
- `backend`: Go 1.25 + Gin + GORM + SQLite + JWT (cookie-based auth)

## Monorepo Structure

- `frontend/` - UI, auth pages, dashboard, API calls
- `backend/` - REST API, auth middleware, DB models/migrations
- `render.yaml` - Render blueprint for deploying both services

## Quick Start (Local)

### 1) Backend

```bash
cd backend
cp .env.example .env # or create .env manually
go run ./main.go
```

Default URL: `http://localhost:9090`

### 2) Frontend

```bash
cd frontend
cp .env.example .env
bun install
bun run dev
```

Default URL: `http://localhost:3000`

## Environment Variables

### Backend (`backend/.env`)

- `PORT` - API listen port (examples: `9090` or `:9090`)
- `SECRET` - JWT signing secret (required for auth)
- `SQLITE_PATH` - SQLite file path (default: `test.db`)
- `CORS_ALLOWED_ORIGINS` - comma-separated allowed origins (default: `http://localhost:3000`)

The backend now checks whether `.env` exists before loading it. If not found, it relies only on system environment variables.

### Frontend (`frontend/.env`)

- `BACKEND_URL` - backend base URL used by rewrites and server-side auth checks  
  Example: `http://localhost:9090`

## Auth Model

- Login returns an HTTP-only `Authorization` cookie (JWT).
- Browser calls use `/api/*` on the frontend, rewritten to backend `/api/*`.
- Server-rendered auth checks in Next read the cookie and call `${BACKEND_URL}/api/users/me`.

## API Overview

Base path: `/api`

- Public: `GET /health`, `POST /users`, `POST /users/login`
- Authenticated: `GET /users/me`, `POST /users/logout`, `GET /dashboard`, `GET /projects`, `GET /tasks`, `PATCH /tasks/:id`, `GET /members`
- Admin only: `GET /users`, `PATCH /members/:id/title`, `POST /tasks`, `DELETE /tasks/:id`, `POST /projects`, `PATCH /projects/:id`, `DELETE /projects/:id`

For request/response details, see:

- `backend/README.md`
- `backend/docs/API.md`
- `frontend/README.md`

## Deployment (Render)

`render.yaml` provisions:

- `taskmanager-backend` (Docker, persistent disk for SQLite)
- `taskmanager-frontend` (Docker, `BACKEND_URL` sourced from backend service URL)

## Useful Commands

### Backend

```bash
cd backend
go run ./main.go
go build ./...
```

### Frontend (Bun)

```bash
cd frontend
bun install
bun run dev
bun run build
bun run start
bun run lint
```
