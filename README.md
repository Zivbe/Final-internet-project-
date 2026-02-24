# BZ Connect 📸

## Overview
BZ Connect is a full-stack social photo feed built with Node.js, Express, and React. Users can upload images, explore a feed with AI-powered insights, like/comment, and manage their profiles. The stack uses TypeScript end-to-end with MongoDB, JWT auth, and Swagger-documented APIs.

## Features ✨
- JWT-secured email/password login plus Google OAuth.
- Image uploads with descriptions, tags, editing, and deletion controls.
- Infinite-scroll feed with likes, comments, and AI insights/questions.
- User search and profile pages with personal galleries.
- Swagger-powered REST API docs and health checks.

## Tech Stack 🧰
- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose, Passport, JWT, Swagger.
- Frontend: React 18, Vite, TypeScript, React Router.
- Tooling: Jest, ts-jest, ts-node, dotenv, multer.

## Project Structure
```
Final-internet-project-
├─ backend/      # Express app, routes, controllers, models, Swagger
├─ frontend/     # React SPA (Vite), pages, components, API clients
├─ deploy/       # Deployment helper scripts/configs
├─ env.example.txt
└─ package.json  # Root scripts/config (refer to backend/frontend sub-packages)
```

## Installation
1. Clone the repository and `cd` into it.
2. Backend deps: `cd backend && npm install`.
3. Frontend deps: `cd ../frontend && npm install`.
4. Copy `env.example.txt` to `.env` files as described below.

## Running the App
- **Backend**
  ```bash
  cd backend
  npm run dev        # uses ts-node/tsx watch
  npm run build      # compile to dist/
  npm start          # run compiled server
  ```
- **Frontend**
  ```bash
  cd frontend
  npm run dev        # Vite dev server on http://localhost:5173
  npm run build      # production build
  npm run preview    # serve built assets
  ```

## Environment Variables
`env.txt` (backend):
```
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://app_user:app_password@localhost:27017/fullstack_app?authSource=admin
JWT_ACCESS_SECRET=replace_with_strong_access_secret
JWT_REFRESH_SECRET=replace_with_strong_refresh_secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=replace_with_google_client_id
GOOGLE_CLIENT_SECRET=replace_with_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
SESSION_SECRET=replace_with_session_secret
```
`frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:4000
```

## API Documentation
Swagger UI is served at `http://localhost:4000/api/docs` once the backend is running.

## Screenshots
- `![Dashboard](docs/screenshots/dashboard.png)`
- `![Profile](docs/screenshots/profile.png)`