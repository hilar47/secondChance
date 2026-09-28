# REST API Reference

Base URL: `http://localhost:5000/api` · JSON everywhere · Authenticated routes need `Authorization: Bearer <token>`.

Errors: `{ "error": { "message": "...", "details": [{ "field": "...", "message": "..." }] } }`

Common status codes: `400` validation · `401` not authenticated · `403` not allowed · `404` not found · `409` conflict · `423` account locked · `429` rate limited.

## Health
| Method | Path | Description |
|---|---|---|
| GET | `/health` (no `/api` prefix) | Liveness + DB status |

## Auth
| Method | Path | Auth | Body | Result |
|---|---|---|---|---|
| POST | `/auth/register` | – | `name, email, password, city?` | `201 { token, user }` |
| POST | `/auth/login` | – | `email, password` | `200 { token, user }` |
| GET | `/auth/me` | ✔ | – | `{ user }` |

## Users
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/:id` | – | Public profile with `averageRating`, `ratingCount` |
| PATCH | `/users/me` | ✔ | Update `name`, `city`, `bio` |
| GET | `/users/:id/reviews?page&limit` | – | Reviews received by the user |

## Items
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/items` | – | Search / browse (see query below) |
| GET | `/items/mine?type=listed\|claimed` | ✔ | Items I listed or claimed |
| POST | `/items` | ✔ | Create listing |
| GET | `/items/:id` | optional | Details (`claimedBy` shown only to owner/claimer) |
| PATCH | `/items/:id` | ✔ owner | Update; send `version` for conflict detection |
| DELETE | `/items/:id` | ✔ owner | Delete (only while `available`) |
| POST | `/items/:id/claim` | ✔ | `available → reserved` (atomic) |
| POST | `/items/:id/release` | ✔ owner/claimer | `reserved → available` |
| POST | `/items/:id/confirm` | ✔ owner | `reserved → given` |
| POST | `/items/:id/reviews` | ✔ participant | Review the other party (`rating` 1-5, `comment?`) |

**Create body**
```json
{
  "title": "Wooden bookshelf",
  "description": "Five shelves, small scratches",
  "category": "furniture",
  "condition": "good",
  "tags": ["wood"],
  "images": ["https://example.com/a.jpg"],
  "city": "Dubai",
  "coordinates": { "lat": 25.2048, "lng": 55.2708 }
}
```
Categories: `furniture electronics clothing books kitchen toys garden tools sports baby other`
Conditions: `like_new good fair needs_repair`

**`GET /items` query parameters**

| Param | Default | Notes |
|---|---|---|
| `q` | – | Full-text keyword search (sorted by relevance) |
| `category`, `condition`, `city`, `owner` | – | Exact filters (city is case-insensitive) |
| `status` | `available` | `available \| reserved \| given` |
| `lat`, `lng`, `radiusKm` | radius 10 | Geo filter; `lat`+`lng` must be given together |
| `sort` | `relevance` if `q` else `newest` | `newest \| oldest \| relevance` |
| `page`, `limit` | 1, 12 | limit ≤ 50 |

Response: `{ "data": [ ...items ], "pagination": { "page", "limit", "total", "pages" } }`

## Reviews
| Method | Path | Auth | Description |
|---|---|---|---|
| DELETE | `/reviews/:id` | ✔ author | Delete own review (rating aggregate rolls back) |

## Example

```bash
TOKEN=$(curl -s -X POST localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"Password123"}' | jq -r .token)

curl -s "localhost:5000/api/items?q=bookshelf&city=dubai"
curl -s -X POST localhost:5000/api/items/<id>/claim -H "Authorization: Bearer $TOKEN"
```
