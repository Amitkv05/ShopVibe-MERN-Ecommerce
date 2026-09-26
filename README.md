# MERN E-Commerce Production Release

This package combines the audited Node/Express/MongoDB backend and the ReactJS/Vite customer + admin frontend.

## Stack

- MongoDB + Mongoose
- Express.js + Node.js
- ReactJS + Vite
- JavaScript / JSX only on the frontend
- Zustand + Tailwind CSS

No Next.js or TypeScript is used in the frontend.

## First local verification

1. Keep your real backend `.env` outside source control and copy it into `backend/.env` locally.
2. Keep `frontend/.env` limited to browser-safe values such as `VITE_API_URL`.
3. From the project root run:

```bash
npm install
npm run check
npm test
npm run build
```

4. Start both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:8000`

## Workspaces

```text
backend/   Express + MongoDB API
frontend/  ReactJS + Vite SPA
shared/    frozen API contract
docs/      deployment, UAT and release guidance
```
