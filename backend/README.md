# Backend Documentation

Go API service for Taskmanager.

- Framework: Gin
- ORM: GORM
- DB: SQLite
- Auth: JWT in HTTP-only cookie (`Authorization`)

## Requirements

- Go `1.25+`

## Run Locally

```bash
cd backend
cp .env.example .env
go run ./main.go
```

Server listens on `0.0.0.0:${PORT}` (default `:8080` when `PORT` is unset).

## Environment Variables

- `PORT` - API port (`9090` or `:9090` accepted; default `8080`)
- `SECRET` - JWT signing key for login/auth middleware (required)
- `SQLITE_PATH` - SQLite file path (default `test.db`)
- `CORS_ALLOWED_ORIGINS` - comma-separated allowed origins

Example:

```env
PORT=:9090
SECRET=replace_me
SQLITE_PATH=test.db
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Notes:

- `.env` is loaded only when it exists in the working directory.
- If `.env` is missing, the app uses process-level environment variables only.

## Database & Models

On startup, the backend runs auto-migrations for:

- `User`
- `Project`
- `Task`

SQLite defaults to `test.db` in `backend/` unless `SQLITE_PATH` is set.

## Authentication & Authorization

- Login endpoint signs JWT with `SECRET` and sets `Authorization` cookie.
- `AuthMiddleware` reads and validates the cookie.
- `AdminMiddleware` requires claim `role = "admin"`.

### Roles

- `admin`
- `member`

### Member title whitelist

Accepted values:

- `Designer`
- `Project Manager`
- `Engineer`
- `QA Engineer`
- `Product Manager`
- `DevOps Engineer`
- empty string (`""`) is allowed

## CORS

Configured by `CORS_ALLOWED_ORIGINS` (comma-separated list).

- Defaults to `http://localhost:3000` if unset/empty.
- Credentials are enabled (`AllowCredentials: true`) so browser cookie auth works.

## API Endpoints

Base path: `/api`

### Public

- `GET /health`
- `POST /users`
- `POST /users/login`

### Authenticated

- `GET /users/me`
- `POST /users/logout`
- `GET /dashboard`
- `GET /projects`
- `GET /tasks`
- `PATCH /tasks/:id`
- `GET /members`

### Admin only

- `GET /users`
- `PATCH /members/:id/title`
- `POST /tasks`
- `DELETE /tasks/:id`
- `POST /projects`
- `PATCH /projects/:id`
- `DELETE /projects/:id`

See full request/response examples in `backend/docs/API.md`.

## Docker

The production image:

- Builds a Go binary in `golang:1.25-alpine`
- Runs it in `alpine:3.22`
- Exposes port `10000`

Build/run:

```bash
cd backend
docker build -t taskmanager-backend .
docker run --rm -p 10000:10000 \
  -e PORT=10000 \
  -e SECRET=replace_me \
  -e SQLITE_PATH=/app/test.db \
  taskmanager-backend
```
