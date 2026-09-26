# ShopVibe React/Vite UI & Admin Feature Update

Date: 2026-09-25

## Included changes

- Replaced bare browser globals such as `alert()` and `confirm()` with `window.alert()` / `window.confirm()` so the frontend `no-undef` gate does not report them as undefined.
- Catalog navigation now has only **Shop**, **New Arrivals**, and **Categories**, each with its own route and active state.
- Added persisted homepage banner management:
  - image upload
  - badge/title/subtitle/button text
  - CTA destination
  - active/sort order
  - overlay darkness
  - draggable text position in the live preview
- Added Category Image and Category Icon uploads to admin category create/edit.
- Replaced the admin product Variants JSON workflow with Simple Product / Product with Variants UI.
- Added **Default stock per variant** before variant generation; generated combinations receive the default value and remain individually editable.
- Removed the standalone Media item from visible admin navigation. Cloudinary media upload/delete endpoints remain as shared infrastructure used inside Products, Categories, and Banners.
- Category public data now exposes uploaded category image/icon to the React UI.
- Added public/admin Banner APIs and updated the API contract/freeze baseline to revision 3.

## Verification completed in the audit environment

- Pure React/Vite static gate: PASS
- TypeScript/Next.js prohibition: PASS
- JS/JSX parse check: PASS
- Backend JavaScript syntax check: PASS
- Frontend integration checks: 46/46 PASS
- Shared/backend/frontend API contract synchronization: PASS
- API freeze baseline: PASS — revision 3, 74 routes/contract entries
- Release-readiness static gate: PASS

Dependency-backed ESLint, backend tests, and Vite production build should still be rerun after `npm install` on the local development machine.
