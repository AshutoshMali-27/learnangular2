# NRI Onboarding Web – Manual Build Guide

How to rebuild the `nri-onboarding-web` POC by hand, starting from an empty React project, so that you understand every line.

**How to use this guide**

* The POC in `nri-onboarding-web/` is your **answer key**. Every step below names the POC file it corresponds to.
* Rule: **type, never paste.** Read the POC file, close it, write your own version, then compare. Pasting gives you the app but not the experience.
* Build in the order given. Each phase ends with something you can run and see. Do not start a phase until the previous one works.
* Screen behaviour (fields, validations, API payloads) is in `Docs/UI/*.md` and `Docs/API/*.md`. Read the matching doc before building each screen.

---

## 1. What you are building

| Area | Screens |
|---|---|
| Auth | Login (user id + password) → OTP → session |
| Shell | Sidebar menu, top bar, light/dark mode, 7 colour themes |
| Account-opening journey | Form number entry → 10 stages: Inward, Address, Holder, FATCA, Proof, Nominee, Miscellaneous, Extra Details, Brokerage, Bank Details → Complete |
| Objections | Objection list → hub per form → reopen a stage to correct it |
| Operations | Allocated Forms, PDF Upload, Send Liveliness Link, Courier |
| Reports | In-process Forms, MIS Report, Account Status search + detail |
| Dashboard | Counts and pipeline (the POC has 5 layout variants; build one) |

Size of the POC: **215 TypeScript files, about 18,400 lines** (including about 560 lines of CSS, 800 lines of mock data and 1,000 lines of tests).

**Important fact about the POC:** login, masters and the whole journey run on **mock data** (`*.mock.ts`). The real API layer (`src/api/`) is fully written, but the `services.ts` files resolve from mocks. Connecting to the real backend is a separate piece of work (see Phase 17).

---

## 2. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript 6 (strict flags on) | Catches payload and prop mistakes at compile time |
| UI library | React 19 | – |
| Build tool / dev server | Vite 8 | Fast dev server, proxy to the MVC backend, env files |
| Routing | React Router 7 (`createBrowserRouter`, lazy routes) | Nested layouts, one chunk per page |
| Server state | TanStack Query 5 | Caching, loading/error states, master data fetched once |
| Client state | Redux Toolkit 2 + React Redux 9 | Only for UI preferences and unsaved stage drafts |
| Forms | React Hook Form 7 | Uncontrolled performance, `FormProvider` for nested fields |
| Validation | Zod 4 + `@hookform/resolvers` | One schema = validation rules + TypeScript type |
| HTTP | Axios | Interceptors for anti-forgery token, 401 handling, error envelopes |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) | Utility classes, theme through CSS variables |
| UI primitives | shadcn/ui (source copied into `src/components/ui`) on top of Radix UI | Accessible dialog, select, popover; you own the code |
| Variants | class-variance-authority | Button / badge variants |
| Class merging | `cn` package (drop-in for `clsx` + `tailwind-merge`) | Merge conditional Tailwind classes |
| Tables | TanStack Table 8 | Sorting, filtering, pagination for report grids |
| Icons | lucide-react | – |
| Toasts | sonner | – |
| Command list | cmdk | Searchable combobox |
| Image crop | react-easy-crop | Crop before uploading proof documents |
| Font | Geist Variable (`@fontsource-variable/geist`) | – |
| Tests | Vitest | Unit tests for rules, mappers, schemas |
| Lint | oxlint | Fast linter, React hooks rules |

**State rule to remember for the whole project:** anything that comes from the server lives in TanStack Query. Redux holds only what the server does not know: theme, sidebar state, and unsaved stage drafts. Form field values live in React Hook Form.

---

## 3. Prerequisites

* Node.js 22 LTS or newer, npm 10+
* VS Code with the extensions: Tailwind CSS IntelliSense, ESLint or Oxc, Pretty TypeScript Errors
* Browser extensions: React Developer Tools, Redux DevTools
* Knowledge you should have before you start (spend 3–5 days on these first if you are not comfortable):
  * TypeScript generics, `interface` vs `type`, `as const`, `satisfies`
  * React hooks: `useState`, `useEffect`, `useContext`, `useId`, `useSyncExternalStore`
  * Promises and `async/await`

---

## 4. Packages – complete list

You already have an empty React project. If it was not created with Vite + TypeScript, recreate it:

```bash
npm create vite@latest nri-onboarding-web -- --template react-ts
cd nri-onboarding-web
npm install
```

Install packages **when the phase needs them**, not all at once. That way you know why each one is there. The full list, grouped by phase:

```bash
# Phase 1 – styling
npm i -D tailwindcss @tailwindcss/vite @types/node
npm i tw-animate-css @fontsource-variable/geist lucide-react class-variance-authority cn

# Phase 1 – shadcn/ui (adds: shadcn, radix-ui; later cmdk and sonner through `add`)
npx shadcn@latest init

# Phase 2 – data layer
npm i axios @tanstack/react-query
npm i -D @tanstack/react-query-devtools

# Phase 2 – client state
npm i @reduxjs/toolkit react-redux

# Phase 3 – routing
npm i react-router-dom

# Phase 4 – forms and validation
npm i react-hook-form zod @hookform/resolvers

# Phase 6 – tables, crop
npm i @tanstack/react-table react-easy-crop

# Phase 2 onwards – tests
npm i -D vitest
```

Final `package.json` should match the POC:

| Runtime dependency | Version in POC |
|---|---|
| react, react-dom | ^19.2.8 |
| react-router-dom | ^7.18.4 |
| @tanstack/react-query | ^5.104.1 |
| @tanstack/react-table | ^8.21.3 |
| @reduxjs/toolkit | ^2.13.0 |
| react-redux | ^9.3.0 |
| react-hook-form | ^7.89.0 |
| @hookform/resolvers | ^5.9.1 |
| zod | ^4.6.5 |
| axios | ^1.20.0 |
| radix-ui | ^1.7.0 |
| shadcn | ^4.21.4 |
| class-variance-authority | ^0.7.1 |
| cn | ^0.4.0 |
| cmdk | ^1.1.1 |
| sonner | ^2.0.8 |
| lucide-react | ^1.54.0 |
| react-easy-crop | ^6.2.4 |
| tw-animate-css | ^1.4.0 |
| @fontsource-variable/geist | ^5.3.0 |

| Dev dependency | Version in POC |
|---|---|
| vite | ^8.3.0 |
| @vitejs/plugin-react | ^6.1.1 |
| typescript | ~6.0.2 |
| tailwindcss, @tailwindcss/vite | ^4.3.3 |
| @tanstack/react-query-devtools | ^5.104.1 |
| @types/node | ^24.19.1 |
| @types/react, @types/react-dom | ^19.2.x |
| vitest | ^5.0.3 |
| oxlint | ^1.81.0 |

**Do not install** `@base-ui/react` and `next-themes`. They are in the POC's `package.json` but no file imports them.

Scripts to have in `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "typecheck": "tsc -b",
  "lint": "oxlint",
  "test": "vitest run",
  "preview": "vite preview"
}
```

---

## 5. Target folder structure

```
src/
  main.tsx              entry: renders <App />
  App.tsx               <Providers><RouterProvider/></Providers>
  Providers.tsx         Redux store, QueryClient, DialogHost, Toaster
  index.css             Tailwind import + theme tokens (CSS variables)
  vite-env.d.ts         types for import.meta.env

  config/environment.ts ENV + every API endpoint path (single source of truth)

  api/                  HTTP layer – knows nothing about features
    axios.ts            axios instance
    interceptor.ts      anti-forgery header, failure envelopes, 401 handler
    api-response.ts     readFailure(body): detects "HTTP 200 but failed"
    error.ts            ApiError, toApiError, getErrorMessage
    client.ts           http.get / postJson / postRawString / postForm / postModel / upload
    queryClient.ts      QueryClient defaults
    index.ts            public exports

  store/                Redux – client state only
    store.ts, hooks.ts
    slices/uiSlice.ts       mode, theme, sidebar
    slices/draftsSlice.ts   wizard step + unsaved record lists per stage

  routes/
    router.tsx          all routes, lazy loaded
    ProtectedRoute.tsx  redirects to /login when there is no session

  layout/
    mainLayout.tsx      sidebar + top bar + <Outlet/>
    menu.ts             menu as data

  lib/                  pure helpers, no React components
    utils.ts (cn), validators.ts, dates.ts, names.ts,
    dialog-service.ts, export-csv.ts, crop-image.ts, useUrlFilters.ts

  components/
    ui/                 shadcn primitives (button, input, select, dialog…)
    form/               RHF-bound fields (TextField, SelectField, VerifiableField…)
    shared/             app-level building blocks (StageWizard, DataTable, FileUpload…)

  features/             one folder per business area
    auth/  masters/  journey/  objections/  reports/
    dashboard/  allocated-forms/  pdf-upload/  liveliness/  courier/  kit/
```

**The three component layers** (this is the answer to "how do I make reusable components"):

| Layer | Folder | Knows about | Example |
|---|---|---|---|
| 1. Primitive | `components/ui` | Only styling and accessibility | `Input`, `Button`, `Select` |
| 2. Form field | `components/form` | React Hook Form (`name` path), label, error | `TextField`, `SelectField`, `VerifiableField` |
| 3. Shared block | `components/shared` | App patterns, but no specific feature | `StageWizard`, `EntityCardList`, `DataTable`, `AddressForm` |
| 4. Feature | `features/*` | Business rules and APIs | `InwardStage`, `NomineeEditor` |

A layer may import only from layers above it in this table. `components/*` must never import from `features/*` (the only exception in the POC is `AddressForm`, which reads masters).

Inside one feature the files always follow the same split:

| File | Contains | Has React? |
|---|---|---|
| `types.ts` | Backend payload shapes | No |
| `schema.ts` | Zod schema, form value type, default values | No |
| `rules.ts` | Business rules as pure functions | No |
| `mapper.ts` | form values ⇄ backend payload | No |
| `services.ts` | One function per API call | No |
| `queryKeys.ts` | TanStack Query keys | No |
| `hooks/*.ts` | `useQuery` / `useMutation` wrappers | Hooks only |
| `*Stage.tsx`, `pages/*.tsx` | Rendering | Yes |

Because rules, mappers and schemas are plain functions, you can test them without rendering anything. This split is also what lets you find a bug in seconds (see section 8).

---

## 6. Step-by-step build

### Phase 0 – Project setup (Day 1)

1. Create the project (section 4). Delete the template's demo content in `App.tsx` and `App.css`.
2. **Path alias `@/`** so imports read `@/components/...` instead of `../../../`.

   `vite.config.ts`:

   ```ts
   import path from 'node:path'
   import tailwindcss from '@tailwindcss/vite'
   import react from '@vitejs/plugin-react'
   import { defineConfig, loadEnv } from 'vite'

   export default defineConfig(({ mode }) => {
     const env = loadEnv(mode, process.cwd(), '')
     return {
       plugins: [react(), tailwindcss()],
       resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
       server: {
         // Same origin in dev, so the session cookie and anti-forgery cookie work.
         proxy: {
           '/Onboarding': {
             target: env.VITE_PROXY_TARGET || 'https://localhost:5001',
             changeOrigin: true,
             secure: false,
           },
         },
       },
     }
   })
   ```

   Add `"paths": { "@/*": ["./src/*"] }` to `compilerOptions` in both `tsconfig.json` and `tsconfig.app.json`.
3. Env files:

   ```
   # .env.development
   VITE_API_BASE=/Onboarding
   VITE_PROXY_TARGET=https://localhost:5001
   VITE_INSTANCE=MACM
   VITE_MOCK_SESSION=true

   # .env.production
   VITE_API_BASE=/Onboarding
   VITE_INSTANCE=MACM
   ```

   Declare them in `src/vite-env.d.ts` (`interface ImportMetaEnv`), so `import.meta.env.VITE_API_BASE` is typed.
4. `git init` and commit. Commit at the end of every phase.

**Check:** `npm run dev` shows a blank page with no console errors. `npm run typecheck` passes.

### Phase 1 – Design system (Days 2–3)

1. Install Tailwind (section 4). In `src/index.css` start with `@import "tailwindcss";`.
2. Run `npx shadcn@latest init`. It creates `components.json`, `src/lib/utils.ts` and the theme block in `index.css`. Read what it generated.
3. Understand the theme mechanism before going further (POC: `src/index.css`):
   * `:root { --primary: #004c8f; ... }` defines **tokens** as CSS variables.
   * `@theme inline { --color-primary: var(--primary); }` exposes them to Tailwind, so `bg-primary` works.
   * `.dark { ... }` overrides the same tokens for dark mode.
   * `[data-theme='sbi'] { ... }` overrides them per brand palette.
   * Result: components never mention a colour. Changing a theme is changing variables on `<html>`.
4. Add primitives, one at a time, and **read each generated file**:

   ```bash
   npx shadcn@latest add button input label card badge
   npx shadcn@latest add select checkbox radio-group textarea
   npx shadcn@latest add dialog alert-dialog popover command
   npx shadcn@latest add table tabs progress sonner input-group
   ```

   To really learn the pattern, write `button.tsx`, `input.tsx` and `label.tsx` by hand instead of generating them. `button.tsx` teaches you `cva` variants and `asChild`; the rest follow the same idea.

**Check:** render a few buttons, an input and a card in `App.tsx`. Toggle `class="dark"` on `<html>` in DevTools and see colours change.

### Phase 2 – Data layer and state (Days 4–6)

Build `src/api/` in this order. Each file is small; understand why it exists.

1. `config/environment.ts` – `ENV` and `API_ENDPOINTS`. Every controller path in one object, copied from `Docs/API`. No URL string is written anywhere else in the app.
2. `api/api-response.ts` – `readFailure(body)`. The backend often answers **HTTP 200 with a failure body** (`{ success: false }`, `{ Message: "Failure" }`, or ASP.NET `{ errors: {...} }`). This one function recognises all three shapes. Read `Docs/API/README.md` §4 and §6 first.
3. `api/error.ts` – `ApiError` class and `toApiError(unknown)`. After this, every error in the app is the same type with a `displayMessage`.
4. `api/interceptor.ts`
   * request: add the `RequestVerificationToken` header (anti-forgery token kept in memory).
   * response: run `readFailure`; a failure body becomes a rejected `ApiError`.
   * on 401: call a handler registered from outside (`setUnauthorizedHandler`), so the API layer does not import routing or auth.
5. `api/axios.ts` – `axios.create({ baseURL, withCredentials: true })` + `setupInterceptors`.
6. `api/client.ts` – the `http` object. The backend accepts five body shapes, so there is one helper per shape:

   | Helper | Backend signature | Body |
   |---|---|---|
   | `postJson` | `[FromBody] Model` | JSON object |
   | `postRawString` | `[FromBody] string` | `"12345"` (a bare JSON string) |
   | `postForm` | form fields | `a=1&b=2` |
   | `postModel` | `[FromForm] string model` | FormData with one field `model` = JSON |
   | `postIndexedForm` | `[FromForm] List<T>` | `BankDetails[0].AccountNumber=...` |
   | `upload` | `IFormFile` | multipart, with progress |

7. `api/queryClient.ts` – defaults: `staleTime: 30_000`, no refetch on focus, retry only non-4xx errors. Export `MASTER_QUERY_OPTIONS = { staleTime: Infinity, gcTime: Infinity }`.
8. `api/index.ts` – re-export the public surface. Features import from `@/api` only.
9. First tests: `api/api-response.test.ts`. Write one test per failure shape. Run `npm test`.

Then the store:

10. `store/slices/uiSlice.ts` – `mode`, `theme`, `sidebarPinned`; initial state read from `localStorage`.
11. `store/slices/draftsSlice.ts` – `Record<string, { step, data }>` keyed by `formNo:stageKey`.
12. `store/store.ts` – `configureStore`, plus a `store.subscribe` that applies the `dark` class / `data-theme` attribute to `<html>` and writes to `localStorage`.
13. `store/hooks.ts` – typed `useAppDispatch` / `useAppSelector`.
14. `Providers.tsx` – wrap the app in `StoreProvider` → `QueryClientProvider`; add `<Toaster />` and React Query Devtools (dev only).

**Check:** dispatch `modeToggled()` from a temporary button; the page switches theme and survives refresh. Redux DevTools shows the action.

### Phase 3 – Routing and app shell (Days 7–9)

1. `routes/router.tsx` with `createBrowserRouter`. Start with two routes: `/login` and `/` (inside the layout). Use the `lazy` option so every page is its own chunk:

   ```tsx
   {
     path: 'journey',
     lazy: async () => ({
       Component: (await import('@/features/journey/pages/JourneyStart')).default,
     }),
   }
   ```

2. `components/shared/PageLoader.tsx` and `PendingPage.tsx` (placeholder for screens not built yet). Register **every** menu route now with `<PendingPage />`, so the menu is navigable from day one and you replace placeholders as you go.
3. `layout/menu.ts` – the menu as a data array (`MenuGroup[]`), plus `findMenuEntry(pathname)` for the top-bar title. The sidebar component only loops over this array.
4. `layout/mainLayout.tsx` – sidebar (pinned / collapsed icon rail / mobile drawer), top bar, `<Outlet />`. This is the largest single file in the shell (about 350 lines); build it in three passes: static layout → collapse behaviour → mobile.
5. `components/shared/ThemeSwitcher.tsx` – reads `THEMES` from `uiSlice`, dispatches `themeSet` / `modeToggled`.
6. `components/shared/BrandLogo.tsx`, `PageHeader.tsx`.

**Check:** you can click through every menu entry, the active item is highlighted, the URL changes, and refresh keeps you on the same page.

### Phase 4 – Authentication (Days 10–12)

Read `Docs/UI/26-Login.md` and `Docs/API/AuthController.md` first.

1. `features/auth/types.ts`, `auth.endpoints.ts`, `queryKeys.ts`.
2. `auth.validation.ts` – your first Zod schemas: `loginSchema`, `otpSchema`, and `type LoginFormValues = z.infer<typeof loginSchema>`.
3. `auth.services.ts` – `getCurrentUser`, `login`, `verifyOtp`, `logout`. Add `auth.mock.ts` with the same function signatures and switch on `ENV.MOCK_SESSION`.
4. `hooks/useCurrentUser.ts` – **the session is a query**:

   ```ts
   export const currentUserQuery = queryOptions({
     queryKey: AUTH_QUERY_KEYS.CURRENT_USER,
     queryFn: authService.getCurrentUser,
     retry: false,
     staleTime: Infinity,
   })
   export const useCurrentUser = () => useQuery(currentUserQuery)
   ```

   No token in `localStorage`, no auth slice. The cookie belongs to the backend; the app only asks "who am I?".
5. `hooks/useLogin.ts` (`useLogin`, `useVerifyOtp` – on success refetch the current user), `useLogout.ts`.
6. `routes/ProtectedRoute.tsx` – pending → loader; no user → `<Navigate to="/login" />`; else `<Outlet />`.
7. In `Providers.tsx`: `setUnauthorizedHandler(() => queryClient.setQueryData(CURRENT_USER, null))`. Any 401 anywhere now sends the user to login, with no code in the features.
8. UI: `LoginForm.tsx`, `OtpInput.tsx` (6 boxes, paste support, arrow keys), `OtpForm.tsx` (resend timer), `pages/Login.tsx`.

**Check:** wrong password shows the server message; correct login → OTP → dashboard placeholder; refresh keeps you logged in; logout returns to `/login`; opening `/journey` while logged out redirects to login.

### Phase 5 – Form kit (Days 13–16)

This is where reusability is decided. Build these in `components/form/`, then a dev-only `/kit` page that shows each one (POC: `features/kit/pages/KitShowcase.tsx`).

1. `types.ts` – `Option { value, label, disabled?, meta? }` and `BaseFieldProps { name, label, required, description, disabled, className }`.
2. `FieldShell.tsx` – label + required star + help text + error message around any control. Every field uses it, so label/error layout is defined once.
3. `TextField.tsx` – the pattern all other fields copy:

   ```tsx
   export function TextField({ name, label, required, transform, onValueChange, ...inputProps }: TextFieldProps) {
     const id = useId()
     const { field, fieldState } = useController({ name })   // reads the form from context
     return (
       <FieldShell id={id} label={label} required={required} error={fieldState.error?.message}>
         <Input
           {...inputProps}
           id={id}
           ref={field.ref}
           value={field.value ?? ''}
           onBlur={field.onBlur}
           onChange={(e) => {
             const value = transform ? transform(e.target.value) : e.target.value
             field.onChange(value)
             onValueChange?.(value)
           }}
           aria-invalid={fieldState.invalid}
         />
       </FieldShell>
     )
   }
   ```

   Points to understand: `useController({ name })` needs a `<FormProvider>` above it; `transform` is how `filters.digits` or `filters.upperAlnum` restrict typing; `onValueChange` replaces "watch + useEffect" for dependent defaults.
4. `SelectField.tsx` – same shape, takes `options` and `isLoading`.
5. `ChoiceFields.tsx` – `CheckboxField`, `CheckboxGroupField` (array value), `RadioGroupField`, `YesNoField`.
6. `ComboboxField.tsx` – searchable select (popover + cmdk) for long masters such as country and city.
7. `NumberStepper.tsx`.
8. `VerifiableField.tsx` – input with **Validate / Reset** buttons. Used for PAN, email, mobile, lead ID, sales code, TIN, bank account. Design:
   * Two form paths: the value (`pan`) and its status (`panStatus`: `'idle' | 'valid' | 'invalid'`).
   * `onVerify(value)` is a promise; it runs through `useMutation`.
   * After verification the input is read-only until Reset.
   * The Zod schema requires `panStatus === 'valid'`, so the user cannot go to the next step with an unverified value. No global `isValidPan` flags.
9. `lib/validators.ts` – `PATTERNS`, `isValidPan`, `isValidEmail`, `filters`. Write `lib/lib.test.ts` for them.
10. `index.ts` barrel.

**How to design any reusable component – the checklist used here**

1. Write the screen the plain way first. Extract only when the **same thing appears the second time**.
2. List what differs between the two usages. Those are the props. Everything else stays inside.
3. Pass **data and callbacks**, never feature knowledge. `VerifiableField` takes `onVerify`, it does not know what a PAN is.
4. Extend the native element's props (`ComponentProps<typeof Input>`) and spread the rest, so `maxLength`, `placeholder`, `inputMode` work without you adding each prop.
5. For lists use generics and render props: `EntityCardList<T>` takes `items: T[]`, `renderTitle(item)`, `renderBody(item)`.
6. Keep state outside when a parent needs it (controlled: `step` + `onStepChange` in `StageWizard`), inside when nobody else cares.
7. Add it to the `/kit` page with every state: empty, filled, error, disabled, loading.

**Check:** on `/kit`, a small form with every field type validates with Zod and shows errors under the right field.

### Phase 6 – Shared building blocks (Days 17–21)

| Component | What to learn from it |
|---|---|
| `lib/dialog-service.ts` + `shared/DialogHost.tsx` | A tiny store outside React + `useSyncExternalStore`. Gives you `await confirm({...})` from any handler. |
| `shared/StageWizard.tsx` | Steps as data (`{ id, title, fields, content }`). Next calls `trigger(fields)` to validate only the current step. Save validates everything and jumps to the first step with an error. |
| `shared/EntityCardList.tsx` | Generic list with Add / Edit / Delete, `max`, `canAdd`, `canDelete`. Used by holders, FATCA records, documents, nominees. |
| `shared/DataTable.tsx` | TanStack Table: column definitions as data; sorting, global search, pagination. |
| `shared/SimpleTable.tsx`, `DescriptionList.tsx` | Read-only displays. |
| `shared/file-upload/FileUpload.tsx` + `CropDialog.tsx` + `lib/crop-image.ts` | File validation (type, size), crop to canvas → Blob, upload progress. |
| `shared/address/address.schema.ts` + `AddressForm.tsx` | **A reusable form section**: a schema fragment + a component that takes a `name` prefix (`permanent`, `correspondence`). Cascading country → state → city. |
| `shared/PersonNameFields.tsx` | Same idea for prefix / first / middle / last name. |
| `shared/SearchFilters.tsx`, `StandardFilterFields.tsx`, `lib/useUrlFilters.ts` | Report filters kept in the URL query string. |
| `shared/ObjectionBanner.tsx` | Shows scrutiny remarks above a stage. |
| `lib/export-csv.ts`, `lib/dates.ts`, `lib/names.ts` | Pure helpers; test them. |

**Check:** each one appears on `/kit` and works with sample data.

### Phase 7 – Masters (Day 22)

1. `features/masters/services.ts` – one function per master, each returns `Promise<Option[]>`. Start with mock data and a 300 ms delay so loading states are visible.
2. `queryKeys.ts`, `constants.ts` (`INDIA_COUNTRY_ID`, `FOREIGN_PINCODE`).
3. `hooks/useMasters.ts`:

   ```ts
   export const useStates = (countryId: string | undefined) =>
     useQuery({
       queryKey: MASTER_QUERY_KEYS.STATES(countryId ?? ''),
       queryFn: () => mastersService.getStates(countryId ?? ''),
       enabled: !!countryId,          // idle until the parent is chosen
       ...MASTER_QUERY_OPTIONS,       // fetched once per session
     })
   ```

   This replaces every `setTimeout` / polling loader of the MVC pages.

**Check:** in `AddressForm`, choosing a country loads states; choosing a state loads cities; going back to a previous country is instant (cache).

### Phase 8 – Journey skeleton (Days 23–26)

Read `Docs/UI/00-FormInward-StageTracker.md` and `00-Common-Layout.md`.

1. `features/journey/types.ts` – `JourneyProgress`, `Journey`, `StageProps { journey, readOnly }`.
2. `stages.config.ts` – **the journey as data**. One array `STAGES` with `{ id, key, title, isAvailable(progress), component }`. From it derive: `getCurrentStage`, `getStageStatus`, `getStageCounts`, `currentStagePath`. Bank Details is skipped with `isAvailable: (p) => p.isBankAvailable !== 'N'`. Write `journey.test.ts` for these functions before any UI.
3. `journey.mock.ts` – an in-memory backend: forms, saved stage data, progress.
4. `services.ts` – `journeyService` with one function per API; each has a comment naming the real endpoint.
5. `queryKeys.ts`, `hooks/useJourney.ts`.
6. `pages/JourneyStart.tsx` – enter and validate a form number, then navigate to `/journey/:formNo`.
7. `pages/JourneyLayout.tsx` – loads the journey, shows header + `StageRail` + `<Outlet context={journey} />`. Export `useJourneyContext()`.
8. `components/StageRail.tsx` – the stage list with completed / current / pending / skipped status.
9. `pages/StagePage.tsx` – **route guard**: unknown, pending or skipped stage → redirect to the current stage; completed stage → `readOnly`. Renders `<Stage key={formNo:stageKey} />`.
10. The three hooks every stage uses:
    * `useStageStep(formNo, stageKey)` – wizard position in the drafts slice.
    * `useStageData(journey, stageKey, load, enabled)` – loads saved data in view / objection mode.
    * `useSaveStage({ journey, stageKey, save, successMessage })` – mutation → invalidate journey → clear draft → toast → navigate to the next stage.
11. `stageMode.ts` – context `{ isObjection, returnPath }` so the same stage component works in the objection flow.

**Check:** with stage components still placeholders, entering a form number opens stage 1; typing the URL of stage 5 redirects back to stage 1.

### Phase 9 – First two stages (Days 27–32)

**Inward** (`Docs/UI/01-Inward.md`) – the biggest stage, about 55 inputs in 6 steps. Build in this order:

1. `types.ts` – the `FormInward` payload exactly as the API wants it.
2. `rules.ts` – option lists and pure rules: `hasNre`, `hasNro`, `canTradeFno`, `deriveProducts`, `prefixDefaults`, `ageFromDob`, `isResidentialStatusAllowed`.
3. `schema.ts` – `inwardSchema` (with `superRefine` for cross-field rules), `InwardValues`, `INWARD_DEFAULTS`, `INWARD_STEP_FIELDS`.
4. `mapper.ts` – `toInwardPayload(values, context)` and `fromInwardPayload(saved)`.
5. Tests for rules, schema and mapper (`stages.test.ts`).
6. `steps/PanIdentityStep.tsx`, `PersonalStep.tsx`, `ProductStep.tsx`, `DpStep.tsx`, `ContactStep.tsx`, `BranchStep.tsx` – only layout and field components; they read the form with `useFormContext`.
7. `InwardStage.tsx` – it becomes short because everything else exists:

   ```tsx
   const form = useForm<InwardValues>({
     resolver: zodResolver(inwardSchema),
     defaultValues: INWARD_DEFAULTS,
     values: saved.data ?? undefined,   // view / objection mode
     mode: 'onTouched',
   })
   const save = useSaveStage({ journey, stageKey: 'inward', save: journeyService.saveInward, ... })

   return (
     <FormProvider {...form}>
       <StageWizard steps={steps} step={step} onStepChange={setStep} readOnly={readOnly}
         isSubmitting={save.isPending}
         onSubmit={() => save.mutate(toInwardPayload(form.getValues(), context))} />
     </FormProvider>
   )
   ```

**Address** (`Docs/UI/02-Address.md`) – reuses `AddressForm` twice. "Same as permanent" is a checkbox in the form and is resolved **in the mapper**, not by copying field values.

**The stage recipe** – every later stage is these 7 steps:

```
types.ts → rules.ts → schema.ts → mapper.ts → tests → step/editor components → XxxStage.tsx
then: register in stages.config.ts, add the service function
```

**Check:** fill Inward end to end, save, land on Address, save, land on Holder placeholder. Reopen Inward: it is read-only and pre-filled.

### Phase 10 – Record-list stages (Days 33–46)

These stages collect several records and save them in one call. First build `hooks/useRecordList.ts` (records + which one is open in the editor, kept in the drafts slice) and `components/RecordDialog.tsx`.

| Stage | Doc | Days | Notes |
|---|---|---|---|
| Holder | `03-Holder.md` | 3 | Max 2 joint holders, "Skip Holder", reuses `AddressForm`, `PersonNameFields`, `ContactVerifyFields` |
| FATCA | `04-Fatca.md` | 4 | Hardest schema: up to 3 tax residencies with TIN validation, PEP upload. `FatcaEditor.tsx` is about 400 lines |
| Proof | `05-Proof.md` | 3 | Sections per holder, required document types, crop + upload, `rules.ts` decides allowed categories |
| Nominee | `06-Nominee.md` | 4 | Up to 3 nominees, shares must total 100%, guardian block when the nominee is a minor, opt-out |

Each has `XxxStage.tsx` (list with `EntityCardList`) + `XxxEditor.tsx` (a `StageWizard` inside a dialog).

### Phase 11 – Closing stages (Days 47–55)

| Stage | Doc | Days | Notes |
|---|---|---|---|
| Miscellaneous | `07-Miscellaneous.md` | 1.5 | 16 consents, simple schema |
| Extra Details | `09-ExtraDetails.md` | 3 | IPV / staff verification with employee e-sign lookup; its bank answer decides whether stage 11 exists |
| Brokerage | `10-Brokerage.md` | 1.5 | One select + charge sheet table |
| Bank Details | `11-BankDetails.md` | 3 | Up to 6 accounts, IFSC lookup, penny-drop check, `postIndexedForm` |

Then `pages/JourneyComplete.tsx` (`12-FormSuccess.md`). Tests: `closing-stages.test.ts`.

**Check:** complete a whole form with bank = Y (11 stages) and another with bank = N (Bank Details shows as skipped).

### Phase 12 – Objections (Days 56–58)

`Docs/UI/13`, `15`. Files: `features/objections/` – `services.ts`, `hooks/useObjections.ts`, `pages/ObjectionList.tsx`, `ObjectionHub.tsx`, `ObjectionStagePage.tsx`.

`ObjectionStagePage` renders the **same stage component** wrapped in `<StageModeContext value={{ isObjection: true, returnPath }}>` with an `ObjectionBanner` on top. If you built Phase 8 correctly, no stage file changes.

### Phase 13 – Operations and reports (Days 59–64)

All of these are "filters + `DataTable` + one or two actions", so they go fast.

| Screen | Doc | Days |
|---|---|---|
| Allocated Forms / generate form number | `25` | 1 |
| In-process Forms, MIS Report (shared `ReportList`, CSV export) | `16`, `17` | 1.5 |
| Account Status search + detail (tabs) | `22`, `23` | 1.5 |
| PDF Upload | `18` | 1 |
| Send Liveliness Link | `19` | 0.5 |
| Courier | `21` | 0.5 |

### Phase 14 – Dashboard (Days 65–66)

`Docs/UI/24-Dashboard.md`. Build one dashboard (`Dashboard.tsx` + `components/parts.tsx` + `dashboard.config.ts`). The POC's other four variants are design options, not requirements.

### Phase 15 – Hardening (Days 67–70)

* Responsive pass at 375 px, 768 px, 1280 px.
* Keyboard pass: every form usable without a mouse; focus visible; dialogs trap focus.
* Loading, empty and error state on every screen.
* `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all clean.
* Check the built bundle: each route should be its own chunk.

### Phase 16 – Not in the POC

Listed in the docs but not built: Family Details (stage 8, disabled), customer liveliness page (`20`), email-verify result and error pages (`27`), forgot password. Add 4–6 days if you need them.

### Phase 17 – Real API integration (15–20 extra days)

The POC stops at mocks. To connect the real backend:

1. Backend must expose `Auth/session` (current user + anti-forgery token). It is marked "pending backend" in `environment.ts`.
2. Replace each function body in `features/*/services.ts` with the `http.*` call named in its comment. Nothing above the service layer changes.
3. Write the missing response mappers (`fromXxxPayload`) for stages that currently use `getStageView`.
4. Test each stage against UAT: body shape (section Phase 2 table), failure envelopes, field names.

---

## 7. Timeline – how many days

Assumptions: one developer, full time (about 6 focused hours a day), typing everything by hand and understanding it, with the POC and `Docs/` available as reference.

| Phase | Work | Days |
|---|---|---|
| 0 | Setup | 1 |
| 1 | Design system, shadcn primitives | 2 |
| 2 | API layer, query client, store, providers | 3 |
| 3 | Routing, layout, menu, themes | 3 |
| 4 | Auth | 3 |
| 5 | Form kit + kit page | 4 |
| 6 | Shared building blocks | 5 |
| 7 | Masters | 1 |
| 8 | Journey skeleton | 4 |
| 9 | Inward + Address | 6 |
| 10 | Holder, FATCA, Proof, Nominee | 14 |
| 11 | Misc, Extra Details, Brokerage, Bank, Complete | 9 |
| 12 | Objections | 3 |
| 13 | Operations + reports | 6 |
| 14 | Dashboard | 2 |
| 15 | Hardening | 4 |
| | **Total, same scope as the POC (mock-backed)** | **70 working days ≈ 14 weeks** |
| 17 | Real API integration | +15 to 20 |
| 16 | Screens missing from the POC | +4 to 6 |

By experience level, for the POC scope:

| Your starting point | Estimate |
|---|---|
| Already fluent in React Hook Form, Zod, TanStack Query and Tailwind | 40–45 working days |
| Comfortable with React, new to most of this stack | **65–75 working days** |
| New to React / TypeScript | 90+ working days, and do the prerequisites in section 3 first |

Part time (2–3 hours a day): multiply by about 2.5.

**Recommended shorter path for the experience you want.** Phases 0–9 take about 32 days and contain every pattern in the app: API layer, session, form kit, wizard, one full stage, mappers, tests. After that, the remaining stages are repetition of the same recipe. If time is limited, build Phases 0–9 fully by hand, then build one record-list stage (Nominee) and one report screen by hand, and read the rest from the POC. That is about 40 days and gives you about 90% of the understanding.

---

## 8. When it breaks – where to look

This table is the real benefit of the structure. Find the symptom, open one file.

| Symptom | Look in |
|---|---|
| Wrong or missing validation message | the stage's `schema.ts` |
| Next button does nothing on a wizard step | `INWARD_STEP_FIELDS`-style list in `schema.ts` (a field with an error is on a different step, or is missing from the list) |
| A field shows/hides or enables at the wrong time | the stage's `rules.ts` |
| Backend rejects the save, or saves wrong values | the stage's `mapper.ts` (`toXxxPayload`) – compare with `Docs/API` |
| Reopened stage shows blank or wrong values | `mapper.ts` (`fromXxxPayload`) and `useStageData` |
| Request goes to the wrong URL | `config/environment.ts` |
| Request has the wrong body format (400 / model is null) | wrong `http.*` helper in `services.ts` (see Phase 2 table) |
| "Anti Forgery Token was invalid" | `api/interceptor.ts` and the session call in `auth.services.ts` |
| Save succeeded on the server but the UI shows an error (or the reverse) | `api/api-response.ts` `readFailure` |
| Logged out unexpectedly / not redirected on 401 | `Providers.tsx` handler and `ProtectedRoute.tsx` |
| Dropdown empty or stuck on "Loading…" | `features/masters/` hook: check `enabled` and the query key in React Query Devtools |
| Stale data after a save | missing `invalidateQueries` in the mutation's `onSuccess`; check query keys |
| Lands on the wrong stage after save / stage not reachable | `stages.config.ts` (`getCurrentStage`, `isAvailable`) |
| Wizard step or record list lost / not cleared | `draftsSlice.ts`, `useStageStep`, `useRecordList` (check keys in Redux DevTools) |
| One stage's values appear in another | missing `key` on `<Stage>` in `StagePage.tsx` |
| Field does not update / error "useFormContext is null" | the field is rendered outside `<FormProvider>` or `name` path is wrong |
| Colours wrong in one theme or in dark mode | `index.css` token block for that theme |
| Menu item not highlighted / wrong page title | `layout/menu.ts` |

Debugging tools to keep open: React Query Devtools (bottom-left in dev), Redux DevTools, the Network tab (check the request **payload** tab, not only the status), and in a form: `console.log(form.formState.errors)`.

---

## 9. Working habits that build the experience

1. One commit per finished file group, with a message that says what works now.
2. After finishing a file, explain it aloud line by line. If you cannot explain a line, you do not own it yet.
3. Break it on purpose: remove `enabled`, remove a `key`, change a query key, return the wrong envelope from a mock. See what the failure looks like. This is what lets you recognise bugs in seconds later.
4. Write the test for a rule or mapper **before** the UI that uses it.
5. Run `npm run typecheck` often. Read TypeScript errors from the bottom line up.
6. Keep a `NOTES.md` with every bug that took you more than 20 minutes and its cause.
7. When your version differs from the POC, do not assume the POC is right. Work out which one is better and why.
