# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev               # Start Next.js dev server
pnpm build             # Production build
pnpm start             # Start production server

# Code quality
pnpm lint              # ESLint
pnpm typecheck         # tsc --noEmit
pnpm check             # lint + typecheck (runs before vercel-build)

# Testing
pnpm test              # Run all tests (vitest)
pnpm test:watch        # Vitest in watch mode

# Database
pnpm db:up             # Start local Postgres via Docker
pnpm db:migrate        # Run Payload migrations (required after schema changes)
pnpm db:seed           # Seed test data (idempotent)
pnpm db:reset          # Wipe all data
pnpm db:refresh        # Reset + Seed
pnpm db:fresh          # Migrate + Seed

# Payload codegen (run after modifying collections/globals)
pnpm generate:types       # Regenerate payload-types.ts
pnpm generate:importmap   # Regenerate Payload import map
```

Run a single test file: `pnpm test src/libs/auth/google.test.ts`

## Architecture

**Stack**: Next.js 15 (App Router) + Payload CMS v3 + PostgreSQL 18 + Tailwind CSS v4 + shadcn/ui

**Package manager**: pnpm 10. Node 22.

### Routing

- `src/app/[locale]/(frontend)/` — localized user-facing pages (en/th)
- `src/app/(payload)/` — Payload CMS admin UI and REST/GraphQL API at `/admin`, `/api`
- `src/app/api/` — custom Next.js API routes (auth, admin export, bulk assign, etc.)
- Middleware (`src/middleware.ts`) is intentionally minimal — just `NextResponse.next()` for all non-asset routes

### Payload CMS (single source of truth)

**PayloadCMS is the only interface to the database.** All data access must go through the Payload Local API.

```ts
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
await payload.find({ collection: 'users', where: { ... } })
await payload.create({ collection: 'events', data: { ... } })
await payload.update({ collection: 'registrations', id, data: { ... } })
```

- Use `overrideAccess: true` in seed/admin scripts to bypass RBAC
- Use `context: { skipGroupSync: true }` when seeding users (avoids circular hook triggers)
- **Never** use raw SQL, Prisma, Drizzle, or any second ORM/connection pool
- Schema changes = add fields to `src/collections/` or `src/globals/`, then `pnpm db:migrate`
- After changing collections/globals, regenerate types: `pnpm generate:types`

Collections: `users`, `events`, `groups`, `registrations`, `form-assignments`, `locations`, `attendings`, `team-members`, `academic-titles`, `feature-requests`
Globals: `HomeContent`, `TermsContent`, `SiteSettings`

### Authentication

Google OAuth with PKCE via `openid-client`. Flow:

1. `/api/auth/google` → authorization URL + stores `code_verifier`/`state` in httpOnly cookies (10 min)
2. Google callback → `/api/auth/google/callback` → exchanges code, validates domain, creates/links Payload user
3. Sets `payload-token` JWT cookie; redirects to `/account` (or `/account?complete=true` if profile incomplete)

Auth logic lives in `src/libs/auth/google.ts`. Profile completion check: `isProfileComplete()` in `src/libs/profile-completion.ts`.

### RBAC & Permissions

Roles (ascending): `visitor → member → staff_probation → staff → deputy_vp → vp → admin → superadmin`

Groups add capability permissions via bitmask: `manage_events`, `manage_forms`, `manage_users`, `view_users`, `export_data`, `manage_content`.

Use helpers from `src/libs/permissions.ts`:
- `hasPermission(user, 'manage_events')` — checks roles or group bitmask (admin/superadmin auto-pass)
- `hasGroup(user, 'superadmin')` — checks group slug
- `canInteractAsMember(user)` — member or above

### Form System

Built on `@payloadcms/plugin-form-builder`. Custom blocks in `src/blocks/form-fields/`:
- `SliderBlock`, `RankingBlock`, `CheckboxGroupBlock`, `FileUploadBlock`, `UserProfileBlock`
- All support `conditionalGroup` field for branching page logic

Form assignments (`FormAssignments` collection) link forms to specific users with deadlines. Creating an assignment triggers an email via `afterChange` hook. Form blocking (`src/libs/form-blocking.ts`) gates user actions on incomplete mandatory forms.

### Email

Resend via `@payloadcms/email-resend`. Templates are React Email components in `src/libs/email/templates/`. Email is sent from Payload `afterChange` hooks (e.g. `FormAssignments`, `Registrations`). URL base comes from `NEXT_PUBLIC_SERVER_URL`.

### i18n

Locales: `en` (default), `th`. Dictionary files at `src/i18n/locales/{en,th}/*.json`.

- Server components: `getDictionary(locale)` from `src/i18n/server.ts`
- Client components: `useTranslation()` via `I18nProvider` in `src/i18n/client.tsx`

### Vercel Free Tier Constraints

- Max serverless function timeout: 60s
- Max file upload body: 5 MB
- Max concurrent Postgres connections: 20–60 (varies by provider)
- Keep dependencies lean — every MB increases cold start time

No edge runtime for Payload routes (requires Node.js). Never open a second DB connection pool.

## Deployment

Deployed on **Vercel** via Git integration. The build command is `pnpm run vercel-build` (runs `check` then `build`). Push to `main` triggers a production deploy automatically.

## Environment Variables

See `.env.example`. Required: `PAYLOAD_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_SERVER_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`. Optional: `GOOGLE_CALLBACK_URL`.

## Path Aliases

- `@/*` → `src/*`
- `@payload-config` → `src/payload.config.ts`
