# Agile & DevOps Practices

## Agile
* **Backlog** = the user stories in `USER_STORIES.md`, tracked as GitHub Issues (use the *User story* template) on a GitHub Projects board: `Backlog → Ready → In progress → Review → Done`.
* **Sprints** of 1–2 weeks. Suggested plan:
  1. Sprint 1 – Accounts (US-1..3), project skeleton, CI, Docker
  2. Sprint 2 – Listings & discovery (US-4..9)
  3. Sprint 3 – Claim workflow & concurrency (US-10..12), reviews (US-13..15)
  4. Sprint 4 – Frontend integration, hardening, deployment
* **Definition of Done** – see the checklist in `.github/pull_request_template.md`.
* Retrospective at the end of each sprint; update this document with actions.

## Git workflow
* `main` – always deployable, protected (PR + green CI + 1 review required).
* `develop` – integration branch (optional for small teams; otherwise branch from `main`).
* Feature branches: `feature/<issue>-short-name`, fixes: `fix/<issue>-short-name`.
* Conventional commits: `feat: add claim endpoint`, `fix: return 409 on stale update`, `docs:`, `test:`, `chore:`.
* Squash-merge PRs; link issues with `Closes #n`.

```bash
git checkout -b feature/12-claim-endpoint
# ...work...
git commit -m "feat: atomic claim endpoint"
git push -u origin feature/12-claim-endpoint   # open a PR
```

## CI/CD
`.github/workflows/ci.yml` runs on every push/PR: install → tests (in-memory MongoDB) → Docker image build.
Extend with a deploy job (e.g. push the image to GHCR and deploy to your host) once a target environment exists.

## Operations
* Config via environment variables (12-factor); no secrets in Git.
* `/health` endpoint + Docker `HEALTHCHECK`.
* Graceful shutdown on `SIGTERM`.
* Structured request logging with morgan (`combined` in production).
