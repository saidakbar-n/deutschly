from fastapi import APIRouter

from app.api import users, posts, feed, follow, game, experiments

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(posts.router)
api_router.include_router(feed.router)
api_router.include_router(follow.router)
api_router.include_router(game.router)
api_router.include_router(experiments.router)
