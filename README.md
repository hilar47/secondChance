# ♻️ SecondChance

A platform that connects people who want to **give away** household items with people who prefer to **reuse** and find things for free.

**Stack:** Node.js 20 · Express 4 · MongoDB 7 (Mongoose) · JWT auth · React frontend (provided) · Docker · GitHub Actions

## Features
* Secure registration & login (bcrypt, JWT, lockout, rate limiting)
* Item listings with categories, condition, tags, images, GeoJSON location
* Full-text search, filters, "near me" radius search, pagination
* Concurrency-safe claim workflow (`available → reserved → given`)
* Reviews & ratings between giver and receiver, with atomic rating aggregates
* Input validation on every route, consistent error format
* Automated tests (Jest + Supertest + in-memory MongoDB) and CI

## Repository layout
```
secondchance/
├── backend/            Express API (src/, tests/, scripts/, Dockerfile)
├── frontend/           Put the provided React app here (+ Dockerfile, nginx.conf)
├── docs/               Architecture, user stories, API reference, Agile/DevOps
├── .github/            CI workflow, PR + issue templates
├── docker-compose.yml
└── .env.example
```

## Quick start

### Option A – Docker (recommended)
```bash
cp .env.example .env          # set JWT_SECRET to a long random value
docker compose up --build     # MongoDB + API on http://localhost:5000
# with the React frontend copied into ./frontend:
docker compose --profile full up --build     # UI on http://localhost:3000
```
Seed demo data (optional):
```bash
docker compose exec api node scripts/seed.js     # alice@example.com / Password123
```

### Option B – Local
```bash
cd backend
cp .env.example .env
npm install
# needs a running MongoDB, e.g.:  docker run -d -p 27017:27017 mongo:7
npm run seed      # optional demo data
npm run dev       # http://localhost:5000
```

### Tests
```bash
cd backend && npm install && npm test
```
The first run downloads a MongoDB binary for `mongodb-memory-server`; no local database needed.

## Configuration
| Variable | Default | Description |
|---|---|---|
| `PORT` | 5000 | API port |
| `MONGO_URI` | `mongodb://localhost:27017/secondchance` | Database connection |
| `JWT_SECRET` | – (**required in production**) | Token signing key |
| `JWT_EXPIRES_IN` | `1d` | Token lifetime |
| `BCRYPT_ROUNDS` | 12 | Password hashing cost |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated allowed origins |

## Documentation
* [Architecture](docs/ARCHITECTURE.md)
* [User stories](docs/USER_STORIES.md)
* [API reference](docs/API.md)
* [Frontend integration](docs/FRONTEND_INTEGRATION.md)
* [Agile & DevOps practices](docs/AGILE_DEVOPS.md)

## Publishing to GitHub
```bash
cd secondchance
git init -b main
git add .
git commit -m "feat: initial SecondChance backend"
git remote add origin https://github.com/<your-user>/secondchance.git
git push -u origin main
```
Tip: run `cd backend && npm install` once and commit the generated `package-lock.json` for reproducible Docker/CI builds.

## License
MIT
