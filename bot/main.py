import os
import logging
from dotenv import load_dotenv

from fastapi import FastAPI, Request
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

# --------------------------------------------------
# ENV
# --------------------------------------------------

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL")
WEBHOOK_URL = os.getenv("WEBHOOK_URL")

if not TOKEN:
    raise RuntimeError("TELEGRAM_BOT_TOKEN missing")

# --------------------------------------------------
# LOGGING
# --------------------------------------------------

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)

# --------------------------------------------------
# FASTAPI
# --------------------------------------------------

api_app = FastAPI()

telegram_app: Application | None = None


# --------------------------------------------------
# HELPER
# --------------------------------------------------

def webapp_button(text: str, path: str = "") -> InlineKeyboardMarkup:
    url = WEBAPP_URL.rstrip("/") + path
    return InlineKeyboardMarkup(
        [[InlineKeyboardButton(text, web_app=WebAppInfo(url=url))]]
    )


# --------------------------------------------------
# COMMANDS
# --------------------------------------------------

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):

    kb = webapp_button("🚀 Open Deutschly")

    text = (
        "🇩🇪 Welcome to Deutschly!\n"
        "Social network for German learners.\n"
        "Create profile → Share progress → Find study buddies."
    )

    await update.message.reply_text(text, reply_markup=kb)


async def profile(update: Update, context: ContextTypes.DEFAULT_TYPE):

    user_id = update.effective_user.id

    kb = webapp_button(
        "👤 My Profile",
        f"/?user_id={user_id}&screen=profile"
    )

    await update.message.reply_text(
        "Open your Deutschly profile:",
        reply_markup=kb,
    )


async def feed(update: Update, context: ContextTypes.DEFAULT_TYPE):

    user_id = update.effective_user.id

    kb = webapp_button(
        "📰 Open Feed",
        f"/?user_id={user_id}&screen=feed"
    )

    await update.message.reply_text(
        "Your Deutschly feed:",
        reply_markup=kb,
    )


async def search(update: Update, context: ContextTypes.DEFAULT_TYPE):

    kb = webapp_button(
        "🔍 Search learners",
        "/?screen=search"
    )

    await update.message.reply_text(
        "Search German learners by city/level:",
        reply_markup=kb,
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):

    await update.message.reply_text(
        "Deutschly commands:\n"
        "/start - Open Deutschly\n"
        "/profile - Open your profile\n"
        "/feed - Latest posts\n"
        "/search - Find learners\n"
        "/help - Help"
    )


# --------------------------------------------------
# FASTAPI ROUTES
# --------------------------------------------------

@api_app.get("/")
async def root():
    return {"status": "ok"}


@api_app.post(f"/{TOKEN}")
async def telegram_webhook(req: Request):

    data = await req.json()

    update = Update.de_json(data, telegram_app.bot)

    await telegram_app.process_update(update)

    return {"ok": True}


# --------------------------------------------------
# STARTUP
# --------------------------------------------------

@api_app.on_event("startup")
async def startup():

    global telegram_app

    logger.info("Starting Telegram bot")

    telegram_app = (
        Application.builder()
        .token(TOKEN)
        .build()
    )

    telegram_app.add_handler(CommandHandler("start", start))
    telegram_app.add_handler(CommandHandler("profile", profile))
    telegram_app.add_handler(CommandHandler("feed", feed))
    telegram_app.add_handler(CommandHandler("search", search))
    telegram_app.add_handler(CommandHandler("help", help_cmd))

    await telegram_app.initialize()
    await telegram_app.start()

    webhook_url = f"{WEBHOOK_URL.rstrip('/')}/{TOKEN}"

    logger.info("Setting webhook: %s", webhook_url)

    await telegram_app.bot.set_webhook(webhook_url)


# --------------------------------------------------
# SHUTDOWN
# --------------------------------------------------

@api_app.on_event("shutdown")
async def shutdown():

    if telegram_app:
        await telegram_app.stop()