# RoleRadar on OpenAI

**[Open the live site](https://roleradar.satingull2.chatgpt.site)**

OpenAI Sites confirmed successful deployment on 3 November 2026. Access remains **private to the owner's account**. The deployment result and exact source/version identifiers are in [OPENAI-DEPLOYMENT-RESULT.json](OPENAI-DEPLOYMENT-RESULT.json).

## Changes in this folder

The deployable hosting version is under [openai-site](openai-site/README.md). Your standalone project and latest app/landing edits are preserved. The root README links here, and .gitignore protects the adapter's local runtime files.

The hosted copy preserves the existing UI, Supabase ownership checks and private history. A Worker bridge serves the Express API. D1 stores only canonical public listing data across server instances; user profiles, notes, searches and messages remain in Supabase. No configured environment file, keys, installed dependencies, build output or Git history was copied into the adapter.

## Verified

- 66 local tests passed; one opt-in live-account test skipped.
- Type checking and production build passed.
- Production dependency audit reported zero vulnerabilities at execution time.
- Seven live HTTP checks passed: homepage, configured account services, protected private profile, rejected foreign origin, accepted correct origin before input validation, real source search, and resolution of the returned listing ID through the shared catalog.
- The real source returned **20 listings** and reported the tested opening **open** during this check. Counts and availability change; these are observations, not fixed claims.

The live checks found and resolved two hosting compatibility defects: missing socket IPs in rate limiting, and an unsupported fetch redirect mode. Limits retain an edge-derived bucket and conservative fallback. Source fetches use manual redirect handling, so redirects still cannot silently move credentials to another destination.

## Remaining account-email setup

The hosted server has the existing Supabase configuration. Public signup confirmation/recovery delivery remains unverified and needs suitable SMTP plus the production callback allowed in Supabase:

`https://roleradar.satingull2.chatgpt.site/api/auth/callback`

Set the provider Site URL to the live origin and use scoped redirect rules accommodating the SDK's query parameters. Do not disable confirmation to simulate success. See [setup](openai-site/docs/SETUP.md) and [hosting notes](openai-site/OPENAI-HOSTING.md).

The live checks do not establish a real signup/reset delivery, a full browser/device audit, student time savings or hiring outcomes. Matching remains deterministic and the ChatGPT review remains manual.
