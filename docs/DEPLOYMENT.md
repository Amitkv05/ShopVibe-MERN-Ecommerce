# Deployment Guide

## Backend

The backend is a long-running Node.js service. Deploy the `backend/` folder to a Node/container host. The included Dockerfile exposes port 8000. Configure environment variables in the hosting platform; do not upload `.env`.

Required production properties:
- `NODE_ENV=production`
- HTTPS frontend origin in `CLIENT_URL`/`CLIENT_URLS`
- production MongoDB Atlas URI
- strong JWT secret
- production SMTP and Cloudinary values
- Razorpay values only when the payment phase is approved

Health endpoints:
- `/api/v1/health`
- `/api/v1/health/live`
- `/api/v1/health/ready`

## Frontend

The frontend is a ReactJS/Vite single-page application. Build with `npm run build --workspace frontend`. Set `VITE_API_URL` to the deployed backend `/api/v1` URL at build time. The included production Dockerfile builds static assets and serves them with Nginx using SPA fallback routing.

## Staging sequence

1. Deploy backend with staging Atlas/SMTP/Cloudinary and staging frontend URL.
2. Confirm `/health/ready` is 200.
3. Deploy frontend with staging API URL.
4. Confirm HTTPS and credentialed CORS.
5. Configure Razorpay Test Mode and staging webhook only when ready.
6. Run `STAGING_API_BASE_URL=https://.../api/v1 npm run smoke:staging`.
7. Complete `UAT_CHECKLIST.md`.

## Production sequence

Repeat the staging process with production-owned services and secrets, then follow `LAUNCH_RUNBOOK.md`. Do not copy staging secrets into production.
