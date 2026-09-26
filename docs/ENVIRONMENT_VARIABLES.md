# Environment Variable Guide

The canonical safe template is `backend/.env.example`. Never commit real values.

## Required backend values
- `DB_URI`: MongoDB connection string.
- `JWT_SECRET_KEY`: at least 32 random characters; use a unique production value.
- `CLIENT_URL`: primary frontend origin.

## Optional multi-origin/CORS
- `CLIENT_URLS`: comma-separated additional approved origins.
- `COOKIE_DOMAIN`, `COOKIE_SAME_SITE`, `COOKIE_EXPIRE`: cookie policy controls.

## Email
- `SMTP_SERVICE` or `SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`.
- `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.

## Cloudinary
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER`.

## Razorpay
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
Keep these blank until the payment phase. Never put the key secret or webhook secret in Vite public frontend variables.

## Frontend
- `VITE_API_URL`: public backend API base URL only.

## Operational values
Database pool/timeouts, request/body limits, DNS override, logging, pricing and performance-harness variables are documented directly in `backend/.env.example`.
