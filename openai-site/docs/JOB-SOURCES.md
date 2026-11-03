# Job source and data terms

Verified 1 November 2026 against [Himalayas API documentation](https://himalayas.app/docs/remote-jobs-api) and its linked [terms](https://himalayas.app/terms).

The public JSON API permits displaying listings in an app with visible Himalayas credit and unchanged `applicationLink` destinations. RoleRadar uses those links, credits the source on cards/details, and adds no JobPosting structured data or redistribution feed.

The source refreshes data daily. Catalog pages are cached locally for 24 hours; source opening checks are cached for 10 minutes. Public quotas are shared and may return 429. Later-page failures retain earlier results and a visible partial/error state. A server-only free API key is optional for higher limits.

Only country, opportunity type, pagination and source sorting are sent upstream. Skills and keywords are ranked/filtered locally on our server. No account identifier or CV is sent to the feed. The server does not fetch employer application pages or scrape job pages.

Dates are labeled source updates, not invented original-post dates. Salary values retain their stated currency and pay period. Missing pay remains missing. Listings may be inaccurate or restricted to a campus/year; an open-state response does not authenticate the employer or establish eligibility.

Coverage is one remote-job provider. A saved search retains at most 20 result snapshots, labeled historical. Fictional demo records are separate and have no application destination.
