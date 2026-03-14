from sqlalchemy import Column, ForeignKey, Integer, String, JSON

from app.core.database import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    type = Column(String(20))
    score = Column(Integer)
    words_used = Column(JSON)
