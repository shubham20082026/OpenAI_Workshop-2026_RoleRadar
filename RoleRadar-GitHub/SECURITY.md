# Security reporting

This is a prototype, not a security certification. See `SECURITY-CHECKLIST.md` and `VERIFICATION.md` for implemented controls, executed checks and open work.

Do not post a working exploit with real user data, credentials, environment files, database exports or private account identifiers in a public issue. If the repository owner enables GitHub private vulnerability reporting, use **Security → Report a vulnerability**. Otherwise, use a private contact route actually published by the owner; no support address is invented here.

A useful report identifies the affected component/version, impact, reproduction with synthetic data and any proposed mitigation. Never test against other students' accounts.

Runtime configuration belongs in an ignored local `.env` or the hosting provider's environment settings. The application should never log/store plaintext passwords or expose service-role keys. Provider sessions, ownership policies and deletion reauthentication must remain intact when adapting the app.

Before public access, complete mail/recovery delivery and HTTPS-host checks, review provider advisors, and repeat isolation tests in a dedicated project. Account deletion removes active application records; provider backups and log retention are separate.
