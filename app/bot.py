import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.deps import get_db
from app.models import User
from app.api.auth import _generate_recovery_codes

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
WEBHOOK_URL = os.getenv("WEBHOOK_URL")

router = APIRouter(prefix="/api/v1/telegram", tags=["telegram"])


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command - create or update user in database"""
    try:
        user_data = update.effective_user
        
        # Get database session
        db = next(get_db())
        
        # Check if user exists
        existing_user = db.scalar(
            select(User).where(User.telegram_id == user_data.id)
        )
        
        if existing_user:
            # Update existing user
            existing_user.username = user_data.username or existing_user.username
            existing_user.full_name = f"{user_data.first_name or ''} {user_data.last_name or ''}".strip() or existing_user.full_name
            if user_data.photo_url:
                existing_user.profile_photo = user_data.photo_url
            db.commit()
            await update.message.reply_text(f"Welcome back, @{user_data.username}! Your account is linked.")
        else:
            # Create new user
            new_user = User(
                telegram_id=user_data.id,
                username=user_data.username or f"user_{user_data.id}",
                full_name=f"{user_data.first_name or ''} {user_data.last_name or ''}".strip() or None,
                profile_photo=user_data.photo_url,
                level="A1",  # Default level
                recovery_codes=_generate_recovery_codes(),
            )
            db.add(new_user)
            db.commit()
            await update.message.reply_text(f"Hello @{user_data.username}! Your Deutschly account has been created. Your Telegram ID is {user_data.id}.")
        
        db.close()
        
    except Exception as e:
        print(f"Error in start command: {e}")
        await update.message.reply_text("Sorry, there was an error processing your request.")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    help_text = """
🌟 Deutschly Bot Help 🌟

Available commands:
/start - Create or link your account
/help - Show this help message

You can also use Deutschly on the web at https://deutschly.com"""
    await update.message.reply_text(help_text)


async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Echo back user messages"""
    if update.message.text:
        await update.message.reply_text(f"You said: {update.message.text}")


# Initialize the bot application
if TELEGRAM_BOT_TOKEN:
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, echo))
else:
    print("⚠️ TELEGRAM_BOT_TOKEN is not set. Telegram bot will not be enabled.")
    application = None


@router.post("/webhook")
async def telegram_webhook(update: dict, background_tasks: BackgroundTasks):
    """Handle incoming Telegram webhook updates"""
    if not application:
        raise HTTPException(status_code=503, detail="Telegram bot is not enabled")
    
    try:
        # Process the update in the background
        background_tasks.add_task(application.update_queue.put, Update.de_json(update, application.bot))
        return {"message": "Update processed", "status": "success"}
    except Exception as e:
        print(f"Error processing webhook update: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook update")


@router.on_event("startup")
async def set_webhook():
    if application and TELEGRAM_BOT_TOKEN and WEBHOOK_URL:
        try:
            webhook_info = await application.bot.get_webhook_info()
            expected_url = WEBHOOK_URL + router.prefix + "/webhook"
            if webhook_info.url != expected_url:
                await application.bot.set_webhook(url=expected_url)
                print(f"✅ Webhook set to {expected_url}")
            else:
                print(f"✅ Webhook already set to {expected_url}")
        except Exception as e:
            print(f"❌ Failed to set webhook: {e}")
            if application:
                print("🔄 Fallback to polling mode for development")
                # application.run_polling()  # Uncomment for local testing
    elif application and not WEBHOOK_URL:
        print("⚠️ WEBHOOK_URL is not set. Telegram bot will use polling (not recommended for production).")
    elif application and not TELEGRAM_BOT_TOKEN:
        print("⚠️ TELEGRAM_BOT_TOKEN is not set. Telegram bot will not be enabled.")


@router.on_event("shutdown")
async def unset_webhook():
    if application and TELEGRAM_BOT_TOKEN:
        await application.bot.delete_webhook()
        print("Webhook deleted.")


# To run the bot in polling mode (for local testing without webhook setup):
# if __name__ == "__main__":
#     if application:
#         print("Starting Telegram bot in polling mode...")
#         application.run_polling()
