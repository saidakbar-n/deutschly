from fastapi import APIRouter

from app.api.users import router as users_router
from app.api.posts import router as posts_router
from app.api.feed import router as feed_router
from app.api.follow import router as follow_router
from app.api.game import router as game_router
from app.api.experiments import router as experiments_router
from app.api.auth import router as auth_router
from app.api.words import router as words_router
from app.api.word_folders import router as word_folders_router
from app.api.upload import router as upload_router
from app.api.notifications import router as notifications_router
from app.api.quizzes import router as quizzes_router
from app.api.grammar import router as grammar_router

api_router = APIRouter()
api_router.include_router(users_router)
api_router.include_router(posts_router)
api_router.include_router(feed_router)
api_router.include_router(follow_router)
api_router.include_router(game_router)
api_router.include_router(experiments_router)
api_router.include_router(auth_router)
api_router.include_router(words_router)
api_router.include_router(word_folders_router)
api_router.include_router(upload_router)
api_router.include_router(notifications_router)
api_router.include_router(quizzes_router)
api_router.include_router(grammar_router)
