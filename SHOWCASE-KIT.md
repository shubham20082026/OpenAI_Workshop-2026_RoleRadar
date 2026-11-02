# RoleRadar — SHOWCASE kit

## Submission draft (under 300 words)

RoleRadar helps students explore real remote internships and early-career roles, then inspect the evidence behind a result.

Students can enter as guests from the landing page. A compact search and skill-filter panel lead to a browsable opportunity list. Selecting a role shows its listing, source, skill evidence and application destination beside the list on desktop, or in a mobile detail dialog. Skill counts are not hiring probabilities or eligibility decisions.

The central interaction is a hypothetical skill preview: choose one additional skill and watch the same retrieved roles rerank. The student's profile stays unchanged, and exact source quotes show what the listing actually mentions. A separate source-status check can report whether the provider still lists an opening.

Supabase-managed accounts support private skill profiles, saved roles, notes, self-reported application statuses, search snapshots and AI-review history. Database Row Level Security enforces ownership. Users can export or delete active account data. Guest work is tab-only; fictional examples are clearly labeled.

For interpretation, users can review a prompt, paste it into ChatGPT and import the JSON response. Exact evidence quotes must occur in the supplied listing before attachment. This is a manual handoff; quote validation does not verify reasoning or model origin.

The prototype covers one remote-job provider with visible cache, pagination and source-failure limits. It does not verify employers, decide eligibility, submit applications or guarantee interviews. Technical account-isolation checks have run. Real public email delivery, HTTPS hosting and a three-student study remain pending; no search-time savings or placement outcomes are claimed before measurement.

## Entry flow and preparation

- Public root: purple bento landing. **Explore opportunities** opens the clean light guest workspace and automatically retrieves one source page, normally 20 rows. The list retains source credit and cache/live labels.
- **Sign in** opens the light shadcn login-03 form. Use a real prepared account only when demonstrating durable private history; guest history is tab-only.
- **How it works** in the landing navbar scrolls to the bento section.
- The landing preview uses fixed public example skills Python/SQL/Git, never the visitor's private profile. Its fictional fallback is explicitly labeled.
- Before presenting, warm the source cache and inspect the current listings. Choose a genuinely mentioned skill absent from the current profile, such as Docker, and identify a visible role whose exact evidence includes it. The timed script below uses Docker only if this check succeeds; otherwise choose an actually supported unselected skill. Never force a fixed count or present fictional data as live.
- Prepare a genuine ChatGPT response from the exact role evidence being demonstrated. No alleged model response is supplied by this kit. If prepared beforehand, call it a prepared response rather than a live AI call.

## Three-minute click flow

| Time | Click/action | Say |
| --- | --- | --- |
| 0:00–0:20 | On the landing, click **Explore opportunities**. In the already-warmed workspace, open **Skill to preview**, choose **Preview Docker** (or the preverified alternative), select the corresponding role and open **Skill evidence**. | “What would one more skill change? This is a hypothetical preview. Here are the actual source words.” Read the displayed count; the profile stays unchanged. |
| 0:20–0:50 | Open **Overview**. Point out an actual graduation-year, campus, experience or location restriction in the chosen listing. | “A skill mention is not the same as eligibility. I still need to inspect the requirements.” |
| 0:50–1:10 | Click **Check status** and read its actual response/cache timestamp. | “This asks the source whether it still reports the opening. An open state does not verify the employer or guarantee a response.” |
| 1:10–1:45 | Open **AI review**. Show the prompt; paste the genuine prepared response and click **Validate and attach**. Replace a quote with an absent phrase and validate again, then restore the real response. | “ChatGPT helps interpret the listing through a manual handoff. Invented quotes are refused; valid quotes still do not prove correct reasoning.” |
| 1:45–2:10 | Click **Save role**. Open the sidebar if collapsed, then **Saved roles** → **Edit notes / remove**. Add a note; show the status selector. | “I can keep next steps together. Marking Applied does not send an application.” State whether this is tab-only guest storage or a real account. |
| 2:10–2:35 | Open **Search & AI history**, then **Skills & settings**. Point to **Download my data** and account deletion or local-discard controls. | “Accounts retain their own history; guests keep work only in this tab. Data controls are part of the product.” Do not claim cloud persistence while using a guest. |
| 2:35–3:00 | Show the final limits slide. If asked about counts/timestamps, open **Skills & filters** → **About these results**. | “One remote source is not the whole placement market. The next test is whether this reduces real students' search effort.” Include user-test numbers only after collecting them. |

Desktop detail stays beside the list. On phones, selecting a role opens a dialog; **Back to results** returns to the list. Network latency may require moving the source-status check later. A cached page is a cached page, not a new live request.

## Six slides

1. **“Would this opening actually be worth investigating?”** One real listing and an overlooked restriction.
2. **The reachable task.** Students searching for internships; describe only behavior actually observed.
3. **The working product.** Purple bento entry, light opportunity browser, hypothetical skill, exact source quote and source-state check.
4. **What AI does.** Optional interpretation; manual prompt → JSON → quote validation. Separate it from deterministic matching.
5. **What was tested.** Actual software/isolation checks; add real-user results only after performing the study.
6. **What it cannot do yet.** One remote source, bounded pages, rate limits; no employer verification, eligibility decision, automated application or placement guarantee. Public email/HTTPS and real-user validation remain pending.

## Ten judge questions

1. **Is this novel?** Job matching is crowded. The contribution is inspectable evidence and the workflow, not a new recommendation model. Distinctiveness still needs honest evaluation.
2. **Where is AI?** In the optional manual ChatGPT review. Ranking is deterministic. AI also assisted development; explain only code and tests personally understood.
3. **Why not use ChatGPT?** It can analyze a pasted listing. This app supplies source retrieval, records, status checks, private history and reproducible quote matching around that analysis.
4. **Does a match mean I qualify?** No. Skill mentions neither establish requirements nor prove proficiency. Campus/year/location/experience restrictions still need review.
5. **Are the openings invented?** Source mode uses Himalayas. The landing can show source previews with fixed public example skills; unavailable data falls back to clearly labeled fiction. Fictional roles have no live application link.
6. **How fresh is it?** The source refreshes daily; catalog pages are cached for 24 hours and status checks for 10 minutes. Live/cached/saved states and source errors are explicit; About these results contains dates and counts. A role can close earlier.
7. **What about privacy?** Supabase stores account data; RLS limits users to their own records. The feed receives country/type/page filters, not private profiles. The landing's request uses fixed example skills, not a signed-in visitor's skills. Users choose any text shared with ChatGPT.
8. **Why only some roles?** Initial requests fetch one source page. More pages are explicit and capped at five; source quotas can interrupt retrieval. This is not all campus placements or all Indian opportunities.
9. **What impact is proven?** Technical operation has been tested. Search-time improvement and employment outcomes have not been established. Report the three-student study only after conducting it.
10. **Can everyone sign up today?** Arbitrary public email confirmation/recovery needs configured SMTP/redirects and a hosted HTTPS app. Tests with disposable accounts validate provider login/data behavior, not public email delivery.

## Fallback

Build and rehearse on the presentation laptop. The landing's **Try the sample workspace** and the browser's **Try sample results** open explicitly fictional examples; say what they are. A warmed local process may retain cached source pages, but a fresh offline process has no live catalog. Prepare a recording and a genuine ChatGPT response from an exact source snapshot if needed. Never label a replay, fabricated example or prepared model response as a new live result.

## Learning statement

Use only after personally doing the work: “ChatGPT helped draft and review the app. I traced the source adapter, learned why exact evidence matters, ran ownership checks with two accounts, and fixed failures I could explain. I adapted the public Magic UI Bento demo and shadcn Mail layout while retaining their licenses. I did not train a model or establish placement impact.”
