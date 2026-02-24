# College Deployment Checklist

This checklist is tailored to your constraints:
- no external hosting
- domain from Doron (no port in URL)
- HTTPS for frontend and backend traffic
- PM2 background process
- `NODE_ENV=production`
- local MongoDB on server with username/password auth

## 1) Server-side MongoDB (local, protected)

1. Install MongoDB on the college server.
2. Enable auth in `mongod.conf`:
   - `security.authorization: enabled`
3. Create DB user:
   - database: `final_internet`
   - role: `readWrite`
4. Use a protected URI in backend `.env`:
   - `MONGO_URI=mongodb://final_app_user:MyNewStrongPass123!@#@127.0.0.1:27017/final_internet?authSource=admin`

## 2) Backend production mode

In backend `.env` on server:
- `NODE_ENV=production`
- `PORT=4000`
- set JWT/session/google vars
- set `CLIENT_URL=https://<your-domain>`
- optional AI: `GEMINI_API_KEY=...`

Build and run:
1. `cd /var/www/final-internet-project/backend`
2. `npm ci`
3. `npm run build`
4. `pm2 start ecosystem.config.cjs`
5. `pm2 save`
6. `pm2 startup` (run the generated command)

## 3) Frontend production build

1. `cd /var/www/final-internet-project/frontend`
2. Create `.env`:
   - `VITE_API_BASE_URL=https://<your-domain>`
3. `npm ci`
4. `npm run build`

Nginx serves `frontend/dist` directly over HTTPS.

## 4) Domain + HTTPS + no-port access

1. Point DNS of domain from Doron to server IP.
2. Copy `deploy/nginx-college.conf.example` to Nginx site config.
3. Replace `your-domain-from-doron.example` with real domain.
4. Enable site and reload Nginx.
5. Issue cert:
   - `sudo certbot --nginx -d <your-domain>`

Result:
- `https://<your-domain>` loads frontend
- `/api/*` proxies to backend PM2 app
- users do not need port numbers or VPN (assuming domain is publicly reachable)

## 5) Validation commands

- Backend health: `curl https://<your-domain>/api/health`
- PM2 status: `pm2 status`
- PM2 logs: `pm2 logs final-internet-backend`
- HTTPS cert: `curl -I https://<your-domain>`

## 6) AI requirement (implemented)

Implemented endpoint:
- `GET /api/ai/insights?scope=all|mine`

It analyzes current post text content and returns:
- summary
- suggested captions
- suggested tags
- moderation flags

Request control:
- in-memory cache (60s) to reduce duplicate AI calls.
