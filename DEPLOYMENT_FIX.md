# Deployment Fix Guide

## 🚨 Issue Identified

The error `The service is crashing because /app/bot/main.py doesn't exist` indicates Railway is looking for the wrong entry point. Our actual FastAPI app is in `/app/main.py`, not `/app/bot/main.py`.

## ✅ Corrections Made

### 1. Fixed Start Commands

Updated both `railway.toml` and `railway-backend.toml` to use the correct entry point:

```bash
# Correct start command
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 2. Project Structure

Our project structure is:
```
/
├── app/
│   ├── main.py          # ✅ Correct entry point
│   ├── bot.py           # Telegram bot routes (imported by main.py)
│   ├── api/             # API endpoints
│   ├── models/          # Database models
│   └── ...
├── railway-backend.toml # Backend config
├── railway-frontend.toml # Frontend config
└── ...
```

### 3. Railway Configuration Files

#### railway-backend.toml
```toml
[[services]]
name = "deutschly-backend"
internalPort = 8000
protocol = "http"
env = {
  DATABASE_URL = "${{ DATABASE_URL }}",
  TELEGRAM_BOT_TOKEN = "${{ TELEGRAM_BOT_TOKEN }}",
  WEBHOOK_URL = "${{ RAILWAY_PUBLIC_DOMAIN }}",
  SECRET_KEY = "${{ SECRET_KEY }}",
  FRONTEND_ORIGIN = "https://${{ FRONTEND_DOMAIN }}"
}

buildCommand = "pip install -r requirements.txt"
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4"
```

#### railway-frontend.toml
```toml
[[services]]
name = "deutschly-frontend"
internalPort = 3000
protocol = "http"
env = {
  VITE_API_URL = "https://${{ BACKEND_DOMAIN }}",
  VITE_TELEGRAM_BOT_NAME = "Deutschly"
}

buildCommand = "cd webapp && npm install && npm run build"
startCommand = "cd webapp && npx serve -s dist -l 3000"
```

## 🛠 Deployment Steps

### Step 1: Fix Repository

1. **Ensure these files exist in your repository root:**
   - `app/main.py` ✅ (exists)
   - `app/bot.py` ✅ (exists)
   - `railway-backend.toml` ✅ (fixed)
   - `railway-frontend.toml` ✅ (fixed)
   - `requirements.txt` ✅ (exists)

2. **Verify `app/main.py` imports the bot:**
   ```python
   # This should be in app/main.py
   from app.api import api_router  # This imports bot.py through app/api/__init__.py
   ```

### Step 2: Railway Backend Setup

1. **Create new Railway project**
2. **Add PostgreSQL database**
3. **Set environment variables:**
   - `DATABASE_URL` = (from PostgreSQL)
   - `TELEGRAM_BOT_TOKEN` = `8722275184:AAG2-gSJnRf6ellm4Dynto8RVuFkJTkQGR4`
   - `SECRET_KEY` = (generate with `openssl rand -hex 32`)
   - `FRONTEND_ORIGIN` = `https://your-frontend.up.railway.app` (set after frontend deploy)

4. **Deploy with `railway-backend.toml`**

### Step 3: Railway Frontend Setup

1. **Create new Railway project**
2. **Set environment variables:**
   - `BACKEND_DOMAIN` = `https://your-backend.up.railway.app`
   - `VITE_TELEGRAM_BOT_NAME` = `Deutschly`

3. **Deploy with `railway-frontend.toml`**

### Step 4: Connect Services

1. **Update backend `FRONTEND_ORIGIN`** with frontend URL
2. **Update frontend `BACKEND_DOMAIN`** with backend URL
3. **Redeploy both services**

## 🔍 Troubleshooting

### If you still get path errors:

1. **Check Railway build logs** for exact error
2. **Verify file structure** in Railway container:
   ```bash
   # Check if files exist in container
   ls -la /app/
   ```
3. **Ensure proper working directory** - Railway should use `/app` as root

### Common Railway Issues:

1. **Missing requirements.txt** - Ensure it's in repository root
2. **Python version mismatch** - Railway uses Python 3.11 by default
3. **Missing dependencies** - Check `pip install` output in logs

## 🎯 Verification

After deployment:

1. **Backend should be accessible:**
   - `https://your-backend.up.railway.app` → "Deutschly Social Platform v1.1"
   - `https://your-backend.up.railway.app/docs` → Swagger UI

2. **Frontend should load:**
   - `https://your-frontend.up.railway.app` → Landing page
   - Telegram login button should work

3. **Telegram bot should respond:**
   - Send `/start` to @Deutschly_bot
   - Should create user in database

## 📋 Checklist

- [ ] `app/main.py` exists in repository
- [ ] `railway-backend.toml` uses correct start command
- [ ] All environment variables set in Railway
- [ ] Database connection working
- [ ] CORS configured for frontend domain
- [ ] Telegram webhook automatically set on backend startup
- [ ] Frontend can reach backend API endpoints

The deployment should now work correctly with the proper entry point configuration!