from fastapi import APIRouter

from app.api import users, posts, feed, follow, game, experiments, auth, words, bot

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(posts.router)
api_router.include_router(feed.router)
api_router.include_router(follow.router)
api_router.include_router(game.router)
api_router.include_router(experiments.router)
api_router.include_router(auth.router)
api_router.include_router(words.router)
api_router.include_router(bot.router)
