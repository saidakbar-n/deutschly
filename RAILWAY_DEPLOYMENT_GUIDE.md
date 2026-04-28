# Deutschly Railway.app Deployment Guide

This guide provides step-by-step instructions for deploying Deutschly on Railway.app with proper backend-frontend connection and Telegram bot webhook setup.

## 🚀 Deployment Overview

You'll deploy two separate services:
1. **Backend**: FastAPI server with Telegram bot
2. **Frontend**: React/Vite web application

The services will communicate via HTTP requests, and the Telegram bot will use webhooks.

## 📁 Files Created

- `railway-backend.toml` - Configuration for backend service
- `railway-frontend.toml` - Configuration for frontend service  
- `RAILWAY_DEPLOYMENT_GUIDE.md` - This guide

## 🔧 Prerequisites

1. **Railway.app account** - Sign up at [railway.app](https://railway.app)
2. **Telegram Bot** - Create one with [@BotFather](https://t.me/BotFather)
3. **Domain** - Optional, but recommended for production

## 🛠 Backend Deployment

### Step 1: Create New Project
1. Go to Railway.app dashboard
2. Click "New Project" → "Empty Project"
3. Name it "Deutschly Backend"

### Step 2: Add PostgreSQL Database
1. Click "Add Database" → "PostgreSQL"
2. Wait for database to provision
3. Note the `DATABASE_URL` from the database variables

### Step 3: Add Environment Variables
Go to project settings → Variables and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | From your PostgreSQL database |
| `TELEGRAM_BOT_TOKEN` | `123456789:ABC...` | From @BotFather |
| `SECRET_KEY` | `your-random-key` | Generate with: `openssl rand -hex 32` |
| `FRONTEND_ORIGIN` | `https://your-frontend.up.railway.app` | Will be set after frontend deploy |

### Step 4: Deploy Backend
1. Connect your GitHub repository
2. Upload `railway-backend.toml` to your repository root
3. Railway will automatically detect the configuration
4. Trigger deployment

### Step 5: Verify Backend
1. After deployment, visit `https://your-backend.up.railway.app`
2. Check API docs at `https://your-backend.up.railway.app/docs`
3. Verify Telegram webhook is set (check deployment logs)

## 🖥 Frontend Deployment

### Step 1: Create New Project
1. Go to Railway.app dashboard
2. Click "New Project" → "Empty Project"
3. Name it "Deutschly Frontend"

### Step 2: Add Environment Variables
Go to project settings → Variables and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `BACKEND_DOMAIN` | `https://your-backend.up.railway.app` | Your backend URL |
| `VITE_TELEGRAM_BOT_NAME` | `Deutschly` | Your bot username without @ |

### Step 3: Deploy Frontend
1. Connect your GitHub repository
2. Upload `railway-frontend.toml` to your repository root
3. Railway will automatically detect the configuration
4. Trigger deployment

### Step 4: Verify Frontend
1. After deployment, visit `https://your-frontend.up.railway.app`
2. Test user registration and login
3. Test Telegram login button

## 🤖 Telegram Bot Configuration

### Step 1: Set Bot Privacy Mode
1. Talk to [@BotFather](https://t.me/BotFather)
2. Select your bot
3. Choose "Bot Settings" → "Privacy Mode"
4. Set to **Disabled** (so bot can receive messages from all users)

### Step 2: Configure Login Widget
1. Go to [@BotFather](https://t.me/BotFather)
2. Select your bot
3. Choose "Bot Settings" → "Domain"
4. Add your frontend domain: `your-frontend.up.railway.app`
5. Ensure bot username is exactly `Deutschly` (matches @deutschly_bot)

### Step 3: Test Webhook
1. Send `/start` command to your bot from Telegram app
2. You should receive a welcome message
3. Test web login via the frontend Telegram button

## 🔄 Connecting Backend and Frontend

### Update Backend with Frontend URL
1. Go to backend project settings
2. Update `FRONTEND_ORIGIN` variable with your frontend URL
3. Redeploy backend

### Update Frontend with Backend URL  
1. Go to frontend project settings
2. Update `BACKEND_DOMAIN` variable with your backend URL
3. Redeploy frontend

## 🌐 Custom Domain (Optional)

### Step 1: Add Domain in Railway
1. Go to project settings → Domains
2. Click "Add Domain"
3. Enter your custom domain (e.g., `app.deutschly.com`)

### Step 2: Configure DNS
1. Add CNAME record pointing to Railway
2. Verify domain ownership
3. Update environment variables with custom domain

## 🚨 Troubleshooting

### Common Issues

**Telegram webhook not working:**
- Check `TELEGRAM_BOT_TOKEN` is correct
- Verify bot privacy mode is disabled
- Check deployment logs for webhook setup messages
- Ensure your domain is added to bot settings

**CORS errors:**
- Verify `FRONTEND_ORIGIN` is set correctly in backend
- Check browser console for exact error
- Ensure both services are using HTTPS

**Database connection issues:**
- Check `DATABASE_URL` format
- Verify PostgreSQL service is running
- Test connection with `psql`

## 📊 Monitoring

Use Railway's built-in monitoring:
- **Logs**: View real-time logs for debugging
- **Metrics**: Monitor CPU, memory, and response times
- **Alerts**: Set up notifications for errors

## 🔒 Security Best Practices

1. **Keep tokens secret**: Never commit `TELEGRAM_BOT_TOKEN` or `SECRET_KEY` to version control
2. **Use HTTPS**: Railway provides this automatically
3. **Rate limiting**: Consider adding rate limiting to API endpoints
4. **Regular updates**: Keep dependencies updated

## 🎉 Deployment Complete!

Your Deutschly application should now be fully deployed with:
- ✅ Backend API server
- ✅ Frontend web application  
- ✅ Telegram bot with webhook
- ✅ User authentication system
- ✅ Proper CORS configuration
- ✅ Database integration

Enjoy your deployed Deutschly social learning platform! 🚀