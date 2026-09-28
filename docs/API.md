# REST API

Base URL: `http://localhost:3060` · JSON · protected routes need `Authorization: Bearer <authtoken>`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | Liveness |
| GET | `/api/secondchance/items` | – | List all items |
| POST | `/api/secondchance/items` | ✔ | Add item, `multipart/form-data` (`name, category, condition, age_years, description, zipcode`, optional image `file`) |
| GET | `/api/secondchance/items/:id` | – | Item details |
| PUT | `/api/secondchance/items/:id` | ✔ owner | Update item |
| DELETE | `/api/secondchance/items/:id` | ✔ owner | Delete item |
| GET | `/api/secondchance/search` | – | Filters: `name`, `category`, `condition`, `age_years` (≤) |
| POST | `/api/auth/register` | – | `name, email, password` → `{ authtoken, name, email }` |
| POST | `/api/auth/login` | – | `email, password` → `{ authtoken, name, email }` |
| PUT | `/api/auth/update` | ✔ | `name` and/or `password` |
| GET | `/sentiment?sentence=` | – | Separate service (`npm run sentiment`, port 3061) |

Categories: `Living Bedroom Bathroom Kitchen Office` · Conditions: `New "Like New" Good Fair Poor`

Errors: `{ "error": "message" }` or `{ "errors": [{ "field", "message" }] }` (400 validation, 401, 403, 404, 409).
