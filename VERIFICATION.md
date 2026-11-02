# RoleRadar verification

Evidence recorded through **2 November 2026**. Local software checks, historical provider tests and user-impact validation are separate. Passing tests do not establish hiring effectiveness or a security certification.

## Fresh source-copy checks

The delivery was checked in a separate source copy on 2 November 2026 with Node 24.21.0 and npm 11.19.0, without a configured `.env`. No live provider test was enabled. The running development app was left untouched.

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 227 packages installed from the lockfile |
| `npm test` | Passed: 53 passed, 0 failed, 1 opt-in live case skipped |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; non-blocking large-chunk warning |
| Production dependency audit | 0 reported vulnerabilities at execution time |
| Relative links | All local targets resolved in 30 Markdown files |
| Source/package scan | 69 code/test/schema files match the working source; no configured private values, project hostname or personal paths found |
| Source-only archive | Checked after packaging; no environment file, dependencies, build output, Git history or local tool metadata included |

The local suite has 54 cases. It includes 37 shared authentication/evidence foundation checks and 16 career route/matching/source checks, plus the skipped opt-in live case. The shared engine and some tests remain from the earlier notice-inspection prototype; these are not 53 independent career features.
The included GitHub Actions workflow runs local checks without provider secrets. It has not run on a remote repository yet.

## Historical controlled Supabase checks

These checks used the development project's real Supabase service before packaging. A downloaded copy must configure and verify its own project; no credentials or cloud deployment are included.

- Base SQL isolation: **16 assertions passed**, fixtures rolled back.
- Career SQL isolation: **12 assertions passed**, fixtures rolled back.
- Foundation application runner: **nine checks passed**, including invalid credentials, independent accounts, cross-owner IDs, evidence validation, settings/export, returning history and password-confirmed self-deletion.
- Career application runner: **eight integration groups passed** with two disposable SQL-provisioned, email-confirmed accounts:

  1. Provider logins, distinct identities and HttpOnly cookies.
  2. Private skill updates without changing another account.
  3. Retained searches; guessed other-owner search IDs return 404.
  4. Saved roles, notes/status and duplicate preservation; cross-owner mutation returns 404.
  5. Invented AI quotes rejected; explicitly synthetic valid-quote QA JSON retained.
  6. Exports contain only the owner's retained data.
  7. Logout/login restores skills, notes, search and review history.
  8. Both test accounts self-delete; later logins fail.

The first career run encountered a local keepalive reset. Its complete rerun used connection-close requests and passed without disabling auth protection. Final queries found no temporary career identities or records; earlier base fixtures were checked separately. Credentials were excluded from delivery.
**Confirmed SQL fixtures test login and ownership, not public email signup or delivery.** A historical provider advisor reported leaked-password protection disabled; each deployment must review its own settings.

## Source and UI checks already performed

- A live India internship request returned 20 retrieved rows during development. Counts change; no fixed vacancy total is promised.
- A real second-page 429 led to one-page initial requests, cached partial results and bounded retries. Local tests cover this and open/closed/missing/unavailable states.
- Original application links and exact skill evidence were inspected; no application was submitted.
- Hypothetical SQL reranked the same results while the actual Python/Git profile stayed unchanged.
- Desktop (1280x900) and phone (390x844) checks covered landing, guest entry, signup, role selection, detail/back navigation, staged filters, saved roles and snapshot labels. No page-level horizontal overflow or console errors were observed in inspected flows; this is not a full device/accessibility audit.
- Switching roles during a pending status request did not display the earlier role's response on the new role. Identity/workspace guards remain in code.
- Browser assets were checked for configured provider values, privileged-key markers and remote-font URLs. Fonts are bundled locally.
- Current previews: [landing](docs/previews/landing.png), [workspace](docs/previews/workspace.png). Screenshots do not prove current listing availability.

The fresh-copy JavaScript bundle is approximately 562 kB uncompressed / 173 kB gzip and triggers the build's 500 kB chunk warning. Code splitting remains an improvement.

## Still pending

- Actual signup/confirmation/recovery delivery and callback tests with suitable SMTP and scoped redirect allowlists.
- A genuine ChatGPT review from the supplied evidence. Synthetic QA JSON does not count as model output.
- Three real student tests, reactions, resulting changes and measured before/after results. No measured time saving or employment outcome is claimed.
- Public HTTPS Node hosting, Secure-cookie checks there and a fuller accessibility/device/abuse review.

Coverage is remote roles from one provider, not the full internship market or campus placements. Skill mentions do not establish proficiency, eligibility or hiring probability. See [product plan](docs/ROLE-RADAR-PLAN.md) and [security checklist](SECURITY-CHECKLIST.md).
