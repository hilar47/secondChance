# Integrating the React frontend

The API is same-origin in Docker (nginx proxies `/api`). In local development set
`REACT_APP_API_URL=http://localhost:5000/api` (or `VITE_API_URL`) and make sure the frontend origin is in the API's `CORS_ORIGIN`.

## Minimal API client

```js
// src/api/client.js
const BASE = process.env.REACT_APP_API_URL || '/api';

export async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error?.message || 'Request failed'), { status: res.status, details: data.error?.details });
  return data;
}

export const login = (email, password) => api('/auth/login', { method: 'POST', body: { email, password } });
export const searchItems = (params) => api(`/items?${new URLSearchParams(params)}`);
export const claimItem = (id, token) => api(`/items/${id}/claim`, { method: 'POST', token });
```

## Handling conflicts in the UI

* `409` on **claim** → show "Sorry, someone else just claimed this" and refresh the list.
* `409` on **PATCH** → the listing changed; reload it (new `version`) and let the user re-apply edits.
* `423` on **login** → show the lock message.

Keep the token in memory (or `sessionStorage`) and send it in the `Authorization` header.
