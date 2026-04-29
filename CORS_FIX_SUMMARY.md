# CORS Issues Fix Summary

## Problem
The application was experiencing CORS errors when trying to create accounts or check usernames:
- `Preflight response is not successful. Status code: 502`
- `Origin https://deutschly-uz.up.railway.app is not allowed by Access-Control-Allow-Origin`

## Root Causes
1. **Backend CORS configuration** - The regex pattern for Railway domains wasn't matching all subdomain patterns
2. **Missing nginx proxy configuration** - The frontend nginx wasn't configured to proxy API requests to the backend

## Changes Made

### 1. Backend CORS Configuration (`app/main.py`)
- **Updated CORS regex pattern** to be more permissive: `r"https?://[a-zA-Z0-9._-]+\.railway.app"`
- **Added explicit origins** for production domains:
  - `https://deutschly-uz.up.railway.app` (frontend)
  - `https://web-production-aab8a.up.railway.app` (backend)

### 2. Frontend Nginx Configuration (`webapp/nginx.conf`)
- **Added API proxy configuration** to forward `/api/` requests to the backend service
- **Added CORS preflight handling** for OPTIONS requests
- **Configured proper headers** for proxy forwarding

## How the Authentication Flow Works

The current implementation already has a well-designed login/signup flow:

1. **Username Check**: User enters username → app calls `/api/v1/auth/check?username=...`
2. **Branching Logic**:
   - If user exists → Show password field for login
   - If user doesn't exist → Show signup form (city, level, password)
3. **Completion**:
   - Login: Calls `/api/v1/auth/login` with username + password
   - Signup: Calls `/api/v1/auth/signup` with full user data

## Deployment Instructions

### For Railway.app Deployment

The changes are already in the codebase. To deploy:

1. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Fix CORS issues and add nginx API proxy"
   git push origin main
   ```

2. **Railway will automatically deploy** both services based on your configuration

3. **Environment Variables** (set in Railway dashboard):
   - For backend service: Ensure `FRONTEND_ORIGIN=https://deutschly-uz.up.railway.app` is set
   - This provides an additional layer of CORS allowance

### For Local Development

1. **Backend** (runs on port 8000):
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

2. **Frontend** (runs on port 5173):
   ```bash
   cd webapp
   npm run dev
   ```

The frontend will automatically use `http://localhost:8000/api/v1` as the API URL in development mode.

## Testing the Fix

After deployment, test these scenarios:

1. **New User Registration**:
   - Go to the landing page
   - Enter a new username
   - Fill in city, level, and password
   - Should successfully create account

2. **Existing User Login**:
   - Enter an existing username
   - Enter password
   - Should successfully log in

3. **Username Check**:
   - The system should correctly identify if a username exists or not

## Additional Notes

- The nginx configuration assumes the backend service is accessible as `web:8000` (Docker service name)
- If you're using a different deployment setup, adjust the `proxy_pass` URL accordingly
- The CORS configuration now allows all Railway.app subdomains, which is safe for this use case
- Recovery codes are generated and displayed after successful signup

## Files Modified

1. `app/main.py` - CORS configuration
2. `webapp/nginx.conf` - API proxy and CORS preflight handling

## Next Steps

If you continue to experience issues:
1. Check Railway deployment logs for any errors
2. Verify environment variables are set correctly
3. Test API endpoints directly using curl or Postman
4. Check browser console for detailed CORS error messages