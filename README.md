# recs.me

A platform to connect with people and share recommendations — movies, books, places, trips, and everything in between.

## Tech Stack

- **Framework:** React + TypeScript (Vite)
- **Styling:** Tailwind CSS v4 + shadcn/ui (base-nova style)
- **Forms:** React Hook Form + Yup validation
- **State Management:** Redux Toolkit
- **Routing:** React Router DOM (v6 `createBrowserRouter`)

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command         | Description                |
| --------------- | -------------------------- |
| `npm run dev`   | Start dev server           |
| `npm run build` | Type-check + production build |
| `npm run lint`  | Run ESLint                 |
| `npm run preview` | Preview production build |

---

## Folder Structure

```
src/
├── assets/              # Static assets (images, icons as React components)
├── components/
│   ├── common/          # Reusable UI components (Tooltip, PasswordInput, etc.)
│   ├── forms/           # Form components grouped by feature domain
│   │   └── auth/
│   │       ├── EmailEntryForm.tsx
│   │       ├── OtpVerifyForm.tsx
│   │       └── schema.ts
│   └── shad/            # shadcn/ui primitives (aliased as @/components/shad)
├── lib/
│   └── utils.ts         # cn helper (clsx + tailwind-merge)
├── pages/               # Page-level components (one per route)
├── router/
│   └── index.tsx        # All route definitions (createBrowserRouter)
├── store/               # Redux store + feature slices
│   ├── store.ts
│   └── <feature>/       # types.ts, initialState.ts, slice.ts, index.ts
├── utils/
│   ├── constants/       # ROUTES, AUTH_TEXT, etc.
│   └── methods/         # Shared utility functions
├── App.tsx              # Root component (Provider + RouterProvider)
├── main.tsx             # Entry point
└── index.css            # Global styles + Tailwind + CSS variables (theme)
```

---

## Coding Standards

### shadcn/ui Components (`components/shad/`)

- Live in `src/components/shad/`, **not** `src/components/ui/`.
- Configured in `components.json` → `"ui": "@/components/shad"`.
- Enhanced with React Hook Form integration — `Input`, `Select`, `Textarea` accept `isHookForm`, `control`, `name`, `showErrorInIcon`, `startIcon`, `endIcon` props.
- Import from `@/components/shad/*`.

### Forms (`components/forms/<feature>/`)

- Each domain gets its own folder with form component(s) + `schema.ts`.
- `schema.ts` defines reusable field fragments, composed schemas, and inferred types via `yup.InferType<>`.
- Use yup `.when("$context")` for conditional validation (e.g., signup vs signin).
- Forms do not manage page layout — they are composed into page components.
- Validation logic lives **only** in `schema.ts`.

### Pages (`pages/`)

- One file per route/screen (e.g., `Auth.tsx`, `Home.tsx`).
- Handle layout, params, guards, redirects — compose form/common components.
- Only pages are imported by the router.

### Routing (`router/`)

- All routes in `src/router/index.tsx` using `createBrowserRouter`.
- Route paths reference constants from `@/utils/constants`.
- Consumed in `App.tsx` via `<RouterProvider />`.

### Redux Store (`store/`)

- `store.ts` — `configureStore` + typed hooks (`useAppDispatch`, `useAppSelector`).
- Per-feature: `types.ts`, `initialState.ts`, `slice.ts`, `index.ts` (barrel).

### Utilities (`utils/`)

- `constants/` — App-wide constants (`ROUTES`, `AUTH_TEXT`, etc.) with `as const`.
- `methods/` — Pure shared helper functions.

### Common Components (`components/common/`)

- Reusable UI not tied to shadcn or a specific feature (e.g., `Tooltip`, `PasswordInput`).

---

## Conventions

| Convention       | Standard                                                    |
| ---------------- | ----------------------------------------------------------- |
| Component naming | PascalCase (`AuthPage`, `EmailForm`)                        |
| File naming      | PascalCase for components, kebab-case for shadcn            |
| Exports          | `export default` for page/form components                   |
| Path aliases     | `@/` maps to `src/` — always use aliases, never `../../../` |
| CSS              | Tailwind utility classes only, no CSS modules               |
| Theme            | CSS variables in `index.css`, referenced via Tailwind       |
| Icons            | Lucide React — custom SVGs in `src/assets/icons.tsx`        |
| TypeScript       | No `any` — use proper types or targeted assertions          |
| SVGs             | Never inline — keep in `src/assets/` as React components    |

## Fonts

| Token         | Font                | Class       |
| ------------- | ------------------- | ----------- |
| `--font-sans` | Geist Variable      | `font-sans` |
| `--font-mono` | Geist Mono Variable | `font-mono` |

**Geist (sans)** — default for all UI text.
**Geist Mono** — OTP inputs, countdowns, prices, code, stats, keyboard shortcuts.

> If the content is numeric, technical, or benefits from fixed-width alignment, use `font-mono`. Everything else stays on `font-sans`.
