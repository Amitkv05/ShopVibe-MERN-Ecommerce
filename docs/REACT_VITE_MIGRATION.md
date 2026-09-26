# ReactJS + Vite Migration

## Completed

- Replaced the frontend framework shell with ReactJS + Vite.
- Converted frontend source from TypeScript/TSX to JavaScript/JSX.
- Removed the old framework config, app-router directory and framework-specific dependencies.
- Preserved the audited API client, Zustand store, customer screens, admin modules and backend API contract.
- Replaced the public API environment variable with `VITE_API_URL`.
- Added persistent light/dark mode with a reusable provider and toggle.
- Centralized generic reusable UI components in `frontend/src/components/reusable/`.
- Added Vite SPA production deployment using Nginx fallback routing.
- Updated integration checks to validate the React/Vite structure.

## Validation completed in the migration environment

- Pure React/Vite structure check: PASS.
- TypeScript source files: 0.
- Framework-specific dependencies/config files: 0.
- Frontend integration/static contract checks: 39/39 PASS.
- Shared/backend/frontend API contract check: PASS.
- Release-readiness static gate: PASS.
- JavaScript/JSX syntax parse: PASS.
- Local alias/relative import resolution scan: PASS.

## Final local dependency-backed verification

The migration environment could not reach the npm registry (`EAI_AGAIN`), so dependency installation and the Vite production build must be run on the local development PC:

```bash
npm install
npm run check
npm test
npm run build
```

Then run:

```bash
npm run dev
```

and continue the browser smoke-test / Lighthouse phase.
