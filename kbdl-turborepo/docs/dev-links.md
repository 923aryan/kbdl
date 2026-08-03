# Useful links (local / Azure)

Replace `localhost` with your Azure VM public IP when testing remotely (and open NSG ports as needed).

Seed logins: [seed-logins.md](./seed-logins.md)

## API / docs

| What | URL |
|------|-----|
| Health check | http://localhost:8000/health |
| Swagger UI | http://localhost:8000/api/docs |
| OpenAPI YAML | http://localhost:8000/api/docs/openapi.yaml |
| OpenAPI JSON | http://localhost:8000/api/docs/openapi.json |
| API base | http://localhost:8000/api/v1 |

## Apps (host / PM2)

| App | URL |
|-----|-----|
| Employer | http://localhost:3002 |
| Admin | http://localhost:3000 |
| Landing | http://localhost:3003 |
| Backend API | http://localhost:8000 |

### Employer → API host

Set in `apps/kbdl-employer/.env.local` (or `.env.development`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
# or Azure Docker backend:
# NEXT_PUBLIC_API_URL=http://20.197.60.119:8000/api/v1
```

Used by `apps/kbdl-employer/src/lib/api-client.ts`. Restart `next dev` after changes.

## Auth (Postman / Swagger)

| Flow | Method + path |
|------|----------------|
| Employer send OTP | `POST /api/v1/auth/employer/send-otp` |
| Employer verify OTP | `POST /api/v1/auth/employer/verify-otp` |
| User (worker) send OTP | `POST /api/v1/auth/user/send-otp` |
| User verify OTP | `POST /api/v1/auth/user/verify-otp` |

## Related docs in repo

| Doc | Path |
|-----|------|
| Seed logins | [seed-logins.md](./seed-logins.md) |
| Docker stack | [docker.md](./docker.md) |
| Data model + SQL | [data-model-and-queries.md](./data-model-and-queries.md) |
| OpenAPI source file | `apps/kbdl-backend/docs/openapi.yaml` |
