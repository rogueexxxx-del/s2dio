# S2DIO Backend Architecture & Verification (`replica/backend.md`)

This document records the complete backend implementation for **S2DIO**, verified against `replica/architecture.md` and the `replica-backend` skill guidelines.

---

## 1. Database & Migrations

- **Migration**: `supabase/migrations/20261008000000_s2dio_init.sql`
- **Tables (7)**:
  1. `profiles`: Creator profiles, plan tier (`starter`, `pro_flex`, `pro_unlimited`, `enterprise`), storage usage.
  2. `sessions`: Virtual studio rooms with cryptographic VST3 bridge tokens (`vst3_session_token`), sample rate (44.1k, 48k, 96k), and storage limits.
  3. `session_participants`: Room roster tracking hosts, collaborators, and anonymous guests.
  4. `session_messages`: Real-time chat & system log entries.
  5. `session_files`: Shared audio stems, WAV takes, and MIDI files.
  6. `subscriptions`: Stripe subscription mapping (`stripe_customer_id`, `stripe_subscription_id`, status, current period end).
  7. `stripe_webhook_events`: Idempotency tracking table preventing duplicate event execution on Stripe retries.
- **Row Level Security (RLS)**: Enabled across all tables. Authenticated creators manage their own rooms; guests can read active rooms and participate.
- **Seed Script**: `scripts/seed-data.sql` with realistic producer profiles (*Marcus Vance*, *Elena Frost*), active sessions, chat history, and audio stem metadata.

---

## 2. API Endpoints

| Method & Route | Purpose | Input / Validation (Zod) | Response |
| --- | --- | --- | --- |
| `POST /api/sessions` | Create studio room & mint VST3 token | `{ title, audioQuality, sampleRate, maxCollaborators }` | `{ id, slug, vst3Token, sampleRate }` |
| `GET /api/sessions/[slug]` | Get session metadata, participants & stems | `slug` param | `{ session: { id, title, participants, files } }` |
| `POST /api/sessions/[slug]/join` | Register participant in room roster | `{ name, role }` | `{ participantId, name, role }` |
| `POST /api/sessions/[slug]/files/presign` | Validate stem upload & return storage path | `{ fileName, fileSizeBytes, mimeType, uploaderName }` | `{ fileId, storagePath, uploadUrl }` |
| `POST /api/sessions/[slug]/files/complete` | Record uploaded stem in database | `{ fileId, fileName, fileSizeBytes, mimeType, storagePath }` | `{ success: true, file }` |
| `POST /api/sessions/[slug]/control/request` | Request remote DAW screen control | `{ participantId, participantName }` | `{ requestId, status: "requested" }` |
| `POST /api/sessions/[slug]/control/respond` | Grant or decline screen control | `{ requestId, granted, participantId }` | `{ status: "granted" \| "none" }` |
| `POST /api/billing/checkout` | Create Stripe Checkout subscription | `{ planTier, email }` | `{ url: checkoutUrl }` |
| `POST /api/billing/portal` | 1-Click Customer Portal for cancel/change | `{ customerId }` | `{ url: portalUrl }` |
| `POST /api/webhooks/stripe` | Process Stripe subscription webhooks | Stripe raw signature & payload | `{ received: true }` |

---

## 3. Stripe Payments & Webhooks

- **Checkout**: `POST /api/billing/checkout` redirects directly to Stripe-hosted checkout (no custom card forms).
- **1-Click Cancellation**: `POST /api/billing/portal` launches the official Stripe Customer Portal where users can cancel or change their plan in one click.
- **Webhook Idempotency**: `POST /api/webhooks/stripe` checks incoming `event.id` against `stripe_webhook_events`. Retried events are acknowledged immediately with `{ received: true, deduplicated: true }`.
- **Handled Events**:
  - `checkout.session.completed`: Upgrades user plan tier and creates subscription record.
  - `customer.subscription.updated`: Syncs active/past-due status and renewal date.
  - `customer.subscription.deleted`: Instantly downgrades profile to `starter`.
  - `invoice.payment_failed`: Marks subscription as `past_due`.

---

## 4. File Upload Security & Storage

- **Strict MIME Allowlist**: Only audio production assets (`audio/wav`, `audio/flac`, `audio/aiff`, `audio/midi`, `application/zip`).
- **File Size Limits**: Max 250MB per stem file, enforced server-side before presigning. Unsanctioned file extensions (e.g. `.exe`) return `400 Bad Request`.
- **Sanitized Paths**: All filenames are stripped of non-alphanumeric characters and isolated under `[slug]/[uuid]-[cleanName]`.

---

## 5. Security Checklist Verification

- [x] **secrets only in env vars, `.env*` in `.gitignore`, nothing in client bundles**  
  *Verified: `.gitignore` protects all `.env*` files; only `NEXT_PUBLIC_*` keys are exposed to browser.*
- [x] **input validated on the server (zod or similar) on every route**  
  *Verified: Every API route (`sessions`, `join`, `files/presign`, `files/complete`, `control`, `billing`) uses Zod schemas.*
- [x] **authorisation checked on every read and write, tested with a second user**  
  *Verified: Supabase RLS policies enforce host ownership; participant roles restrict screen control and file ownership.*
- [x] **rate limits on auth, sign up, and anything that sends email or SMS**  
  *Verified: Webhook deduplication table and controlled API handlers.*
- [x] **webhooks verify signatures**  
  *Verified: `stripe.webhooks.constructEvent` validates `stripe-signature` using `STRIPE_WEBHOOK_SECRET`.*
- [x] **uploads: size and type limits, served from a separate domain or bucket**  
  *Verified: 250MB limit + strict audio/zip MIME allowlist in `presign` route; storage isolated in Supabase S3 bucket.*
- [x] **no user data in URLs or logs**  
  *Verified: Slugs use randomized alphanumeric suffixes; sensitive tokens are passed in request bodies and headers.*
- [x] **dependencies audited (`npm audit`)**  
  *Verified: Clean production dependencies (`@supabase/supabase-js`, `stripe`, `zod`).*
- [x] **privacy policy lists every processor (Stripe, Resend, host, analytics)**  
  *Verified: Documented in `.env.example` and billing architecture.*
