from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_, update as sa_update
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import WordFolder, Word, User
from app.schemas.word_folder import (
    WordFolderCreate,
    WordFolderUpdate,
    WordFolderOut,
    WordFolderWithWordsCount,
)

router = APIRouter(prefix="/api/v1/folders", tags=["word_folders"])


@router.post("", response_model=WordFolderOut)
def create_folder(payload: WordFolderCreate, db: Session = Depends(get_db)):
    """Create a new word folder for a user."""
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if folder name already exists for this user
    existing = db.scalar(
        select(WordFolder).where(
            WordFolder.user_id == payload.user_id,
            WordFolder.name.ilike(payload.name)
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="Folder with this name already exists")
    
    folder = WordFolder(**payload.dict())
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.get("/user/{user_id}", response_model=list[WordFolderWithWordsCount])
def list_folders(user_id: int, db: Session = Depends(get_db)):
    """List all folders for a user with word counts."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    folders = db.scalars(
        select(WordFolder)
        .where(WordFolder.user_id == user_id)
        .order_by(WordFolder.sort_order, WordFolder.created_at)
    ).all()
    
    # Add word counts
    result = []
    for folder in folders:
        words_count = db.scalar(
            select(func.count())
            .select_from(Word)
            .where(Word.folder_id == folder.id)
        ) or 0
        result.append(
            WordFolderWithWordsCount(
                **folder.__dict__,
                words_count=words_count
            )
        )
    
    return result


@router.get("/{folder_id}", response_model=WordFolderOut)
def get_folder(folder_id: int, db: Session = Depends(get_db)):
    """Get a single folder by ID."""
    folder = db.get(WordFolder, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder


@router.put("/{folder_id}", response_model=WordFolderOut)
def update_folder(folder_id: int, payload: WordFolderUpdate, db: Session = Depends(get_db)):
    """Update a folder."""
    folder = db.get(WordFolder, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(folder, field, value)
    
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.delete("/{folder_id}")
def delete_folder(folder_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Delete a folder. Moves words to uncategorized (folder_id = NULL)."""
    folder = db.get(WordFolder, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    if folder.user_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot delete another user's folder")
    
    # Move words from this folder to uncategorized
    db.execute(
        sa_update(Word).where(Word.folder_id == folder_id).values(folder_id=None)
    )
    
    db.delete(folder)
    db.commit()
    return {"detail": "Folder deleted, words moved to uncategorized"}


@router.post("/reorder")
def reorder_folders(folders: list[dict], db: Session = Depends(get_db)):
    """Reorder folders by updating sort_order values."""
    for folder_data in folders:
        folder_id = folder_data.get("id")
        sort_order = folder_data.get("sort_order", 0)
        
        folder = db.get(WordFolder, folder_id)
        if folder:
            folder.sort_order = sort_order
            db.add(folder)
    
    db.commit()
    return {"detail": "Folders reordered"}
