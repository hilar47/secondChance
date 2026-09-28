# Architecture

```
Browser (public/index.html, browse.html)  ->  Express API (app.js)  ->  MongoDB (native driver)
                                                 |-- routes/secondChanceItemsRoutes.js  (items + multer upload)
                                                 |-- routes/searchRoutes.js             (filters)
                                                 |-- routes/authRoutes.js               (register / login / update)
                                                 |-- middleware/auth.js                 (JWT)
                                                 `-- models/db.js                       (connectToDatabase)
sentiment/index.js  – separate microservice using the `natural` NLP package
util/import-mongo   – loads the 16 seed items
```

**Collections:** `secondChanceItems`, `users` (unique `email` index), `counters` (atomic id sequence).

**Safety:** bcrypt password hashes, JWT auth, owner-only edit/delete, query-string values must be plain strings
(blocks `?category[$ne]=x` operator injection), unique indexes and `$inc` counters for concurrent writes,
image-only uploads capped at 5 MB.

**Deployment:** `docker-compose.yml` (mongo + api). The API also serves the landing page, so a single container is enough
for a PaaS such as Render/Railway with a MongoDB Atlas connection string in `MONGO_URL`.
