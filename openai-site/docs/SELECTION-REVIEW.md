# RoleRadar selection review — 2 November 2026

**Verdict: a credible prototype and a possible shortlist contender, but not a confident yes yet.** This is product judgment, not a prediction: SHOWCASE's exact criteria and competing entries are unknown. Brighter colors and a friendlier interface improve presentation; they do not establish originality, AI depth or impact.

## Evidence available today

| Area | Working / documented | Still pending |
| --- | --- | --- |
| Product | Real Himalayas remote-job retrieval, exact skill-mention evidence, hypothetical extra-skill reranking, source-status checks, saved roles and notes | Evidence that this helps reachable students find plausible opportunities faster |
| Accounts and ownership | Supabase login, private career records, history, export and deletion exercised with disposable test accounts; database isolation assertions passed | Real public email signup/confirmation/recovery delivery and public HTTPS hosting |
| AI | A reviewed ChatGPT prompt, manual response import and exact-quote validation | A genuine end-to-end ChatGPT review demonstration; matching itself is deterministic JavaScript, not AI |
| User evidence | Students have reported difficulty finding placements/internships | Three actual user tests, recorded reactions, changes made and before/after measurements |
| Coverage | Remote roles from one provider, with explicit source and retrieval limits | Demonstrated usefulness for the target campus/year; skill mentions and country metadata do not establish eligibility |

Software check details and dates are in `../VERIFICATION.md`. Those checks are not employment outcomes or proof of usefulness.

## Why the idea is not distinctive enough by itself

The likely neighboring entries are a career chatbot, an internship recommender and a résumé/job matcher. Accounts, recommendations and tracking already exist in commercial products:

- [Simplify's official Job Matches guide](https://help.simplify.jobs/articles/2166608-use-your-job-matches) describes recommendations from a profile and preferences, with saved roles in Job Tracker.
- [Teal's official Job Matcher guide](https://help.tealhq.com/en/articles/12060992-using-the-job-matcher) describes job matching; its [Job Tracker page](https://www.tealhq.com/tools/job-tracker) describes saved jobs, tracking and matching tools.

These primary sources support the category-overlap concern, not a claim that RoleRadar exactly duplicates every feature. RoleRadar's best current presentation angle is an inspectable skill preview with exact listing evidence and candid source freshness. Whether students value that difference remains untested.

## Top three actions before Round 1

1. **Test three reachable students on a concrete task.** Ask each to find three roles they would genuinely consider using their usual method and RoleRadar on comparable tasks. Record time, plausible roles, false leads, confusion and one change made because of feedback. Vary task order where practical. Obtain agreement; collect no CVs or credentials. Publish only the actual small-sample results and limitations.
2. **Demonstrate the actual AI contribution.** Run one genuine ChatGPT role review, inspect its quotes, retain the prompt and response with consent, and show rejection of an invented quote using an explicitly synthetic test. Say clearly that quote validation checks provenance, not reasoning quality, and matching is not model inference.
3. **Make the target group's path reliable.** Use the user tests to identify the main source/eligibility failure and fix that specific failure. Check the chosen demo roles' actual restrictions, source state and application links; rehearse the real workflow and labeled fictional fallback. Finish public email/HTTPS setup before inviting arbitrary users, or present honestly as a local prototype.

## First 20 seconds: dynamic-count demonstration

Prepare by loading actual source results with Python/Git. Confirm the source timestamp under Skills & filters → About these results, then keep the cache label visible. This preparation is not a new live search during the timed demonstration.

| Time | Action | Exact narration |
| --- | --- | --- |
| 0–5 seconds | Show the retrieved roles and Python/Git profile | “These are source listings ranked by mentions of my skills.” |
| 5–10 seconds | Choose the hypothetical SQL preview; point to the displayed count | “If I explored SQL, this many retrieved roles mention it.” Read the actual count shown. |
| 10–17 seconds | Open a role that mentions SQL and show its exact evidence quote | “Here is the source sentence. SQL stays hypothetical; my profile has not changed.” |
| 17–20 seconds | Keep the evidence visible | “I can inspect why a role appears before deciding whether to apply.” |

If no retrieved role mentions SQL, use another genuinely displayed unselected skill or state that the current sample has none; never force a fixed count or substitute fictional roles as real openings. If the source is unavailable, use the explicitly labeled fictional fallback and disclose that it demonstrates interaction, not live availability. Show source-status checks after the opening if network latency makes them unsuitable for the first 20 seconds.

## Honest selection claim

“I built a working, source-backed search workspace and tested its account isolation. I am validating whether its evidence and skill preview reduce search effort for students.” Only add real-user numbers or claims after those observations exist. No winning probability or unearned distinctiveness score is asserted.
