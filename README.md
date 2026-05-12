# Deutschly

Learn German through social interaction. A full-stack app combining language learning tools with social features — post updates, chat with others, take quizzes, practice grammar, and track your progress.

## Tech Stack

**Backend:** Python + FastAPI, SQLAlchemy, PostgreSQL (SQLite for dev), WebSocket chat, Whisper STT, LLM integration  
**Frontend:** React + TypeScript, Vite, Tailwind CSS

## Features

- Social feed with posts, likes, comments
- Real-time chat via WebSockets
- Grammar lessons with interactive exercises
- Quizzes and language games (e.g., Word Chain, Verb Dash)
- Flashcard-style word tracking with folders
- Speech-to-text for pronunciation practice
- Translation support
- Notification system with scheduled reminders

## Quick Start

### Backend

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Set up `.env` from `.env.example` with your database URL and API keys.

### Frontend

```bash
cd webapp
npm install
npm run dev
```

The API runs on `http://localhost:8000` and the frontend on `http://localhost:5173`.
