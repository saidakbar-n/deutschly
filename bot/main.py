import os
import logging
from dotenv import load_dotenv
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes
from fastapi import FastAPI
import uvicorn
import asyncio

# Load env
load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:5173")
WEBHOOK_URL = os.getenv("WEBHOOK_URL")  # e.g. https://your-railway-app.up.railway.app/webhook
PORT = int(os.getenv("PORT", "8080"))

# Logging
logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# FastAPI app
api_app = FastAPI()


# Example API endpoint
@api_app.get("/status")
def status():
    return {"status": "ok"}


# Telegram bot helper
def webapp_button(text: str, path: str = "") -> InlineKeyboardMarkup | None:
    url = WEBAPP_URL.rstrip("/") + path
    if not url.startswith("https://"):
        return None
    return InlineKeyboardMarkup([[InlineKeyboardButton(text, web_app=WebAppInfo(url=url))]])


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    kb = webapp_button("🚀 Open Deutschly")
    text = (
        "🇩🇪 Welcome to Deutschly!\nSocial network for German learners.\n"
        "Create profile → Share progress → Find study buddies.\n"
    )
    if kb:
        await update.message.reply_text(text, reply_markup=kb)
    else:
        await update.message.reply_text(text + f"Open WebApp: {WEBAPP_URL}")


async def profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id if update.effective_user else 0
    kb = webapp_button("👤 My Profile", f"/?user_id={user_id}&screen=profile")
    if kb:
        await update.message.reply_text("Open your Deutschly profile:", reply_markup=kb)
    else:
        await update.message.reply_text(f"Open your Deutschly profile: {WEBAPP_URL}/?user_id={user_id}&screen=profile")


async def feed(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id if update.effective_user else 0
    kb = webapp_button("📰 Open Feed", f"/?user_id={user_id}&screen=feed")
    if kb:
        await update.message.reply_text("Your Deutschly feed:", reply_markup=kb)
    else:
        await update.message.reply_text(f"Your Deutschly feed: {WEBAPP_URL}/?user_id={user_id}&screen=feed")


async def search(update: Update, context: ContextTypes.DEFAULT_TYPE):
    kb = webapp_button("🔍 Search learners", "/?screen=search")
    if kb:
        await update.message.reply_text("Search German learners by city/level:", reply_markup=kb)
    else:
        await update.message.reply_text(f"Search German learners: {WEBAPP_URL}/?screen=search")


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "Deutschly commands:\n"
        "/start - Open Deutschly\n"
        "/profile - Open your profile\n"
        "/feed - Open your feed\n"
        "/search - Find learners\n"
        "/help - This help"
    )
    await update.message.reply_text(text)


async def post_init(application: Application):
    await application.bot.set_my_commands(
        [
            ("start", "Open Deutschly"),
            ("profile", "Open your profile"),
            ("feed", "Latest posts"),
            ("search", "Find learners"),
            ("help", "Help"),
        ]
    )


async def start_bot():
    """Start Telegram bot webhook or polling."""
    if not TELEGRAM_TOKEN:
        raise SystemExit("Missing TELEGRAM_BOT_TOKEN env var")

    bot_app = (
        Application.builder()
        .token(TELEGRAM_TOKEN)
        .post_init(post_init)
        .build()
    )

    bot_app.add_handler(CommandHandler("start", start))
    bot_app.add_handler(CommandHandler("profile", profile))
    bot_app.add_handler(CommandHandler("feed", feed))
    bot_app.add_handler(CommandHandler("search", search))
    bot_app.add_handler(CommandHandler("help", help_cmd))

    if WEBHOOK_URL:
        logger.info("Running webhook at %s on port %s", WEBHOOK_URL, PORT)
        await bot_app.run_webhook(
            listen="0.0.0.0",
            port=PORT,
            url_path=TELEGRAM_TOKEN,
            webhook_url=f"{WEBHOOK_URL.rstrip('/')}/{TELEGRAM_TOKEN}",
            drop_pending_updates=True,
        )
    else:
        await bot_app.run_polling(drop_pending_updates=True)


async def main():
    # Run FastAPI and bot concurrently
    await asyncio.gather(
        uvicorn.run(api_app, host="0.0.0.0", port=PORT, log_level="info"),
        start_bot(),
    )


if __name__ == "__main__":
    asyncio.run(main())