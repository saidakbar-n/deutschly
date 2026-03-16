import os
import logging
import asyncio
from dotenv import load_dotenv

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

from fastapi import FastAPI
import uvicorn

# Load env
load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:5173")
WEBHOOK_URL = os.getenv("WEBHOOK_URL")
PORT = int(os.getenv("PORT", "8080"))

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI()

telegram_app: Application | None = None


# ---------- FastAPI routes ----------

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/status")
def status():
    return {"status": "ok"}


# ---------- Telegram helpers ----------

def webapp_button(text: str, path: str = "") -> InlineKeyboardMarkup | None:
    url = WEBAPP_URL.rstrip("/") + path
    if not url.startswith("https://"):
        return None
    return InlineKeyboardMarkup(
        [[InlineKeyboardButton(text, web_app=WebAppInfo(url=url))]]
    )


# ---------- Telegram commands ----------

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    kb = webapp_button("🚀 Open Deutschly")
    text = (
        "🇩🇪 Welcome to Deutschly!\n"
        "Social network for German learners.\n"
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
        await update.message.reply_text(
            "Open your Deutschly profile:", reply_markup=kb
        )
    else:
        await update.message.reply_text(
            f"{WEBAPP_URL}/?user_id={user_id}&screen=profile"
        )


async def feed(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id if update.effective_user else 0

    kb = webapp_button("📰 Open Feed", f"/?user_id={user_id}&screen=feed")

    if kb:
        await update.message.reply_text("Your Deutschly feed:", reply_markup=kb)
    else:
        await update.message.reply_text(
            f"{WEBAPP_URL}/?user_id={user_id}&screen=feed"
        )


async def search(update: Update, context: ContextTypes.DEFAULT_TYPE):

    kb = webapp_button("🔍 Search learners", "/?screen=search")

    if kb:
        await update.message.reply_text(
            "Search German learners by city/level:", reply_markup=kb
        )
    else:
        await update.message.reply_text(f"{WEBAPP_URL}/?screen=search")


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


async def post_init(app: Application):
    await app.bot.set_my_commands(
        [
            ("start", "Open Deutschly"),
            ("profile", "Open your profile"),
            ("feed", "Latest posts"),
            ("search", "Find learners"),
            ("help", "Help"),
        ]
    )


# ---------- Telegram startup ----------

async def start_bot():

    global telegram_app

    if not TOKEN:
        raise RuntimeError("Missing TELEGRAM_BOT_TOKEN")

    telegram_app = (
        Application.builder()
        .token(TOKEN)
        .post_init(post_init)
        .build()
    )

    telegram_app.add_handler(CommandHandler("start", start))
    telegram_app.add_handler(CommandHandler("profile", profile))
    telegram_app.add_handler(CommandHandler("feed", feed))
    telegram_app.add_handler(CommandHandler("search", search))
    telegram_app.add_handler(CommandHandler("help", help_cmd))

    await telegram_app.initialize()
    await telegram_app.start()

    if WEBHOOK_URL:

        logger.info("Starting webhook bot")

        await telegram_app.bot.set_webhook(
            url=f"{WEBHOOK_URL.rstrip('/')}/{TOKEN}"
        )

    else:

        logger.info("Starting polling bot")

        await telegram_app.updater.start_polling()


# ---------- FastAPI lifecycle ----------

@app.on_event("startup")
async def startup():

    asyncio.create_task(start_bot())


# ---------- Entry point ----------

if __name__ == "__main__":

    uvicorn.run(
        "bot.main:app",
        host="0.0.0.0",
        port=PORT,
        log_level="info",
    )