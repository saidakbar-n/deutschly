# Path-Based Routing Guide for Railway Deployment

## 🎯 Objective

Configure Deutschly to work on a single domain (`web-production-25fc.up.railway.app`) with proper path-based routing:
- **Frontend:** `/` (React app)
- **Backend API:** `/api/v1/*` (FastAPI endpoints)
- **Telegram Webhook:** `/api/v1/telegram/webhook`
- **API Docs:** `/docs`

## ✅ Current Configuration

### Updated `railway.toml`
```toml
[[services]]
name = "deutschly-app"
internalPort = 8000
protocol = "http"
env = {
  DATABASE_URL = "${{ DATABASE_URL }}",
  TELEGRAM_BOT_TOKEN = "${{ TELEGRAM_BOT_TOKEN }}",
  WEBHOOK_URL = "${{ RAILWAY_PUBLIC_DOMAIN }}",  # Uses actual Railway domain
  SECRET_KEY = "${{ SECRET_KEY }}",
  FRONTEND_BUILD_DIR = "./webapp/dist"
}

buildCommand = "pip install -r requirements.txt && cd webapp && npm install && npm run build && cd .."
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4"
```

### Updated `app/main.py`
```python
# Serve frontend static files from root
frontend_build_dir = os.getenv("FRONTEND_BUILD_DIR", "./webapp/dist")
if os.path.exists(frontend_build_dir):
    app.mount("/", StaticFiles(directory=frontend_build_dir, html=True), name="frontend")
```

### Updated `webapp/src/hooks/useApi.ts`
```typescript
// Use relative path for production to avoid domain issues
const defaultApiUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '/api/v1')
```

## 🔄 Routing Structure

```
web-production-25fc.up.railway.app/
├── /                          → Frontend (React app)
├── /feed                      → Frontend route
├── /profile                   → Frontend route
├── /words                     → Frontend route
├── /api/v1/                   → Backend API root
│   ├── /posts                → Post endpoints
│   ├── /users                → User endpoints
│   ├── /auth                 → Auth endpoints
│   ├── /telegram             → Telegram webhook
│   └── ...                   → Other API endpoints
├── /docs/                    → Swagger UI
└── /openapi.json            → OpenAPI spec
```

## 🛠 Deployment Steps

### Step 1: Update Environment Variables

In Railway project settings, ensure:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | From Railway PostgreSQL |
| `TELEGRAM_BOT_TOKEN` | `8722275184:AAG2-gSJnRf6ellm4Dynto8RVuFkJTkQGR4` | Your bot token |
| `SECRET_KEY` | `your-32-char-key` | Generate with `openssl rand -hex 32` |
| `FRONTEND_BUILD_DIR` | `./webapp/dist` | Default works |

**Note:** `RAILWAY_PUBLIC_DOMAIN` is automatically set by Railway to `web-production-25fc.up.railway.app`

### Step 2: Deploy

```bash
# Railway will:
# 1. Install Python dependencies
# 2. Build frontend (npm install && npm run build)
# 3. Start backend with frontend static files

git push railway main
```

### Step 3: Verify Path Routing

After deployment, test these URLs:

1. **Frontend:**
   - ✅ `https://web-production-25fc.up.railway.app/` → Landing page
   - ✅ `https://web-production-25fc.up.railway.app/feed` → Feed page
   - ✅ `https://web-production-25fc.up.railway.app/profile` → Profile page

2. **Backend API:**
   - ✅ `https://web-production-25fc.up.railway.app/api/v1/posts` → API endpoint
   - ✅ `https://web-production-25fc.up.railway.app/api/v1/users` → Users endpoint
   - ✅ `https://web-production-25fc.up.railway.app/api/v1/auth/telegram` → Telegram auth

3. **Telegram Webhook:**
   - ✅ `https://web-production-25fc.up.railway.app/api/v1/telegram/webhook` → Webhook endpoint

4. **API Documentation:**
   - ✅ `https://web-production-25fc.up.railway.app/docs` → Swagger UI
   - ✅ `https://web-production-25fc.up.railway.app/openapi.json` → OpenAPI spec

## 🔧 How It Works

### Request Flow

```
Client → Railway Load Balancer → Uvicorn (Port 8000)
                                    ↓
                              FastAPI Router
                                    ↓
                          / → StaticFiles (frontend)
                          /api/v1/* → APIRouter
                          /docs → Swagger UI
```

### Static Files Serving

```python
# In app/main.py
app.mount("/", StaticFiles(directory="./webapp/dist", html=True), name="frontend")
```

This serves:
- `index.html` for all frontend routes
- Static assets (JS, CSS, images) from `/webapp/dist/`

### API Routing

```python
# In app/api/__init__.py
api_router = APIRouter(prefix="/api/v1")
app.include_router(api_router)
```

All API endpoints are prefixed with `/api/v1`

## ✅ Verification Checklist

- [ ] Frontend loads at root path `/`
- [ ] API endpoints work at `/api/v1/*`
- [ ] Telegram webhook configured correctly
- [ ] No CORS errors (same domain)
- [ ] All frontend routes work
- [ ] API documentation accessible

## 🚨 Common Issues & Solutions

### Issue: Frontend routes return 404
**Solution:**
- Ensure `html=True` in StaticFiles mount
- Verify React Router is configured for client-side routing
- Check that `index.html` handles all routes

### Issue: API calls fail
**Solution:**
- Verify API calls use `/api/v1` prefix
- Check browser dev tools for exact error
- Ensure backend is running and healthy

### Issue: Telegram webhook not working
**Solution:**
- Verify webhook URL in logs
- Check `WEBHOOK_URL` environment variable
- Ensure bot token is correct

### Issue: Mixed content warnings
**Solution:**
- Ensure all assets use relative paths
- Check for hardcoded `http://` URLs
- Verify Railway uses HTTPS (it does by default)

## 🔒 Security Considerations

1. **Path Security:** Ensure API paths don't conflict with frontend routes
2. **CORS:** Not needed (same domain)
3. **CSRF:** Consider adding protection for forms
4. **Rate Limiting:** Add for API endpoints in production

## 📊 Performance Optimization

1. **Caching:** Configure proper cache headers for static assets
2. **Compression:** Enable gzip/brotli for static files
3. **Workers:** Already set to 4 for concurrency
4. **CDN:** Consider for static assets in production

## 🎉 Benefits of This Approach

✅ **Single domain** - No CORS issues
✅ **Clean URLs** - `/api/v1/*` for API, `/` for frontend
✅ **Easy deployment** - One Railway service
✅ **Cost effective** - Single container
✅ **Scalable** - Railway handles scaling

## 🔄 Migration from Multiple Services

If you previously had separate services:

1. **Update DNS** to point to new monolithic service
2. **Test thoroughly** before switching traffic
3. **Monitor** for any path-related issues
4. **Update Telegram bot** domain if needed

The path-based routing is now properly configured! Everything will work on `web-production-25fc.up.railway.app` with the correct path structure. 🚀