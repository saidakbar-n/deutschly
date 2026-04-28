# Railway Monolithic Deployment Guide

## 🎯 Overview

This guide explains how to deploy Deutschly as a **single monolithic service** on Railway.app, where both the FastAPI backend and React frontend are served from the same domain.

## 🔧 Configuration

### Single `railway.toml` File

The `railway.toml` file is now configured for monolithic deployment:

```toml
[[services]]
name = "deutschly-app"
internalPort = 8000
protocol = "http"
env = {
  # Backend configuration
  DATABASE_URL = "${{ DATABASE_URL }}",
  TELEGRAM_BOT_TOKEN = "${{ TELEGRAM_BOT_TOKEN }}",
  WEBHOOK_URL = "${{ RAILWAY_PUBLIC_DOMAIN }}",
  SECRET_KEY = "${{ SECRET_KEY }}",
  
  # Frontend configuration
  FRONTEND_BUILD_DIR = "./webapp/dist",
  VITE_TELEGRAM_BOT_NAME = "Deutschly"
}

# Build both backend and frontend
buildCommand = "pip install -r requirements.txt && cd webapp && npm install && npm run build && cd .."

# Start backend (which serves frontend statically)
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4"
```

## 🚀 Deployment Steps

### Step 1: Prepare Your Repository

Ensure your repository has:
```
/
├── app/                  # Backend code
│   ├── main.py           # FastAPI app (updated to serve frontend)
│   ├── bot.py            # Telegram bot routes
│   ├── api/              # API endpoints
│   └── ...
├── webapp/               # Frontend code
│   ├── src/              # React source
│   ├── dist/             # Build output (will be created)
│   └── ...
├── railway.toml          # Monolithic config (updated)
├── requirements.txt      # Python dependencies
├── package.json          # Frontend dependencies
└── ...
```

### Step 2: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Empty Project"
3. Name it "Deutschly" (or your preferred name)

### Step 3: Add PostgreSQL Database

1. Click "Add Database" → "PostgreSQL"
2. Wait for provisioning (≈30 seconds)
3. Note the `DATABASE_URL` from the database variables

### Step 4: Set Environment Variables

Go to project settings → Variables and add:

| Variable | Example Value | Required | Notes |
|----------|---------------|----------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:port/db` | ✅ Yes | From PostgreSQL database |
| `TELEGRAM_BOT_TOKEN` | `8722275184:AAG2-gSJnRf6ellm4Dynto8RVuFkJTkQGR4` | ✅ Yes | From @BotFather |
| `SECRET_KEY` | `your-32-char-hex-key` | ✅ Yes | Generate with `openssl rand -hex 32` |
| `FRONTEND_BUILD_DIR` | `./webapp/dist` | ⚠️ Optional | Default value works |
| `VITE_TELEGRAM_BOT_NAME` | `Deutschly` | ✅ Yes | Your bot username |

### Step 5: Deploy

1. Connect your GitHub repository
2. Railway will automatically detect `railway.toml`
3. Trigger deployment
4. Wait for build to complete (≈2-5 minutes)

## 🔄 How It Works

### Build Process

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Build frontend
cd webapp && npm install && npm run build

# 3. Start backend (which serves frontend)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Runtime Architecture

```
Client Request → Railway Load Balancer → Uvicorn (Port 8000)
                                    ↓
                              FastAPI Router
                                    ↓
                          /api/v1/* → API Endpoints
                          / → StaticFiles (frontend)
                                    ↓
                              webapp/dist/
```

## ✅ Verification

After successful deployment:

1. **Frontend:**
   - ✅ `https://your-app.up.railway.app/` → Landing page
   - ✅ Telegram login button works
   - ✅ All frontend routes work

2. **Backend API:**
   - ✅ `https://your-app.up.railway.app/api/v1` → API endpoints
   - ✅ `https://your-app.up.railway.app/docs` → Swagger UI
   - ✅ Telegram webhook at `/api/v1/telegram/webhook`

3. **Telegram Bot:**
   - ✅ `/start` command creates users
   - ✅ Web login via widget works

## 🛠 Troubleshooting

### Issue: Frontend not loading
**Solutions:**
- Check `FRONTEND_BUILD_DIR` points to correct path
- Verify `webapp/dist` exists in container
- Check browser console for 404 errors

### Issue: API endpoints not working
**Solutions:**
- Verify routes are prefixed with `/api/v1`
- Check CORS headers in responses
- Test with Swagger UI at `/docs`

### Issue: Telegram webhook not working
**Solutions:**
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check deployment logs for webhook setup
- Ensure bot privacy mode is disabled

## 🔒 Security Notes

1. **Environment Variables:** Never commit secrets to Git
2. **HTTPS:** Railway provides this automatically
3. **CORS:** Configured to allow your frontend domain
4. **Rate Limiting:** Consider adding for production

## 📊 Performance Tips

1. **Workers:** Increased to 4 for better concurrency
2. **Static Files:** Served directly by Uvicorn
3. **Build Optimization:** Frontend built in production mode

## 🎉 Benefits of Monolithic Deployment

✅ **Simpler setup** - One project instead of two
✅ **Single domain** - No CORS issues between services
✅ **Easier management** - One set of logs and metrics
✅ **Cost effective** - Uses fewer Railway resources
✅ **Automatic scaling** - Railway handles it seamlessly

## 🔄 Migration from Separate Services

If you previously deployed backend and frontend separately:

1. **Delete old projects** (optional)
2. **Create new monolithic project**
3. **Update DNS** to point to new project
4. **Test thoroughly** before switching traffic

The monolithic deployment is now ready! Follow these steps to get your Deutschly platform live on Railway with a single, unified service. 🚀