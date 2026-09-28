# Frontend

Place the provided React application in this folder (so that `package.json` and `src/` sit
directly here). The included `Dockerfile` and `nginx.conf` build it and serve it on port 3000
while proxying `/api/*` to the backend container.

> The Dockerfile copies `/app/build` (Create React App). If your project uses **Vite**, change
> that line to `/app/dist`.

See [`docs/FRONTEND_INTEGRATION.md`](../docs/FRONTEND_INTEGRATION.md) for how to call the API.
