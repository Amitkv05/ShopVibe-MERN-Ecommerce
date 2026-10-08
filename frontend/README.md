# ShopVibe ReactJS + Vite Frontend

This is the ShopVibe customer and admin UI connected to the audited Express/MongoDB backend.

- Framework: ReactJS + Vite
- Language: JavaScript / JSX only
- Styling: Tailwind CSS
- State: Zustand
- Local frontend: `http://localhost:5173`
- Default local API: `http://localhost:8000/api/v1`
- Authentication: backend HttpOnly cookie; browser requests use `credentials: include`
- Theme: persistent light/dark mode with system preference as the initial default
- Reusable generic components: `src/components/reusable/`

There is no Next.js and no TypeScript in this frontend.

## Environment

Copy `.env.example` to `.env` only when the API URL needs to change:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Only browser-safe public values belong in `VITE_*`. Never put backend secrets there.

## Commands

```bash
npm run dev
npm run check:integration
npm run check
npm run build
npm run preview
```

## Main structure

```text
src/
  components/
    reusable/    # Button, Input, Badge, Toast, StarRating, theme components
    layout/      # Navbar, Footer
    product/     # Product-specific reusable UI
    admin/       # Admin-domain reusable modules
  screens/       # Page-level screens
  lib/           # API client, store and data adapters
  styles/        # Global/theme styles
  App.jsx
  main.jsx
```

## Latest UX repair pass
See `UX_FIX_PASS_V4.md` for the latest checkout simplification, home catalog-state fix, Shop/Admin Calendar removal, premium admin forms, optional banner copy/CTA, cart rebuild, and ShopVibe-colored login refresh.
