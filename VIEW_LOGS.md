# How to View Backend Logs

## Option 1: Run Backend in Terminal (Recommended)
Open a terminal and run:
```bash
cd /Users/user/Desktop/fullstack-app/backend
npm run dev
```

This will show all logs in real-time, including:
- Server startup messages
- API requests
- Errors (including OAuth errors)
- Database connections

## Option 2: Check for Log Files
The backend doesn't create log files by default. If you want file logging, you can:
1. Install a logging library (winston, pino, etc.)
2. Or redirect output: `npm run dev > backend.log 2>&1`

## Option 3: Check Browser Console
OAuth errors also appear in:
- Browser Developer Tools → Console tab
- Network tab (check the failed request to `/api/auth/google`)

## Common OAuth Errors:
- **"OAuth client was not found"** → Invalid Client ID
- **"flowName=GeneralOAuthLite"** → OAuth consent screen not configured
- **"Access blocked"** → App in testing mode, user not added as test user
