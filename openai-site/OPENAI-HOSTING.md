# RoleRadar — OpenAI Sites adapter

This checkout preserves the UI from the student's selected RoleRadar-Final folder and adapts the Express API to the OpenAI Sites Cloudflare Worker runtime. The standalone Vite/Express project remains separate.

## What changed

- The existing React workspace mounts inside the provided Vinext starter; its shadcn/Magic UI components and bundled fonts are preserved.
- Cloudflare's supported Node HTTP bridge routes /api requests to the existing Express handlers.
- HTTPS, HttpOnly/Secure cookies, exact-origin mutations, Supabase identity checks and database RLS remain intact.
- A Sites D1 table retains canonical PUBLIC source listings across server instances. It contains no profile, account, skill-filter, note or message data. Private data remains in Supabase.
- Durable closed-listing tombstones prevent another instance saving a role already reported closed.
- Site configuration and secrets are separate. No provider credentials belong in source or .openai/hosting.json.

## Local commands

Use Node.js 24, then npm ci, npm test and npm run typecheck. The supported Sites build runs through the plugin's build-site.mjs helper (or npm run build for standalone build debugging).

This copy uses the Sites starter's runtime/build scripts, not the original START-ROLERADAR.cmd launcher. The parent standalone project keeps that launcher.

Generated Drizzle migrations are under drizzle/. Sites applies them before uploading the hosted Worker. Do not recreate their tables in request handlers or modify already applied migrations.

## Deployment configuration

.openai/hosting.json retains this project's existing Site ID and declares DB as its public-catalog D1 binding. The source helper manages the exact pushed source and matching deployment archive.

Hosted environment names: NODE_ENV=production, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_DELETE_FUNCTION. Optional HIMALAYAS_API_KEY is server-only. APP_URL can pin the verified HTTPS origin; otherwise the first Worker request establishes the dispatch-provided origin for the isolate. The server still checks every mutation against that origin.

Supabase configuration was transferred to encrypted Site secrets. Passwords, service-role keys and user records were not copied into this repository.

## Verification and limits

The adapter's logic, ownership contracts and public-catalog cold-instance/expiry/closure behaviors have local tests. Type checking and the production build were run. Live-account/email tests are opt-in and are not represented by mock tests.

Local Wrangler browser preview could not start because its separate global-settings folder was outside granted write access. Browser QA of this hosting adapter is therefore unverified. Historical standalone browser checks are documented in VERIFICATION.md and do not substitute for hosted checks.

The Site preserves owner-private access. Deployment does not automatically make it accessible to judges. Supabase email confirmation/recovery also needs the final HTTPS callback allowed in the provider and suitable SMTP; those deliveries remain unverified.

Source data is still one remote-job provider, matching is deterministic and the ChatGPT review is a manual workflow. No vacancy, eligibility, interview or selection guarantee is claimed.

## Credits

Application code is MIT; retain LICENSE, THIRD-PARTY-NOTICES.md and docs/licenses/. The hosting adapter uses the supplied Vinext/Sites starter, its retained scripts/vite/sites-vite-plugin.LICENSE, Cloudflare Worker APIs and Drizzle. Each dependency retains its own license. The original component/template credits continue to apply.

