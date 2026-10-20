# ISMS Gap Analysis & Compliance Tracking Platform

A web application for Information Security Management System (ISMS) gap analysis and ongoing
compliance tracking (Northern Rivers Local Health District academic scenario).

> Academic project based on a supplied brief. It is not an official NRLHD system.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL 16 · Prisma · Zod

**Repository:** https://github.com/Rana-1412/ISMS.git

---

## How to run this project (A → Z)

Follow these steps on **your** computer after cloning. You do **not** need anyone else’s `.env`
file. Passwords and secrets are never stored in Git.

### 0. What you need

| Tool | Version | Why |
| ---- | ------- | --- |
| Git | any recent | download the code |
| Node.js | **20 or newer** | run `npm` and the Next.js app |
| PostgreSQL | **16** recommended | store all application data |

---

### 1. Install Node.js

1. Download **LTS** from https://nodejs.org/ (v20+).
2. Install it. On Windows, keep **Add to PATH** checked.
3. Open a **new** terminal and run:

```bash
node -v
npm -v
```

Both must print a version number.

---

### 2. Install PostgreSQL and create an empty database

Tables are **not** created by hand in SQL (except the empty database name). Prisma creates every
table from migration files (Step 6).

#### Windows (installer)

1. Download: https://www.postgresql.org/download/windows/
2. During setup, set a password for user `postgres` and keep port **5432**.
3. In **Services**, confirm `postgresql-x64-…` is **Running**.
4. Create an empty database:

```sql
CREATE DATABASE isms;
```

Or:

```bash
psql -U postgres -c "CREATE DATABASE isms;"
```

#### Docker (easiest if Docker Desktop is installed)

```bash
docker run --name isms-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=isms -p 5432:5432 -d postgres:16
```

This already creates database `isms` with user/password `postgres` / `postgres` (same as
`.env.example`).

```bash
docker stop isms-postgres
docker start isms-postgres
```

#### macOS (Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
createdb isms
```

---

### 3. Clone this repository

```bash
git clone https://github.com/Rana-1412/ISMS.git
cd ISMS
```

---

### 4. Install npm packages

```bash
npm install
```

This installs Next.js, React, Prisma, Zod, and other dependencies from `package-lock.json`.

---

### 5. Create your `.env` file

`.env` is gitignored. Copy the example and edit it.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
notepad .env
```

**macOS / Linux:**

```bash
cp .env.example .env
nano .env
```

Required values:

```env
# USER / PASSWORD = your PostgreSQL login
# Docker example above → postgres / postgres
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/isms?schema=public"

# At least 32 characters. Generate with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
AUTH_SECRET="paste-your-generated-secret-here"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
EVIDENCE_STORAGE_DIR="./storage/evidence"
```

Save the file.

---

### 6. Create all tables in PostgreSQL (Prisma migrations)

The empty database `isms` has **no tables** yet. Prisma applies SQL from
`prisma/migrations/` and creates every table, index, and foreign key.

From the project folder run:

```bash
npm run db:generate
npm run db:deploy
```

| Command | What it does |
| ------- | ------------ |
| `npm run db:generate` | Builds the Prisma Client used by the app |
| `npm run db:deploy` | Runs **`prisma migrate deploy`** — applies all migration SQL files and **creates the tables** |

If `db:deploy` is not available for any reason, the same thing is:

```bash
npx prisma generate
npx prisma migrate deploy
```

#### What tables get created?

Defined in `prisma/schema.prisma`. After a successful migrate, PostgreSQL contains:

| Table (Prisma model) | Purpose |
| -------------------- | ------- |
| `Organization` | Organisation profile |
| `Site` | Sites in scope |
| `Role` | Roles (Administrator, Assessor, …) |
| `RolePermission` | Permission codes per role |
| `User` | Login accounts |
| `Framework` | Framework catalogue (e.g. ISO 27001) |
| `ControlTheme` | Control themes (A.5, A.6, …) |
| `Control` | Individual controls |
| `RegisterEntry` | Statement of applicability / register |
| `Assessment` | Gap assessments |
| `AssessmentItem` | Per-control findings |
| `Gap` | Gaps raised from findings |
| `Evidence` | Uploaded / linked evidence |
| `EvidenceLink` | Links evidence to controls / gaps / actions |
| `RemediationAction` | Corrective actions |
| `RemediationComment` | Comments on actions |
| `AuditLogEntry` | Append-only audit log |
| `Notification` | In-app notifications |

Migration history lives under `prisma/migrations/` (SQL files). You do **not** need to run those
SQL files manually — `npm run db:deploy` runs them in order.

#### Optional: browse the database

```bash
npm run db:studio
```

Opens Prisma Studio in the browser so you can see tables and rows.

---

### 7. Load demo / reference data (seed)

Tables are still mostly empty. Seed fills organisation, sites, roles, demo users, and the
ISO/IEC 27001:2022 Annex A catalogue.

```bash
npm run db:seed
```

This runs `tsx prisma/seed.ts`. It uses **upserts**, so you can run it more than once without
duplicating users or controls. It does **not** invent fake assessments/gaps — those are created
only when people use the app.

---

### 8. Start the application

```bash
npm run dev
```

Open **http://localhost:3000**

Stop with `Ctrl + C`.

Production-style run (optional):

```bash
npm run build
npm run start
```

---

### 9. Login (demo accounts)

Created by `npm run db:seed`. Local use only.

| Email | Password | Role |
| ----- | -------- | ---- |
| ahsan@nrlhd.health.nsw.gov.au | Administrator1 | Administrator |
| ali@nrlhd.health.nsw.gov.au | Assessor12345 | Assessor |
| imran@nrlhd.health.nsw.gov.au | Approver12345 | Approver |
| hasnain@nrlhd.health.nsw.gov.au | Controlowner1 | Control Owner |

---

### Full command sequence (copy-paste)

After Node.js + PostgreSQL are installed and database `isms` exists:

```bash
git clone https://github.com/Rana-1412/ISMS.git
cd ISMS
npm install
cp .env.example .env
# edit .env → DATABASE_URL and AUTH_SECRET
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

**Windows PowerShell** for the env copy:

```powershell
Copy-Item .env.example .env
# then edit .env, then:
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

---

### Checklist

```text
[ ] Node.js 20+                 →  node -v / npm -v
[ ] PostgreSQL running          →  port 5432
[ ] Empty DB created            →  CREATE DATABASE isms;  (or Docker)
[ ] git clone + cd ISMS
[ ] npm install
[ ] .env from .env.example      →  DATABASE_URL + AUTH_SECRET (32+)
[ ] npm run db:generate         →  Prisma Client
[ ] npm run db:deploy           →  CREATES ALL TABLES
[ ] npm run db:seed             →  demo users + ISO catalogue
[ ] npm run dev                 →  http://localhost:3000
[ ] Login with a demo account
```

### Common problems

| Problem | Fix |
| ------- | --- |
| `node` / `npm` not found | Reinstall Node LTS; open a **new** terminal |
| Cannot connect to database | Service/Docker running? Password in `DATABASE_URL` correct? Database `isms` exists? |
| `AUTH_SECRET` error | Must be **32+** characters |
| `db:deploy` / migrate fails | Fix `DATABASE_URL`, ensure DB exists, run again |
| Port 3000 in use | `npx next dev -p 3001` |
| No demo users | Run `npm run db:seed` |

### Useful npm scripts

| Script | Purpose |
| ------ | ------- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:deploy` | **Apply migrations → create/update tables** |
| `npm run db:migrate` | Create a new migration while developing (devs only) |
| `npm run db:seed` | Load demo / reference data |
| `npm run db:studio` | Browse PostgreSQL in the browser |
| `npm run db:push` | Push schema without migration files (not for normal setup) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

---

## Tech stack

| Concern | Choice |
| ------- | ------ |
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | React 19, Tailwind CSS v4, lucide icons |
| Database | PostgreSQL 16 via Prisma ORM |
| Validation | Zod |

Frontend and backend live in the same Next.js project: React Server Components render the screens
and Route Handlers under `src/app/api` expose the HTTP API.

## Architecture

The codebase follows a clean, layered architecture. Dependencies always point inwards:
`presentation → application → domain`, with infrastructure plugged in from the outside.

```
src/
  proxy.ts                 Page-level route protection.
  app/                     Presentation. Pages and thin API route handlers.
    (app)/                 Authenticated application shell and screens.
    login/                 Public sign-in screen.
    api/                   HTTP endpoints; parse input, call a use case, return JSON.
  modules/                 One folder per feature module.
    auth/, framework/, organization/
      domain/              Framework-free entities and business rules.
      application/
        ports/             Interfaces the module needs (e.g. repositories).
        use-cases/         Business operations, one file per operation.
        schemas.ts         Zod input contracts.
      infrastructure/      Prisma implementations of the ports.
      presentation/        Guards used by routes and server components.
      index.ts             Composition root: wires use cases to implementations.
  shared/                  Cross-module kernel.
    api/                   HTTP helpers, error mapping, request validation.
    core/                  Result type, error hierarchy, pagination.
    utils/                 Small pure helpers.
  infrastructure/          Technical services shared by all modules.
    config/                Validated environment configuration.
    database/              Prisma client singleton.
  components/              Reusable UI. No business logic, no database access.
```

Rules that keep the layers honest:

- Domain code never imports Prisma, React or Next.js.
- Use cases depend on ports (interfaces), never on Prisma directly.
- Route handlers contain no business logic.
- Only `modules/*/index.ts` decides which implementation a use case receives.

## Module plan

| #   | Module                | Status |
| --- | --------------------- | ------ |
| 0   | Foundation            | Done   |
| 1   | Authentication & RBAC | Done   |
| 2   | Framework & Controls  | Done   |
| 3   | Control Register      | Done   |
| 4   | Assessment            | Done   |
| 5   | Gap Management        | Done   |
| 6   | Evidence              | Done   |
| 7   | Remediation           | Done   |
| 8   | Dashboard & Reports   | Done   |
| 9   | Audit Log             | Done   |

## Authentication and access control

Sign-in issues a signed JWT stored in an `httpOnly` session cookie (8 hour lifetime). Passwords are
hashed with bcrypt. Protection is applied in two places:

- `src/proxy.ts` redirects anonymous visitors from any page to `/login`.
- API routes and server components call `requirePermission(...)`, which returns JSON `401`/`403`
  instead of a redirect.

Screens and endpoints always check a **permission**, never a role. The role to permission matrix
lives in `src/modules/auth/domain/permissions.ts`, so access rules can change in one file.

| Role                          | Can do                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| Administrator                 | Everything, including user and role administration           |
| Assessor / Compliance Officer | Register, assessments (conduct/submit), gaps, evidence review |
| Approver                      | Approve assessments, confirm gap closure, review evidence    |
| Control Owner                 | Read compliance data, upload evidence, update assigned work  |

## Control catalogue

The framework the organisation is measured against is stored as data, not code. The full
**ISO/IEC 27001:2022 Annex A** catalogue is held in
`prisma/data/iso-27001-2022-annex-a.json` and loaded by the seed script:

| Theme | Name                    | Controls |
| ----- | ----------------------- | -------- |
| A.5   | Organizational controls | 37       |
| A.6   | People controls         | 8        |
| A.7   | Physical controls       | 14       |
| A.8   | Technological controls  | 34       |
|       | **Total**               | **93**   |

### Attributes

ISO/IEC 27002:2022 defines **five** control attributes. This project models three of them, because
they are the three the application actually uses — for catalogue filtering and as inputs to the
risk model:

| Attribute                         | Values used here                                    | Modelled |
| --------------------------------- | --------------------------------------------------- | -------- |
| Control type                      | Preventive, Detective, Corrective                    | Yes      |
| Information security properties   | Confidentiality, Integrity, Availability             | Yes      |
| Cybersecurity concepts            | Identify, Protect, Detect, Respond, Recover          | Yes      |
| Operational capabilities          | 15 values (governance, asset management, …)          | No       |
| Security domains                  | Governance and ecosystem, Protection, Defence, Resilience | No  |

The value sets for the three modelled attributes are complete, so a filter never silently hides a
control. See `src/modules/framework/domain/attributes.ts`.

### Source and licensing

The JSON file holds each control's reference, title, a short purpose and a paraphrased description
written for this project. It does **not** reproduce the wording of the published standard, and the
attribute values recorded against each control are this project's own reading of that control
rather than a copy of the standard's attribute tables. ISO/IEC 27001:2022 and ISO/IEC 27002:2022
remain the authoritative texts and must be purchased from ISO or a national standards body.

Adding a second framework, such as the ASD Essential Eight, only requires another JSON file — no
schema or assessment logic changes.

## Project-defined logic (not ISO requirements)

ISO/IEC 27001 requires an organisation to define its own risk criteria and corrective action
process; it does not prescribe a formula, a scale or a deadline. Everything in this section is
this application's own methodology. It is stated here, and in code comments, so nothing in the
system is mistaken for a requirement of the standard.

### Risk scoring model

Defined once in `src/config/risk-policy.ts` and applied in `src/modules/gap/domain/risk.ts`. Four
factors, scored out of 12:

| Factor                       | Points | Basis                                                       |
| ---------------------------- | ------ | ----------------------------------------------------------- |
| Severity of the finding      | 0–5    | Non-compliant 5, Partially compliant 2                       |
| Security objectives affected | 0–3    | One point per confidentiality / integrity / availability     |
| Type of control              | 0–2    | Preventive 2, Detective or Corrective 1                      |
| Implementation in register   | 0–2    | Not implemented 2, Planned or Partial 1, Implemented 0       |

Bands: **11–12 Critical**, **9–10 High**, **6–8 Medium**, **0–5 Low**.

Counting security objectives rather than singling one out keeps the model neutral: a missing
confidentiality control is not automatically Critical. For example a non-compliant, preventive,
confidentiality-only control with nothing implemented scores 5+1+2+2 = 10, which is High.

Every gap stores its score, the individual factors and the model version, so the gap detail page
and the Gap Register export can show exactly why a rating was given. An assessor may override the
rating; the override is flagged and the calculated score is kept alongside it.

### Remediation SLA

An internal service level, also in `src/config/risk-policy.ts`: Critical 14 days, High 30, Medium
60, Low 90. The due date on an automatically raised action comes from this table.

### Compliance formula

Defined once in `src/modules/assessment/domain/scoring.ts` and used by the dashboard, the theme
breakdown, the assessment progress bar and every CSV export:

```
in scope   = Compliant + Partially compliant + Non-compliant
credit     = Compliant × 1.0  +  Partially compliant × 0.5
compliance = round(credit ÷ in scope × 100)
```

`Not applicable` controls are excluded from the denominator, so justifying a control out of scope
neither helps nor hurts the score. `Not assessed` controls are excluded too; progress towards a
complete assessment is reported separately as a completion percentage.

### Gap lifecycle

```
OPEN ──▶ IN_PROGRESS ──▶ AWAITING_REVIEW ──▶ RESOLVED
  │           │                 │
  └───────────┴─────────────────┴──▶ RISK_ACCEPTED
```

Nothing closes a gap automatically. Reassessing a control as compliant moves the gap to
`AWAITING_REVIEW` and parks its remediation actions in review; an assessor then has to confirm the
closure. That confirmation is refused, server-side, while any remediation action is still open,
any attached evidence is still `PENDING`, or there is no verification basis at all (neither a
compliant reassessment nor a single accepted piece of evidence). A new shortfall reopens a closed
gap into `IN_PROGRESS`. Every transition is written to the audit log.

The description and recommendation generated when a gap is raised are drafts. An assessor can
replace them, and once edited the system never overwrites them; the original draft is retained for
comparison.

## API

| Method | Endpoint                                       | Permission        | Description                                    |
| ------ | ---------------------------------------------- | ----------------- | ---------------------------------------------- |
| POST   | `/api/auth/login`                              | public            | Verify credentials and start a session         |
| POST   | `/api/auth/logout`                             | public            | Clear the session cookie                       |
| GET    | `/api/auth/me`                                 | signed in         | Current identity and effective permissions     |
| GET    | `/api/users`                                   | `users:read`      | List accounts                                  |
| POST   | `/api/users`                                   | `users:manage`    | Create an account                              |
| PATCH  | `/api/users/[id]`                              | `users:manage`    | Change role, site, name or active status       |
| GET    | `/api/organization`                            | signed in         | Organization profile with its sites in scope   |
| GET    | `/api/frameworks`                              | `frameworks:read` | Frameworks available for assessment            |
| GET    | `/api/frameworks/[code]`                       | `frameworks:read` | Framework with its themes and control counts   |
| GET    | `/api/frameworks/[code]/controls`              | `frameworks:read` | Search, filter and page through controls       |
| GET    | `/api/frameworks/[code]/controls/[controlCode]`| `frameworks:read` | One control with its previous and next entries |
| GET    | `/api/register`                                | `register:read`      | Control register with filters and paging    |
| PATCH  | `/api/register/[id]`                            | `register:manage`    | Owner, applicability, implementation status |
| POST   | `/api/register/sync`                            | `register:manage`    | Add register entries for new controls only  |
| GET    | `/api/assessments`                              | `assessments:read`   | List assessments with progress              |
| POST   | `/api/assessments`                              | `assessments:conduct`| Start an assessment over applicable controls |
| GET    | `/api/assessments/[id]/items`                   | `assessments:read`   | Control-by-control findings                  |
| PATCH  | `/api/assessments/[id]/status`                  | `assessments:conduct`/`assessments:approve` | Submit or approve |
| PATCH  | `/api/assessment-items/[id]`                    | `assessments:conduct`| Record a finding; drives the gap workflow    |
| GET    | `/api/gaps`                                     | `gaps:read`          | Gap register with filters                    |
| PATCH  | `/api/gaps/[id]`                                | `gaps:manage`        | Confirm wording, override risk, move status  |
| GET    | `/api/evidence`                                 | `evidence:read`      | Evidence with review state                   |
| POST   | `/api/evidence`                                 | `evidence:upload`    | Upload a file or attach a link               |
| PATCH  | `/api/evidence/[id]`                            | `evidence:review`    | Accept or reject; rejection needs a reason   |
| DELETE | `/api/evidence/[id]`                            | `evidence:review`    | Remove evidence                              |
| GET    | `/api/evidence/[id]/file`                       | `evidence:read`      | Download the stored file                     |
| GET    | `/api/remediation`                              | `remediation:read`   | Remediation plan                             |
| POST   | `/api/remediation`                              | `remediation:manage` | Raise an action by hand                      |
| PATCH  | `/api/remediation/[id]`                         | `remediation:update` | Progress, owner, priority, due date, status  |
| POST   | `/api/remediation/[id]/comments`                | `remediation:update` | Add a comment                                |
| GET    | `/api/reports/[kind]`                           | `reports:read`       | CSV export                                   |
| GET    | `/api/audit`                                    | `audit:read`         | Audit log (read only; there is no write API) |

Control search accepts `search`, `themeCode`, `controlType`, `securityProperty`,
`cybersecurityConcept`, `page` and `pageSize`.

Reports: `statement-of-applicability`, `gap-register`, `remediation-plan`. All three read live
database state and use the same compliance and risk logic as the dashboard.

The audit log is append-only. No repository method, use case or route handler updates or deletes an
audit record, so history cannot be rewritten through the application.

Responses use a consistent envelope:

```json
{ "data": {} }
{ "error": { "code": "NOT_FOUND", "message": "Organization was not found." } }
```

Validation failures return `422` with field level detail:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid.",
    "issues": [{ "field": "password", "message": "Password must be at least 10 characters." }]
  }
}
```
