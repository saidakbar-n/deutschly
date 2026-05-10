from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.core.deps import get_db
from app.models.sticky_note import StickyNote

router = APIRouter(prefix="/api/v1", tags=["sticky_notes"])


class StickyNoteCreate(BaseModel):
    user_id: int
    title: Optional[str] = None
    content: str
    color: str = "yellow"
    is_pinned: bool = False
    reminder_at: Optional[datetime] = None


class StickyNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    color: Optional[str] = None
    is_pinned: Optional[bool] = None
    reminder_at: Optional[datetime] = None


class StickyNoteOut(BaseModel):
    id: int
    user_id: int
    title: Optional[str]
    content: str
    color: str
    is_pinned: bool
    reminder_at: Optional[datetime]
    reminder_sent: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


@router.get("/sticky-notes", response_model=list[StickyNoteOut])
def list_notes(user_id: int, db: Session = Depends(get_db)):
    notes = db.scalars(
        select(StickyNote)
        .where(StickyNote.user_id == user_id)
        .order_by(StickyNote.is_pinned.desc(), StickyNote.updated_at.desc())
    ).all()
    return notes


@router.post("/sticky-notes", response_model=StickyNoteOut)
def create_note(payload: StickyNoteCreate, db: Session = Depends(get_db)):
    note = StickyNote(**payload.dict())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/sticky-notes/{note_id}", response_model=StickyNoteOut)
def update_note(note_id: int, payload: StickyNoteUpdate, user_id: int, db: Session = Depends(get_db)):
    note = db.get(StickyNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your note")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(note, field, value)
    note.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/sticky-notes/{note_id}")
def delete_note(note_id: int, user_id: int, db: Session = Depends(get_db)):
    note = db.get(StickyNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your note")
    db.delete(note)
    db.commit()
    return {"detail": "deleted"}
