# LiveLec API Contracts

Base URL for local development: `http://localhost:8000`

All JSON endpoints use `Content-Type: application/json`. Teacher endpoints require:

```http
Authorization: Bearer <access_token>
```

## Health

`GET /health`

```json
{
  "status": "ok",
  "service": "LiveLec API"
}
```

## Teacher Auth

### Register

`POST /api/auth/register`

```json
{
  "email": "teacher@example.com",
  "name": "Ivan Petrov",
  "password": "secure123"
}
```

### Login

`POST /api/auth/token`

```json
{
  "email": "teacher@example.com",
  "password": "secure123"
}
```

Response:

```json
{
  "access_token": "jwt",
  "token_type": "bearer"
}
```

### Current Teacher

`GET /api/auth/me`

## Lectures

### Create Lecture

Teacher only.

`POST /api/lectures/`

```json
{
  "title": "Database Architecture: ACID",
  "discipline": "Databases"
}
```

Response:

```json
{
  "id": 1,
  "teacher_id": 1,
  "title": "Database Architecture: ACID",
  "discipline": "Databases",
  "pin_code": "481516",
  "status": "waiting",
  "created_at": "2026-05-18T12:00:00Z"
}
```

### List Teacher Lectures

Teacher only.

`GET /api/lectures/`

### Get Teacher Lecture

Teacher only.

`GET /api/lectures/{lecture_id}`

### Start Lecture

Teacher only.

`POST /api/lectures/{lecture_id}/start`

Sets `status` to `active` and broadcasts a `LECTURE_STATUS` WebSocket event.

### Finish Lecture

Teacher only.

`POST /api/lectures/{lecture_id}/finish`

Sets `status` to `finished` and broadcasts a `LECTURE_STATUS` WebSocket event.

### Student Join By PIN

No auth required.

`POST /api/lectures/join`

```json
{
  "pin_code": "481516"
}
```

Response:

```json
{
  "lecture_id": 1,
  "title": "Database Architecture: ACID",
  "discipline": "Databases",
  "pin_code": "481516",
  "status": "active",
  "questions": []
}
```

## Questions

### Create Question

No auth required.

`POST /api/questions/`

```json
{
  "lecture_id": 1,
  "content": "Can you explain isolation again?"
}
```

Creates the question and broadcasts `NEW_QUESTION`.

### List Lecture Questions

No auth required.

`GET /api/questions/lecture/{lecture_id}`

### Like Question

No auth required.

`POST /api/questions/{question_id}/like`

Broadcasts `LIKE_UPDATE`.

## Analytics

### Student Confusion Click

No auth required.

`POST /api/analytics/confusion`

```json
{
  "lecture_id": 1
}
```

Response:

```json
{
  "status": "recorded",
  "total_confusion_count": 3
}
```

Broadcasts `CONFUSION_UPDATE` to teachers.

## WebSocket

Connect:

```text
ws://localhost:8000/ws/{pin_code}?user_type=student
ws://localhost:8000/ws/{pin_code}?user_type=teacher
```

Server confirms:

```json
{
  "type": "CONNECTED",
  "data": {
    "lecture_id": 1,
    "pin_code": "481516",
    "user_type": "student",
    "title": "Database Architecture: ACID",
    "discipline": "Databases",
    "status": "active"
  }
}
```

Client messages:

```json
{ "type": "PING" }
{ "type": "NEW_QUESTION", "data": { "content": "Question text" } }
{ "type": "LIKE_QUESTION", "data": { "question_id": 1 } }
{ "type": "CONFUSION_CLICK", "data": {} }
{ "type": "SLIDE_CHANGE", "data": { "slide_number": 2 } }
```

Server events:

```json
{ "type": "PONG" }
{ "type": "PARTICIPANTS_UPDATE", "data": { "count": 12 } }
{ "type": "LECTURE_STATUS", "data": { "lecture_id": 1, "status": "active" } }
{ "type": "NEW_QUESTION", "data": { "id": 1, "lecture_id": 1, "content": "Question text", "likes_count": 0, "is_answered": false, "created_at": "2026-05-18T12:00:00Z" } }
{ "type": "LIKE_UPDATE", "data": { "question_id": 1, "likes_count": 2 } }
{ "type": "CONFUSION_UPDATE", "data": { "lecture_id": 1, "confusion_count": 1, "total_confusion_count": 3 } }
{ "type": "SLIDE_CHANGE", "data": { "slide_number": 2 } }
```
