# API Guide

Base prefix: `/api/v1`.

Live documentation:
- Swagger UI: `/api/v1/docs`
- OpenAPI JSON: `/api/v1/openapi.json`

The release contains 69 contract entries synchronized across:
- `shared/api-contract.json`
- `backend/docs/api-contract.json`
- `frontend/src/lib/api-contract.json`

Run `npm run check:contract` to detect route/contract drift and `npm run check:api-freeze` to detect frozen route/request/response contract drift.

Authentication uses an HttpOnly cookie. Browser requests that need authentication must send credentials. Authorization remains server-side; admin endpoints require the admin role.
