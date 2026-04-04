# API Conventions

## REST Endpoints

- Use plural nouns for resources: `/api/sessions`, `/api/agents`.
- Use HTTP methods correctly: GET (read), POST (create), PUT (full replace), PATCH (partial update), DELETE.
- Nest sub-resources: `/api/sessions/:sessionId/utterances`.
- Use kebab-case for multi-word paths: `/api/voice-sessions`.

## Request/Response

- All request bodies validated with Zod at the handler boundary.
- All responses use a consistent envelope:

```json
{
  "data": { ... },
  "error": null
}
```

- Error responses:

```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Session not found"
  }
}
```

## Status Codes

- `200` — Success (GET, PUT, PATCH).
- `201` — Created (POST).
- `204` — No content (DELETE).
- `400` — Bad request (validation failure).
- `401` — Unauthorized (missing/invalid auth).
- `403` — Forbidden (valid auth, insufficient permissions).
- `404` — Not found.
- `409` — Conflict (duplicate, stale update).
- `422` — Unprocessable entity (valid syntax, invalid semantics).
- `500` — Internal server error (unexpected).

## Versioning

<!-- TODO: Choose versioning strategy -->
- URL prefix: `/api/v1/...`
- Or header-based: `Accept: application/vnd.voiceagent.v1+json`

## Rate Limiting

<!-- TODO: Define rate limits per endpoint tier -->
- Standard: 100 req/min
- Auth endpoints: 10 req/min
- Webhooks: 1000 req/min

## Authentication

<!-- TODO: Define auth mechanism -->
- Bearer token in `Authorization` header.
- API keys for service-to-service calls.
