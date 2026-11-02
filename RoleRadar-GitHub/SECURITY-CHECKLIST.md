# RoleRadar security and privacy checklist

Release evidence through 2 November 2026; not a security certification. [Verification](VERIFICATION.md) distinguishes fresh-copy checks, historical provider tests and pending email flows. Checked implementation items describe the source; a fresh installation must configure and verify its own Supabase project and deployment.

## Implemented

- [x] Supabase Auth handles password hashing, verification, sessions and recovery. No plaintext passwords or parallel password hashes are stored by the app. See [provider password security](https://supabase.com/docs/guides/auth/password-security).
- [x] Server environment variables hold provider configuration. No client `VITE_*` credentials, service-role key or AI key. The ZIP excludes `.env`.
- [x] Official `@supabase/ssr` sessions use HttpOnly, SameSite cookies; Secure in production. Protected requests verify identity with `getUser`.
- [x] Same-origin mutation checks, auth/write rate limits and Helmet. Ordinary queries use the authenticated user's client, never a general admin client.
- [x] Forced RLS protects all eight tables: users, settings, sessions, messages, results, career_profiles, opportunity_searches, saved_opportunities. Composite owner/session foreign keys protect messages/results.
- [x] Export includes own profile/settings, skills, searches, roles, notes, inputs/results and AI messages; no credentials or other accounts.
- [x] Account deletion requires DELETE confirmation and password reauthentication. The included function verifies JWT and identity independently, and derives the target from the caller. Deploy it to your own project as described in [setup](docs/SETUP.md). Its privileged key is platform-injected, never browser-visible.
- [x] Linked active records cascade on deletion. Provider backups/logs have separate retention; no promise of instant backup erasure.
- [x] Listings and AI responses render as text. Application URLs are allowlisted to the original source. AI evidence quotes must occur in the supplied listing; this does not prove reasoning or model origin.
- [x] Guest/demo work is tab-local and does not silently merge into accounts. Fictional demo roles have no live application links or shared cloud password.
- [x] No analytics, remote fonts, CV uploads or automatic applications. Job feeds receive public country/type/page filters, never names/emails/private skill profiles. ChatGPT sharing is a reviewed manual action.

## Tested

- Historical checks used real Supabase logins with two distinct disposable accounts and HttpOnly cookies; no configured project is included in this delivery.
- Live SQL isolation: 16 base assertions plus 12 career assertions; SQL fixtures rolled back.
- Eight live career integration groups: private profiles, guessed cross-account IDs, saved roles/notes/status, quote validation, export, returning history, self-deletion.
- Earlier foundation runner: nine checks, including invalid credentials and wrong-password deletion rejection.
- Both temporary career accounts self-deleted; final queries found no remaining identities or career rows. Credentials never entered source/delivery files.
- Production build, TypeScript check and dependency audit pass. Browser assets checked for configured provider values and privileged-key markers.

The accounts were SQL-provisioned with confirmed synthetic emails. These checks establish real login, ownership and deletion; they do not establish email signup/recovery delivery.

## Before public access

- [ ] Configure suitable SMTP and narrowly scoped callbacks. Test real signup/confirmation/recovery, expired/reused links and old-password rejection after reset.
- [ ] Host the Node app on HTTPS and verify Secure-cookie behavior at that origin. Static-only hosting cannot run this server.
- [ ] Review your project's current provider advisors and password-security settings. A historical development project reported leaked-password protection disabled; this repository does not configure or claim that protection.
- [ ] Complete a fuller accessibility/device audit and production abuse review.

## Signup privacy notice

The form explains that Supabase stores account identity and the skills, preferences, roles, notes and history retained by users; owners and authorized project operators can access those records, other accounts cannot. Job feeds receive public search filters, not private profiles. Users choose what to share with ChatGPT and can download or delete active account data in Settings. No hidden tracking.

Supabase is a necessary authentication/storage processor. It would be inaccurate to promise that only the AI provider receives data. Keep the plain-language notice and provider-backup limitation.
