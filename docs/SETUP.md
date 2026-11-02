# RoleRadar setup

This source folder contains a blank configuration template. It includes no credentials, configured Supabase project, deployed functions or public application hosting. Guest and fictional sample modes work without account configuration.

## Install and run

Use Node.js 24 and npm. From the repository root:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Vite proxies `/api` to Express on port 3001. Keep both processes running. Use `127.0.0.1` consistently: switching to `localhost` changes the origin and can fail mutation checks.
Guest work clears on reload. Live retrieval needs internet. The explicitly fictional sample workspace supports offline demonstrations.

For accounts, copy `.env.example` to `.env` once, without overwriting an existing configuration:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux use `cp .env.example .env`. Development defaults are `APP_URL=http://127.0.0.1:5173`, `PORT=3001`, `NODE_ENV=development`, `SERVE_FRONTEND=false`. Provider values belong in server environment variables, never `VITE_*` variables, browser code or committed files.

## Create your own Supabase project

For a **fresh database**, run these complete SQL files in order in its SQL editor:

1. [`001_private_history.sql`](../supabase/migrations/001_private_history.sql): base tables, profile synchronization, grants and ownership policies.
2. [`20261101105038_career_workspace.sql`](../supabase/migrations/20261101105038_career_workspace.sql): career profiles, search snapshots and saved roles.

These are creation migrations, not reset scripts. Review schema and migration history before using an existing database. No reset or blind CLI push is required.

Set the server environment from your project's Connect/API settings:

```dotenv
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_DELETE_FUNCTION=delete-scamlens-account
```

Fill the first two values from your project. Keep the legacy function identifier unless you change both deployment and configuration. Normal reads/writes use the verified user's session and RLS. No local service-role key is needed for the recommended deletion path.

### Schema map

| Table | Purpose |
| --- | --- |
| `users` | ID references `auth.users`; name, email and timestamps |
| `settings` | Owner's history and theme preferences |
| `career_profiles` | Owner's skills and country/type preferences |
| `opportunity_searches` | Owner's search inputs and bounded historical snapshots |
| `saved_opportunities` | Owner's listing snapshots, private notes and user-entered statuses; unique per owner/job |
| `sessions` | Owner's retained review input and title |
| `messages` | Owner-bound session reference, inputs, prompts and imported responses |
| `results` | Owner-bound session reference, local evidence and validated imported AI result |

All eight tables use forced RLS. Session relationships bind the same owner. Update policies constrain original and replacement rows. Application tables contain no passwords. The migrations contain the complete constraints, indexes, grants and policies.

## Configure Auth and email

Enable email/password authentication and keep email confirmation enabled. Set the Auth Site URL to the app origin. Configure redirect allowlists for the origins you use:

- Development: `http://127.0.0.1:5173/api/auth/callback`.
- Built local app: `http://127.0.0.1:3001/api/auth/callback`.

The SDK adds `sb_flow_id`; recovery uses query parameters. Use narrowly scoped callback patterns accommodating those parameters according to [official redirect rules](https://supabase.com/docs/guides/auth/redirect-urls). Production needs its corresponding HTTPS callback; avoid arbitrary-origin wildcards.

**Configure suitable SMTP before inviting arbitrary public addresses.** Default hosted email restricts recipients and frequency. Follow [Supabase SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp). Historical fixture accounts did not establish email delivery. Test confirmation/recovery, expired/reused links and reset-password login yourself.
Review current [password-security settings](https://supabase.com/docs/guides/auth/password-security). A historical project reported leaked-password protection disabled; each new deployment needs its own review.

## Deploy account deletion

Deploy both files in [`supabase/functions/delete-scamlens-account/`](../supabase/functions/delete-scamlens-account) as **`delete-scamlens-account`**, with gateway JWT verification enabled:

- `index.ts`
- `handler.mjs`

Follow [Edge Function deployment instructions](https://supabase.com/docs/guides/functions/deploy). The entry point imports its sibling handler; deploying only `index.ts` is insufficient. Do not disable JWT verification to bypass an error.
The runtime supplies Supabase keys. The handler verifies the bearer token and current password, revokes sessions and deletes only the verified caller. It accepts no target user ID. Cascades remove linked active records; provider backups/logs follow separate retention rules.
The optional `SUPABASE_SERVICE_ROLE_KEY` server fallback is unnecessary here. Never expose it to the browser or use it for ordinary queries.

## Job source

The default Himalayas API needs no key. Optional server-only `HIMALAYAS_API_KEY` supports higher provider quotas. Requests send public country/type/page/sort filters. Private profiles are matched after retrieval.
An initial page normally contains 20 rows; additional pages are explicit and capped at five. Caching, cooldowns and bounded retries preserve partial results. Saved search snapshots retain at most 20 ranked results. See [source terms and limits](JOB-SOURCES.md).

## Run the built app

Windows: double-click `START-ROLERADAR.cmd`. It checks dependencies, builds and serves on port 3001. Keep its window open; close an earlier copy if the port is occupied.

PowerShell:

```powershell
npm run build
$env:APP_URL='http://127.0.0.1:3001'
$env:PORT='3001'
$env:SERVE_FRONTEND='true'
npm start
```

macOS/Linux:

```sh
npm run build
APP_URL=http://127.0.0.1:3001 PORT=3001 SERVE_FRONTEND=true npm start
```

Public hosting needs a Node/Express process, HTTPS and same-origin `/api` routes. GitHub Pages cannot run this backend. The entry point binds to `127.0.0.1`; configure a host-appropriate bind address where required. Set production server variables, SMTP/callbacks and verify Secure cookies at that origin. No public deployment is supplied.

## Verify

```sh
npm test
npm run typecheck
npm run build
```

The normal suite needs no Supabase credentials and skips its opt-in live case. See [verification](../VERIFICATION.md).
SQL tests in `supabase/tests/` use reserved synthetic identities inside rollback transactions. Run each complete file as one query in a dedicated test project; collisions abort.
Explicit cloud smoke runners can **delete the disposable accounts they test**. Read each runner first; never provide real student credentials. Test two-account isolation in your project: history/export stay private, guessed other-owner IDs fail, and deletion affects only the caller.
Use the [security checklist](../SECURITY-CHECKLIST.md) before inviting users. This prototype is not a security certification.
