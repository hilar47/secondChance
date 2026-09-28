# ♻️ SecondChance

Give household items you no longer need a new home, or find free items instead of buying new.
Node.js · Express · MongoDB (native driver) · JWT · multer · natural · Docker · GitHub Actions

```
secondChance-backend/
  app.js                         Express app, mounts all routes
  models/db.js                   connectToDatabase()
  routes/secondChanceItemsRoutes.js   items CRUD + image upload
  routes/searchRoutes.js         search & filter
  routes/authRoutes.js           register / login / update
  sentiment/index.js             sentiment microservice (natural)
  util/import-mongo/             seed script + secondChanceItems.json (16 items)
  public/                        landing page + browse page + images
scripts/                         capture_outputs.sh, smoke.sh, create_issues.sh
user-story.md                    user story template
```

## Run locally
```bash
docker run -d --name mongo -p 27017:27017 mongo:7
cd secondChance-backend
cp .env.example .env && npm install
npm run import      # imports 16 items
npm start           # http://localhost:3060
```
Or everything in Docker: `cp .env.example .env && docker compose up --build` then
`docker compose exec api npm run import`.

See [docs/API.md](docs/API.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/USER_STORIES.md](docs/USER_STORIES.md), [docs/AGILE_DEVOPS.md](docs/AGILE_DEVOPS.md).

License: MIT
