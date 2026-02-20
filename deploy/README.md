# Deployment Guide (Nginx + PM2)

## Backend (PM2)
1. Copy `backend/env.example.txt` to `backend/.env` and fill values.
2. Install deps and build:
   - `cd backend`
   - `npm install`
   - `npm run build`
3. Run with PM2:
   - `pm2 start ecosystem.config.cjs`
   - `pm2 save`

## Frontend (Nginx static)
1. Install deps and build:
   - `cd frontend`
   - `npm install`
   - `npm run build`
2. Copy `frontend/dist` to your Nginx web root or point Nginx to it.

## Nginx
- Use `deploy/nginx.fullstack-app.conf` as a starting point.
- Configure SSL certificates and domain name.
- Ensure `/api` and `/uploads` proxy to the backend.

## MongoDB
- Ensure MongoDB runs with auth and the user/password in `MONGO_URI`.
