# OpenAI deployment

The existing standalone app and your latest app/landing changes were preserved. The deployable OpenAI hosting adapter is in [openai-site](openai-site/README.md).

It uses the supplied Sites/Vinext starter and Cloudflare Node HTTP bridge, preserves Supabase ownership checks, and shares only canonical public job listings through the hosting database. No real environment file, credentials, dependency folder, build output or Git history was copied into the adapter.

Verification: 66 local tests passed, one live-account case skipped; type checking and production build passed. Production dependency audit reported zero vulnerabilities. Local Wrangler browser verification was blocked by its global-settings folder access; hosted browser/email flows are not represented by local unit tests.

The Site keeps owner-private access. Supabase confirmation/recovery delivery needs suitable SMTP and the final HTTPS callback allowed in the provider. See [hosting notes](openai-site/OPENAI-HOSTING.md).

## Confirmed live deployment

[Open RoleRadar](https://roleradar.satingull2.chatgpt.site)

OpenAI Sites confirmed successful publication on 3 November 2026. Access remains owner-private. The hosting service result is saved in [OPENAI-DEPLOYMENT-RESULT.json](OPENAI-DEPLOYMENT-RESULT.json). Browser and email-flow verification remain as stated above.

The live smoke check found a Worker bridge without a socket IP; the hosted adapter now derives its rate-limit bucket from the platform edge header, with a shared conservative fallback. Standalone proxy trust and account ownership checks remain intact.

Live HTTP verification passed six checks: homepage, server configuration, private-profile protection, foreign-origin rejection, correct-origin validation and explicit source-state handling. The provider returned no listings during this check; sample mode remains explicitly fictional. Email signup/recovery and full browser flows remain unverified.
