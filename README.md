# Blog List

Full Stack Open Next.js application, continued in the existing repository. Next.js 16.4, React 19, TypeScript, Tailwind 4, PostgreSQL, Drizzle, and Auth.js credentials/JWT sessions.

## Implemented behavior

- MDX homepage and responsive navigation.
- `/blogs`: persisted blogs sorted by likes, with bookmarkable `/blogs?filter=React` search.
- `/blogs/[id]`: author, URL, creator, atomic likes, personal reading-list saving, creator-only editing/deletion.
- `/blogs/new`: authenticated creation with `useActionState`, server validation, preserved invalid values, and a transaction that also creates the creator's reading-list entry. Logged-out visitors see a sign-in prompt at this URL.
- `/users` and `/users/[username]`: public profiles and blogs, using Drizzle relational joins. Password hashes and API tokens are not included in public queries.
- `/register`, `/login`, logout, and sessions. Passwords are hashed with bcrypt; duplicate usernames are rejected by a database constraint.
- `/me`: authenticated profile, token generation/rotation, and unread/read reading-list sections.
- `GET /api/me`: Bearer-token authentication; returns only id, username, and name; missing/invalid tokens receive 401.
- Global context notifications, including validation errors and mutation success, with automatic dismissal.
- `DELETE /api/testing/reset` and `POST /api/testing/users`: always 403 in production. Outside production they require `ALLOW_TEST_RESET=true`; resets use a transaction and foreign-key-safe deletion order.

## Local setup (PowerShell)

Use a current Node.js LTS release. Start PostgreSQL and create two separate databases: one for development and one disposable database for tests. A Neon URL also works with the `pg` driver.

```powershell
cd C:\Users\turki\blog-list
npm ci
Copy-Item .env.example .env.local
Copy-Item .env.test.example .env.test
```

Fill `DATABASE_URL` and `NEXTAUTH_SECRET` in each local env file. Use different database URLs. Generate an actual random secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run db:migrate
$env:NODE_ENV='test'
npm run db:migrate
Remove-Item Env:NODE_ENV
npx playwright install chromium
npm run dev
```

Auth.js accepts `AUTH_SECRET` / `AUTH_URL`, or the course's `NEXTAUTH_SECRET` / `NEXTAUTH_URL` names. Never set `NODE_ENV=test` for a deployed server. Env files with actual secrets are ignored; only the blank examples are committed.

The implementation session provisioned real, random local credentials and separate PostgreSQL databases on port 55433 for verification. Those ignored `.env.local` and `.env.test` files require that temporary cluster to be running. For ongoing development, supply your own persistent local PostgreSQL or Neon URLs as described above. No external database credentials are fabricated.

The three original hardcoded blog examples are retained in `scripts/seed-original.ts`. After registering a real account, optionally import them for that creator:

```powershell
npm run db:seed -- YOUR_REGISTERED_USERNAME
```

The seed script is idempotent for those URLs and does not create account credentials.

## Verification

Stop any other server on port 3000 before running E2E. The tests reset the configured test database before each test. They run serially because the upstream suite shares one database.

```powershell
npx tsc --noEmit
npm run lint
npm run build
npm run test:production
npm audit
npm audit --omit=dev
npm run test:e2e
npm run test:e2e:ui
```

`test:production` starts the production build on port 3001 and verifies the MDX homepage, unauthenticated API 401, and testing endpoint 403 responses. It deliberately enables `ALLOW_TEST_RESET` to verify the unconditional production restriction.

The original official `tests/blog-app.spec.ts`, `tests/helpers.ts`, and `drizzle.config.ts` were copied byte-for-byte from [fullstack-hy2020/next-js-tests](https://github.com/fullstack-hy2020/next-js-tests). There are 28 official tests. `tests/application-extra.spec.ts` adds six independent tests covering validation, actual creator mutations, a direct unauthorized deletion action, token rotation, reading-list uniqueness/persistence, and responsive layout. No upstream assertion is changed or skipped.

The `.github/workflows/playwright.yml` file is based on the official workflow, with additions for real migrations, opt-in test resets, lint/typecheck/build, and production restrictions. It still installs dependencies and Chromium, runs the official tests, and uploads genuine Playwright results. The repository is https://github.com/Sir-FlexHere/blog-list. CI uses a disposable PostgreSQL 18 service initialized with a random password stored in the CI_POSTGRES_PASSWORD repository secret. DATABASE_URL points to that service; NEXTAUTH_SECRET and NEXTAUTH_URL are also repository secrets. Local results do not prove GitHub Actions passed; consult the actual workflow run.

### Windows sandbox compatibility

Earlier restricted sandbox settings denied native Windows canonical-path and asynchronous directory operations. After the interruption, unrestricted access restored normal commands: npm ci, npm run build with Turbopack, both migrations, TypeScript, ESLint, production guards, and all 34 Playwright tests passed. These sandbox restrictions are no longer a current build blocker. `next.config.mjs` preserves the existing configuration while avoiding native TypeScript config transpilation. The normal dev/build scripts still select the framework's default compiler; these explicit fallbacks are also available:

```powershell
npm run dev:webpack
npm run build:webpack
$env:NEXT_TEST_WEBPACK='true'
npm run test:e2e
```

Before the interruption, verification used an isolated PostgreSQL server, webpack, and split compile/generate phases to work around sandbox restrictions. Final acceptance used the normal Turbopack build and normal npm run test:e2e script, with no external-server or custom-browser override. The two PostgreSQL databases remain separate on port 55433. PostgreSQL recovered its existing data after the power outage.

Optional test-runner environment variables: `PLAYWRIGHT_CHROMIUM_EXECUTABLE` selects an installed Chromium binary, and `PLAYWRIGHT_EXTERNAL_SERVER=true` lets a caller that owns an isolated test server manage its lifecycle. Neither is required in normal local use or GitHub Actions.

### Dependency audit

The esbuild development dependency vulnerability was fixed with a scoped override for `@esbuild-kit/core-utils`. Five high-severity audit entries remain in the development-only chain `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. [The braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists no patched release. The suggested forced fix downgrades Next.js ESLint tooling to version 14, so it was not applied. Production dependencies currently audit clean. Recheck availability of a compatible upstream fix before course submission.

## GitHub Actions, deployment, and course submission

1. The public repository is https://github.com/Sir-FlexHere/blog-list, configured as `origin`. GitHub CLI authentication is valid. If authentication later expires, use `gh auth login -h github.com`.
2. CI repository secrets are configured: `CI_POSTGRES_PASSWORD` and `NEXTAUTH_SECRET` contain actual random values, `DATABASE_URL` authenticates the disposable PostgreSQL service on the runner, and `NEXTAUTH_URL` is `http://localhost:3000`. Each job gets a fresh database; no local or production data is used. The course README describes a Neon test database; this workflow executes the same unchanged official suite against an isolated real PostgreSQL service. A hosted Neon application database is still required for Vercel deployment.
3. Commit the implementation, lockfile, migrations, tests, blank env examples, and workflow. Do not commit `.env.local`, `.env.test`, or generated reports. Push to `main` or `master`, or open a PR targeting either branch.
4. Wait for the GitHub Actions run to pass. Exercise 24 and submission acceptance require this actual remote result.
5. Connect the repository to Vercel. Provision a separate application Neon database, configure its `DATABASE_URL`, random `AUTH_SECRET` (or `NEXTAUTH_SECRET`), and `AUTH_URL` (or `NEXTAUTH_URL`) for the real deployment URL. Leave `ALLOW_TEST_RESET=false`. Run migrations against the deployment database and verify the public application.
6. Submit the repository URL yourself for exercise 25. If private, grant the course reviewer `mattiluukkainen` access. Course submissions and chapter locking were not performed by the implementation agent.

## Course mapping

| Exercises | Implementation / remaining requirement |
| --- | --- |
| 1–6 | Navigation, blogs, creation, detail pages, hidden-field like action, sorting, URL filtering implemented. |
| 7 | Vercel deployment and public URL verification still require account access. |
| 8 | PostgreSQL schema, Drizzle connection and migrations implemented and locally exercised; Vercel/Neon provisioning and deployment validation remain. |
| 9–10 | Users, relations, public username-based profiles implemented. |
| 11–15 | Login/registration and server-side validation with preserved blog values implemented. |
| 16–17 | Context notifications and Tailwind styling implemented. |
| 18–19 | Personal profile, API tokens, authenticated profile endpoint implemented. |
| 20–21 | Automatic reading-list entries, uniqueness, unread/read grouping and persisted status implemented. |
| 22–23 | MDX homepage and production-protected testing endpoints implemented. |
| 24 | Official tests integrated; actual GitHub Actions run pending authenticated remote/secrets. |
| 25 | Repository URL submission is a user action and remains pending. |

Final local acceptance: 28 official tests plus 6 additional tests passed, 0 failed and 0 skipped; TypeScript, ESLint, the normal Turbopack production build, both database migrations, and production testing-endpoint restrictions passed. Actual remote CI, Vercel/Neon deployment, and user course submission remain pending. Consult the final verification report for exact commands and evidence.
