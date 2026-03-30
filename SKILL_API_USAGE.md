# Kiipu External Save API

This document describes the API that external tools can use to quickly save content into Kiipu.

## Overview

External tools should use the skill-facing API:

- Base URL (production): `https://api.kiipu.com`
- Primary save endpoint: `POST /skill/posts`
- Authentication: `Authorization: Bearer <API_KEY>`
- Content type: `application/json`

This API creates a post directly under the owner of the API key.

## Authentication

External tools must use a user-created API key.

Request header:

```http
Authorization: Bearer cpk_xxx
Content-Type: application/json
```

Notes:

- The API key is managed by the user in Kiipu.
- The API key is bound to a single Kiipu user.
- Every request made with the key creates or updates content under that user.
- If the key is missing, invalid, or revoked, the API returns `401 Unauthorized`.

Optional validation endpoint:

- `GET /auth/api-key/me`

This can be used by external tools to verify the key before sending content.

Success example:

```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "username": "alice",
    "displayName": "Alice",
    "keyPrefix": "cpk_abcd1234"
  }
}
```

## Create Post

- Method: `POST`
- Path: `/skill/posts`

### Request Body

```json
{
  "requestId": "5fe8f7db-0e93-4e87-85dc-9d4a4e4d4c6d",
  "traceId": "external-tool-run-001",
  "requestedAt": "2026-03-30T10:00:00.000Z",
  "rawText": "Need to remember this idea: turn saved links into weekly notes.",
  "finalText": "Need to remember this idea: turn saved links into weekly notes.",
  "sourceType": "skill_command",
  "visibility": "private",
  "title": "Weekly notes idea",
  "tags": ["idea", "workflow"]
}
```

### Field Rules

- `requestId`: required, UUID, used by the caller for request tracking
- `traceId`: optional, 1 to 128 chars, useful for upstream tracing
- `requestedAt`: optional, ISO 8601 datetime
- `rawText`: required, 1 to 5000 chars
- `finalText`: optional, 1 to 5000 chars; if omitted, Kiipu uses `rawText`
- `sourceType`: optional, one of `skill_command`, `manual`, `imported`; recommended value is `skill_command`
- `visibility`: optional, one of `public`, `unlisted`, `private`; default is `public`
- `title`: optional, string up to 120 chars, can be `null`
- `tags`: optional, array of up to 8 strings, each 1 to 32 chars
- `sourceMessageId`: optional, 1 to 128 chars; can be used by external tools to keep a source-side id

### Success Response

```json
{
  "ok": true,
  "requestId": "5fe8f7db-0e93-4e87-85dc-9d4a4e4d4c6d",
  "data": {
    "id": "post_123",
    "userId": "user_123",
    "sourceType": "skill_command",
    "rawText": "Need to remember this idea: turn saved links into weekly notes.",
    "finalText": "Need to remember this idea: turn saved links into weekly notes.",
    "title": "Weekly notes idea",
    "visibility": "private",
    "status": "published",
    "tags": [
      {
        "tagName": "idea"
      },
      {
        "tagName": "workflow"
      }
    ],
    "createdAt": "2026-03-30T10:00:01.000Z",
    "updatedAt": "2026-03-30T10:00:01.000Z"
  }
}
```

### cURL Example

```bash
curl -X POST "https://api.kiipu.com/skill/posts" \
  -H "Authorization: Bearer cpk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "5fe8f7db-0e93-4e87-85dc-9d4a4e4d4c6d",
    "rawText": "Save this quickly from an external tool.",
    "finalText": "Save this quickly from an external tool.",
    "sourceType": "skill_command",
    "visibility": "private",
    "title": "Quick capture",
    "tags": ["quick-capture"]
  }'
```

## Delete Post

External tools can soft-delete a post.

- Method: `POST`
- Path: `/skill/posts/:id/delete`

Request body:

```json
{
  "requestId": "57d4e317-4b5c-48ea-8860-4667f646a9aa",
  "traceId": "external-tool-delete-001",
  "requestedAt": "2026-03-30T10:05:00.000Z",
  "postId": "post_123"
}
```

Notes:

- The path id must be the target post id.
- The body also includes `postId`; it should match the path id.
- The API also supports `DELETE /skill/posts/:id`, but `POST /skill/posts/:id/delete` is the easiest option for external tools that prefer JSON-only workflows.

Success response:

```json
{
  "ok": true,
  "requestId": "57d4e317-4b5c-48ea-8860-4667f646a9aa",
  "data": {
    "id": "post_123",
    "status": "deleted"
  }
}
```

## Restore Post

- Method: `POST`
- Path: `/skill/posts/:id/restore`

Request body:

```json
{
  "requestId": "76f7f0d9-4f84-4e7c-b0a8-0c7107492c4e",
  "traceId": "external-tool-restore-001",
  "requestedAt": "2026-03-30T10:06:00.000Z",
  "postId": "post_123"
}
```

Success response:

```json
{
  "ok": true,
  "requestId": "76f7f0d9-4f84-4e7c-b0a8-0c7107492c4e",
  "data": {
    "id": "post_123",
    "status": "published"
  }
}
```

## Permanently Delete Post

- Method: `POST`
- Path: `/skill/posts/:id/permanent-delete`

Request body:

```json
{
  "requestId": "7e2ea58f-7f2a-4f50-86ae-9a4a1207d1c2",
  "traceId": "external-tool-purge-001",
  "requestedAt": "2026-03-30T10:07:00.000Z",
  "postId": "post_123"
}
```

Notes:

- Permanent deletion only works after the post has already been soft-deleted.

Success response:

```json
{
  "ok": true,
  "requestId": "7e2ea58f-7f2a-4f50-86ae-9a4a1207d1c2",
  "data": {
    "id": "post_123",
    "permanentlyDeleted": true
  }
}
```

## Error Handling

On validation or business errors, the API returns standard HTTP errors instead of the `ok: false` envelope.

Typical examples:

- `401 Unauthorized`: missing, invalid, or revoked API key
- `404 Not Found`: post does not exist or does not belong to the API key owner
- `409 Conflict`: invalid state transition, for example restoring a non-deleted post
- `400 Bad Request`: invalid request body

Example error response:

```json
{
  "statusCode": 409,
  "code": "post_not_restorable",
  "message": "Only deleted posts can be restored.",
  "error": "ConflictException"
}
```

## Integration Recommendations

- Generate a new UUID for every request and send it as `requestId`.
- Prefer `visibility: "private"` for quick-capture tools unless the user explicitly wants public content.
- Use `traceId` to map Kiipu calls back to upstream jobs, workflows, or message ids.
- Keep `rawText` as the original input and use `finalText` only if the external tool reformats or summarizes the content.
- Save and reuse the returned `data.id` if the external tool also supports delete or restore actions.

## Minimal Contract For Third-Party Tools

If an external tool only needs a minimal quick-save flow, this is enough:

1. Ask the user for a Kiipu API key.
2. Send `POST https://api.kiipu.com/skill/posts`.
3. Include `Authorization: Bearer <API_KEY>`.
4. Send JSON with:
   - `requestId`
   - `rawText`
   - optional `finalText`
   - optional `title`
   - optional `tags`
   - optional `visibility` with recommended value `private`

That is the fastest supported integration path.
