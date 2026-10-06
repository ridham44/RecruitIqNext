# RecruitIQ Demo Login Credentials

Local demo data, all fake. Every account uses the password **`Demo@1234`**, except the local Platform Admin
(`Admin@1234`). Log in at **http://localhost:3001/auth/login**. With `DEMO_PAGE=true`, **/live-demo** also lists
the "Start here" accounts.

Emails print in the server terminal (`EMAIL_PROVIDER=console`), so nothing reaches the fake inboxes.

**Candidates (students) have no login.** They apply through an agency's `/recq` link and get everything by email:
the verification code, the interview link, a personal status link, and each status update (shortlisted,
rejected, interview booked, cancelled or completed). The candidate emails below identify them in the app; they
can't be used to sign in.

---

## Quick reference — one login per role

| Role                     | Email                              | Password     | Lands on               |
|--------------------------|------------------------------------|--------------|------------------------|
| Platform Admin           | `admin@recruitiq.local`            | `Admin@1234` | `/admin/companies`     |
| Platform Admin (demo)    | `admin@recruitiq.demo`             | `Demo@1234`  | `/admin/companies`     |
| Agency owner             | `ceo@nfs.com`                      | `Demo@1234`  | `/company/dashboard`   |
| Agency recruiter         | `neha.kapoor@nfs-agency.example`   | `Demo@1234`  | `/company/dashboard`   |
| Company HR (client)      | `rachel@ferrari-demo.example`      | `Demo@1234`  | `/client/candidates`   |
| Direct employer          | `company@ravantratech.demo`        | `Demo@1234`  | `/company/dashboard`   |

---

## Platform Admin

| Email                    | Password     | Notes                                              |
|--------------------------|--------------|----------------------------------------------------|
| `admin@recruitiq.local`  | `Admin@1234` | Created with `scripts/create-admin.mjs`            |
| `admin@recruitiq.demo`   | `Demo@1234`  | "Start here" demo admin                            |

Agencies the admin sees: **Nfs**, **Demo Talent Agency**, **Ravantra Technologies**, and **Stellar Staffing
Solutions**, which is **SUSPENDED** (its owner `owner@stellarstaffing.example` is refused at login). The older
"Acme Corp" and "Ravantra" rows are leftovers from earlier test runs.

---

## Nfs agency — Ferrari & McLaren

| Role                 | Name          | Email                              | Access                                                             |
|----------------------|---------------|------------------------------------|--------------------------------------------------------------------|
| Agency owner         | Nikhil Sharma | `ceo@nfs.com`                      | Everything                                                         |
| Agency recruiter     | Neha Kapoor   | `neha.kapoor@nfs-agency.example`   | Ferrari jobs: manage jobs, review, configure interviews, submit    |
| Agency recruiter     | Rahul Verma   | `rahul.verma@nfs-agency.example`   | View-only, McLaren Frontend job                                    |
| Company HR — Ferrari | Rachel        | `rachel@ferrari-demo.example`      | Client portal: candidates sent to Ferrari                          |
| Company HR — McLaren | Remsi         | `remsi@mclaren-demo.example`       | Client portal: candidates sent to McLaren                          |

Clients (agency menu → **Companies**): **Ferrari** (Scuderia Ferrari dept.) and **McLaren** (McLaren Racing dept.).
Jobs: 4 open, plus 1 draft (*QA Automation Engineer*) and 1 closed (*Race Strategy Analyst*).

The 24 candidates use `<first>.<last>@nfsdemo.example` addresses (no login). Scores below are **CV score → final
score**. The final score is CV × 0.3 + interview × 0.7; Ferrari jobs qualify at ≥ 70.

### Ferrari — Full Stack Developer – Race Telemetry Platform (slot booking)

| Candidate     | Email                            | CV | Interview          | Final | Status                          |
|---------------|----------------------------------|----|--------------------|-------|---------------------------------|
| Luca Bianchi  | `luca.bianchi@nfsdemo.example`   | 88 | Completed — 86     | 86.6  | Submitted to Rachel (viewed)    |
| Aarav Shah    | `aarav.shah@nfsdemo.example`     | 82 | Completed — 74     | 76.4  | QUALIFIED — ready to submit     |
| Sofia Romano  | `sofia.romano@nfsdemo.example`   | 68 | Completed — 52     | 56.8  | NOT_QUALIFIED                   |
| Neha Kulkarni | `neha.kulkarni@nfsdemo.example`  | 63 | Booked — tomorrow 15:00 | —  | Interview scheduled (pending)   |
| Rohan Gupta   | `rohan.gupta@nfsdemo.example`    | 41 | —                  | —     | Screened, awaiting decision     |
| Marco Conti   | `marco.conti@nfsdemo.example`    | 34 | —                  | —     | REJECTED                        |

3 open slots to book. Reports include criteria assessment from the recruiter's evaluation instructions.

### Ferrari — Data Engineer – Performance Analytics (slot booking)

| Candidate      | Email                             | CV | Interview                         | Status                     |
|----------------|-----------------------------------|----|-----------------------------------|----------------------------|
| Giulia Ferraro | `giulia.ferraro@nfsdemo.example`  | 90 | **In progress** (started ~12 min before seeding) | Interview scheduled |
| Vikram Rao     | `vikram.rao@nfsdemo.example`      | 84 | Booked — in 2 days 12:00          | Interview scheduled        |
| Elena Russo    | `elena.russo@nfsdemo.example`     | 61 | Cancelled (yesterday)             | Shortlisted — can rebook   |
| Arjun Menon    | `arjun.menon@nfsdemo.example`     | 58 | —                                 | Shortlisted — can book     |
| Pooja Reddy    | `pooja.reddy@nfsdemo.example`     | —  | —                                 | Applied (not screened)     |
| Daniel Moretti | `daniel.moretti@nfsdemo.example`  | —  | —                                 | Applied (not screened)     |

### McLaren — Embedded Software Engineer – Vehicle Control Systems (instant interview link)

| Candidate      | Email                             | CV | Interview                                   | Final | Status                              |
|----------------|-----------------------------------|----|---------------------------------------------|-------|-------------------------------------|
| Oliver Hughes  | `oliver.hughes@nfsdemo.example`   | 87 | Link sent, not attended yet                 | —     | Interview scheduled (pending)       |
| Siddharth Iyer | `siddharth.iyer@nfsdemo.example`  | 80 | Completed — 79                              | 79.3  | Submitted to Remsi                  |
| Emily Clarke   | `emily.clarke@nfsdemo.example`    | 66 | Round 1: 58 (connection drops) · **Round 2 requested by Remsi**, link pending | 60.4 | Submitted to Remsi (viewed) |
| Thomas Wright  | `thomas.wright@nfsdemo.example`   | 55 | —                                           | —     | Screened, awaiting decision         |
| Harsh Vora     | `harsh.vora@nfsdemo.example`      | 38 | —                                           | —     | REJECTED                            |
| Ananya Das     | `ananya.das@nfsdemo.example`      | 29 | —                                           | —     | REJECTED (fresh graduate)           |

### McLaren — Frontend Developer – Fan Engagement App

All 6 are **APPLIED** (not screened), so you can run **AI Screening** live: Chloe Bennett, Kabir Malhotra,
Isabella Turner, Nikhil Jain, Sam Wilson, Tanvi Shah (`<first>.<last>@nfsdemo.example`).

---

## "Start here" demo set — Demo Talent Agency

| Role             | Email                              | Notes                                                        |
|------------------|------------------------------------|--------------------------------------------------------------|
| Agency owner     | `agency@recruitiq.demo`            | Careers page: `/careers/demo-agency`                         |
| Agency recruiter | `recruiter@recruitiq.demo`         | Assigned to the demo job and company                         |
| Company HR       | `hr@recruitiq.demo`                | Company: Demo Software Pvt Ltd (Engineering)                 |
| Candidate        | `sample.candidate@recruitiq.demo`  | Priya Sample (no login): interviewed (84), final 82.2, sent to Company HR |

Job: **Frontend Developer (Demo)**, instant interview link, final threshold 70. To demo a candidate, open the
agency's `/recq` link and upload a resume from `public/sample-resumes`.

---

## Ravantra Technologies — direct employer

| Field   | Value                        |
|---------|------------------------------|
| Email   | `company@ravantratech.demo`  |
| Job     | React.js Developer           |

| Candidate     | Email                         | CV | Interview                      | Status                       |
|---------------|-------------------------------|----|--------------------------------|------------------------------|
| Ridham Patel  | `ridham.patel@example.com`    | ✓  | Completed — 84 (best)          | Interview completed          |
| Riya Mehta    | `riya.mehta@example.com`      | ✓  | Completed — 64 (CSE student)   | Interview completed          |
| Priya Sharma  | `priya.sharma@example.com`    | ✓  | Completed — 38 (poor)          | Interview completed          |
| Kavya Nair    | `kavya.nair@example.com`      | 76 | Booked — tomorrow 11:00        | Interview scheduled          |
| Ananya Iyer   | `ananya.iyer@example.com`     | 71 | —                              | Shortlisted — can book       |
| Ishaan Kapoor | `ishaan.kapoor@example.com`   | 66 | Cancelled (yesterday)          | Shortlisted — can rebook     |
| Karan Desai   | `karan.desai@example.com`     | 54 | —                              | Screened, awaiting decision  |
| Divya Joshi   | `divya.joshi@example.com`     | —  | —                              | Applied (fresher, not screened) |
| Meera Pillai  | `meera.pillai@example.com`    | 29 | —                              | REJECTED (Android)           |
| Sneha Verma   | `sneha.verma@example.com`     | 18 | —                              | REJECTED (Marketing)         |

4 open interview slots over the next few days. View interviews under Company → Jobs → React.js Developer →
Interviews.

---

## Recreating the data

Run against the **local** database only. `seed-full-demo.mjs` refuses a non-local `DATABASE_URL`.

```bash
docker start recruitiq-pg                       # local Postgres on :5433
npx prisma migrate deploy
npx tsx scripts/create-admin.mjs --email admin@recruitiq.local --password "Admin@1234"
npm run db:seed                                 # Ravantra + 10 candidates
npm run db:seed:demo-interviews                 # Ridham / Riya / Priya interviews
npx tsx scripts/seed-full-demo.mjs              # everything else (runs seed-nfs.mjs itself)
```

Every step can be re-run and replaces only its own data. Dates (tomorrow, in 2 days…) are relative to when the
seed ran, so re-run it to refresh them. The seed prints working local links for Oliver's and Emily's pending
instant interviews.
