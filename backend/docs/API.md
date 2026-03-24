# Backend API Reference

Base URL (local): `http://localhost:9090`  
Base path: `/api`

Auth uses cookie `Authorization` (JWT, HTTP-only).

## Health

### `GET /health`

Response `200`:

```json
{
  "status": "OK",
  "timestamp": "2026-03-24T12:34:56Z"
}
```

## Auth & Users

### `POST /users` (Create user)

Request:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "secret123",
  "role": "admin",
  "member_title": "Engineer"
}
```

Response `201`:

```json
{
  "id": "uuid",
  "name": "Ada Lovelace",
  "role": "admin",
  "member_title": "Engineer",
  "email": "ada@example.com",
  "created_at": "2026-03-24T12:34:56Z"
}
```

### `POST /users/login`

Request:

```json
{
  "email": "ada@example.com",
  "password": "secret123"
}
```

Response `200`:

```json
{
  "message": "Login Successful"
}
```

Side effect: sets `Authorization` cookie.

### `POST /users/logout` (auth required)

Response `200`:

```json
{
  "message": "Logout successful"
}
```

### `GET /users/me` (auth required)

Response `200`:

```json
{
  "user": {
    "id": "uuid",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "role": "admin",
    "member_title": "Engineer"
  }
}
```

### `GET /users` (admin only)

Response `200`:

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "role": "admin",
      "member_title": "Engineer"
    }
  ]
}
```

## Members

### `GET /members` (auth required)

Optional query:

- `member_title=<one allowed title>` (effective for admins)

Response `200`:

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Grace Hopper",
      "email": "grace@example.com",
      "role": "member",
      "member_title": "QA Engineer"
    }
  ],
  "allowed_titles": [
    "Designer",
    "Project Manager",
    "Engineer",
    "QA Engineer",
    "Product Manager",
    "DevOps Engineer"
  ]
}
```

### `PATCH /members/:id/title` (admin only)

Request:

```json
{
  "member_title": "DevOps Engineer"
}
```

Response `200`:

```json
{
  "user": {
    "id": "uuid",
    "name": "Grace Hopper",
    "email": "grace@example.com",
    "role": "member",
    "member_title": "DevOps Engineer"
  }
}
```

## Projects

### `GET /projects` (auth required)

Response `200`:

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Website Redesign",
      "description": "Q2 redesign work",
      "task_count": 8,
      "completed_task_count": 3
    }
  ]
}
```

### `POST /projects` (admin only)

Request:

```json
{
  "name": "Website Redesign",
  "description": "Q2 redesign work"
}
```

Response `201`:

```json
{
  "project": {
    "id": "uuid",
    "name": "Website Redesign",
    "description": "Q2 redesign work",
    "task_count": 0,
    "completed_task_count": 0
  }
}
```

### `PATCH /projects/:id` (admin only)

Request (partial):

```json
{
  "name": "Website Refresh",
  "description": "Updated scope"
}
```

Response `200`:

```json
{
  "project": {
    "id": "uuid",
    "name": "Website Refresh",
    "description": "Updated scope",
    "task_count": 8,
    "completed_task_count": 3
  }
}
```

### `DELETE /projects/:id` (admin only)

Response `202` with empty body.

Notes:

- Tasks in that project are detached first (`project_id` set to `null`), then the project is removed.

## Tasks

### `GET /tasks` (auth required)

Query params:

- `project_id=<uuid>` (optional)
- `limit=<positive int>` (optional)

Behavior:

- Admins see all tasks.
- Members only see tasks assigned to themselves.

Response `200`:

```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Draft wireframes",
      "description": "Initial layout pass",
      "project_id": "uuid",
      "assignee_id": "uuid",
      "deadline": "2026-03-31T17:00",
      "status": "in-progress",
      "project": "Website Redesign",
      "assignee": "Grace Hopper"
    }
  ]
}
```

### `POST /tasks` (admin only)

Request:

```json
{
  "title": "Draft wireframes",
  "description": "Initial layout pass",
  "project_id": "uuid",
  "assignee_id": "uuid",
  "deadline": "2026-03-31T17:00",
  "status": "todo"
}
```

Accepted deadline formats:

- RFC3339 (`2026-03-31T17:00:00Z`)
- `2006-01-02T15:04`
- `2006-01-02 15:04`
- `02/01/2006 03:04 PM`

Accepted status values (normalized internally):

- `todo`, `pending`
- `in-progress`
- `done`, `completed`

Response `201`:

```json
{
  "task": {
    "id": "uuid",
    "title": "Draft wireframes",
    "description": "Initial layout pass",
    "project_id": "uuid",
    "assignee_id": "uuid",
    "deadline": "2026-03-31T17:00",
    "status": "todo",
    "project": "Website Redesign",
    "assignee": "Grace Hopper"
  }
}
```

### `PATCH /tasks/:id` (auth required)

Admin can update any provided fields:

- `title`, `description`, `project_id`, `assignee_id`, `deadline`, `status`

Member restrictions:

- can only update tasks assigned to self
- can only update `status`

Request example:

```json
{
  "status": "done"
}
```

Response `200`:

```json
{
  "task": {
    "id": "uuid",
    "title": "Draft wireframes",
    "description": "Initial layout pass",
    "project_id": "uuid",
    "assignee_id": "uuid",
    "deadline": "2026-03-31T17:00",
    "status": "done",
    "project": "Website Redesign",
    "assignee": "Grace Hopper"
  }
}
```

### `DELETE /tasks/:id` (admin only)

Response `202` with empty body.

## Dashboard

### `GET /dashboard` (auth required)

Response `200`:

```json
{
  "stats": {
    "total_tasks": 10,
    "tasks_done": 4,
    "tasks_in_progress": 3,
    "total_members": 5,
    "total_projects": 2
  },
  "projects": [
    {
      "id": "uuid",
      "name": "Website Redesign",
      "description": "Q2 redesign work",
      "task_count": 8,
      "completed_task_count": 3
    }
  ],
  "recent_tasks": [
    {
      "id": "uuid",
      "title": "Draft wireframes",
      "description": "Initial layout pass",
      "project_id": "uuid",
      "assignee_id": "uuid",
      "deadline": "2026-03-31T17:00",
      "status": "in-progress",
      "project": "Website Redesign",
      "assignee": "Grace Hopper"
    }
  ]
}
```
