# How RoleRadar was built

RoleRadar is an individual first-year B.Tech prototype for SHOWCASE, the OpenAI Student Collective semester finale. It helps students discover remote internships and early-career roles, inspect the evidence behind a result, and organize their next steps.

Development used substantial ChatGPT/Codex assistance. Code, tests, documentation and template adaptations were generated, reviewed and revised during the build. The account below records the project's decisions and implementation; personal learning and real-user impact still need to be demonstrated by the student presenting it.

## 1. The problem and the pivot

The starting point was a notice-inspection idea called ScamLens: examine potentially confusing placement or internship messages and make evidence visible. That work established useful foundations for bounded inputs, exact-quote validation, private history and account ownership.

The project changed direction after the student reported poor placement opportunities for fourth-year students and scarce internships for third-year students. This was a problem report, not a completed campus study. The resulting question was: how could students find existing opportunities from their skills and judge which ones deserved further investigation?

RoleRadar became a search and decision-support workspace. It cannot increase the supply of jobs. Its intended contribution is to make discovery, inspection and follow-up easier to manage. Shared evidence and account infrastructure from the first prototype remains in the codebase, which explains some legacy internal identifiers.

## 2. Choosing a small, working scope

The MVP centers on a complete path: browse roles, inspect a listing, check its skill evidence, save it, and record a next step. Accounts add private profiles, notes, application statuses, search history and retained AI-review exchanges. Guest browsing and a clearly fictional sample workspace make the product accessible without registration.

CV uploads, automatic applications, employer verification, guaranteed eligibility and interview predictions were left outside the scope. Application statuses are entered by the user; choosing “Applied” does not send an application.

## 3. Retrieving real data and explaining the ranking

The source adapter uses the Himalayas public API. It normalizes remote listings into a consistent shape, preserves source and application links, and handles missing fields explicitly. The app credits Himalayas and keeps the original application destination.

Initial searches retrieve one source page, normally 20 rows, with explicit additional-page requests capped at five. Catalog pages are cached for 24 hours and opening-status checks for 10 minutes. A real rate-limit response during development led to bounded backoff and preservation of partial results rather than repeated requests or invented replacements.

Matching is deterministic JavaScript. It checks selected skills and aliases against retrieved text and returns exact supporting quotes. A count of three mentions is not a hiring probability, a proficiency test, or proof that all requirements are met. Missing country metadata is not silently treated as worldwide eligibility.

The hypothetical-skill preview reranks the same retrieved set with one extra skill. It labels that skill as hypothetical and leaves the profile unchanged. This creates an inspectable interaction: students can see both the changing result order and the actual source sentence behind it.

## 4. Building accounts and data ownership

Supabase Auth manages passwords and sessions. Express keeps provider configuration on the server, verifies authenticated identity and uses HttpOnly session cookies. Same-origin mutation checks and rate limits protect the application endpoints.

Eight linked application tables hold profiles, settings, skills, searches, saved roles, sessions, messages and results. Database Row Level Security enforces ownership; composite owner/session references also protect linked review records. Isolation is enforced beyond which buttons the interface displays.

Exports collect the owner's retained data. Account deletion requires confirmation and password reauthentication, then removes the verified account and linked active records through the deletion function. Provider backups follow separate retention rules. Guest work remains tab-local and does not silently become another account's history.

## 5. What ChatGPT does in the product

The optional AI review is a manual handoff. A user reviews a prompt containing listing evidence and selected skills, copies it to ChatGPT, then imports a JSON response. The app rejects evidence quotes that do not occur in the supplied text before attachment or saving.

This validation establishes a connection to the evidence, not correct reasoning or model origin. Synthetic JSON used in software tests is labeled as test data; it is not presented as a genuine ChatGPT response. The default product does not require an OpenAI API key or run automatic model inference.

During development, ChatGPT/Codex also helped explore scope, implement the source adapter and account flow, review edge cases, and draft tests and explanations. Understanding those generated choices remains part of preparing an honest student presentation.

## 6. Revising the interface from real references

Early versions put too much emphasis on a large search form. Palette changes did not resolve that layout problem. Subsequent feedback and visual references led to a purple bento landing page and a light opportunity workspace.

The landing adapts Magic UI's free MIT Bento Grid demo through the shadcn registry. The workspace adapts the official archived shadcn Mail example using current Maia primitives: a role list beside a selected detail pane on desktop, with Dialog and Sheet interactions on phones. Figtree, Space Grotesk, Lucide and one violet accent connect the screens. Upstream sources and retained licenses are documented in [design sources](../DESIGN-SOURCES.md).

## 7. Verification and the next evidence to collect

The recorded local suite has 53 passing checks and one skipped opt-in live case. It covers shared authentication/evidence logic alongside career routes, matching and source handling. Earlier live checks exercised SQL ownership policies and disposable Supabase accounts. Browser checks covered responsive layouts, filter drafts, skill previews, saved roles and historical labels. These results establish software behavior, not student benefit or job-match accuracy; see [verification](../VERIFICATION.md).

The next steps are concrete: test the prototype with three real students and record actual time, false leads and resulting changes; configure and test public email confirmation/recovery; demonstrate a genuine ChatGPT review from the exact evidence shown; and deploy the Node application on HTTPS. Those items remain pending. No placement outcome, measured time saving or selection guarantee is claimed before the relevant evidence exists.
