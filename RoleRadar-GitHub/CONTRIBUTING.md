# Contributing

RoleRadar is a student prototype. Useful contributions improve a concrete search, evidence, privacy or reliability problem rather than adding an unsupported placement claim.

1. Read `README.md`, `docs/SETUP.md` and `DESIGN-SOURCES.md`.
2. Use Node 24 and `npm ci` from the repository root.
3. Use guest/demo mode or your own dedicated test Supabase project. Never point destructive integration runners at real student accounts.
4. Keep the same-origin server boundary and database ownership enforcement. Do not replace RLS with UI-only filtering or expose provider secrets to the browser.
5. Keep original source links, visible Himalayas credit, explicit fictional examples and truthful freshness/eligibility limits.
6. Keep the existing component system, accessibility labels and third-party license notices. Add notices for new dependencies/assets.

Before proposing a change, run:

```sh
npm test
npm run typecheck
npm run build
```

Explain the problem, resulting behavior, checks performed and remaining limits. Use synthetic examples in bug reports. Do not post credentials, CVs, private notes, user exports or another student's personal information.

AI-assisted contributions should be reviewed and tested, with the assistance described honestly. Do not submit invented user feedback, fake model output or fabricated impact numbers.
