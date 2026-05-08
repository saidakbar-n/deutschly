import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.deps import get_db
from app.models import User

router = APIRouter(prefix="/api/v1", tags=["upload"])

# Create uploads directory if it doesn't exist
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def get_file_extension(filename: str) -> str:
    """Extract file extension from filename."""
    return Path(filename).suffix.lower()


def is_allowed_extension(filename: str) -> bool:
    """Check if file extension is allowed."""
    return get_file_extension(filename) in ALLOWED_EXTENSIONS


def generate_unique_filename(extension: str) -> str:
    """Generate a unique filename with UUID."""
    unique_id = str(uuid.uuid4().hex)
    return f"{unique_id[:16]}{extension}"


@router.post("/upload/profile-photo")
async def upload_profile_photo(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a profile photo for a user.
    
    Returns the URL of the uploaded file.
    """
    # Validate user exists
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate file extension
    if not is_allowed_extension(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    
    # Validate file size
    file_size = 0
    # Read file in chunks to check size without loading entire file into memory
    chunk = file.file.read(1024)
    while chunk:
        file_size += len(chunk)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // 1024 // 1024}MB"
            )
        chunk = file.file.read(1024)
    
    # Reset file pointer after reading
    file.file.seek(0)
    
    # Generate unique filename
    extension = get_file_extension(file.filename)
    unique_filename = generate_unique_filename(extension)
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file to disk
    try:
        with file_path.open("wb") as buffer:
            buffer.write(file.file.read())
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Return the relative path for storage in database
    file_url = f"/uploads/{unique_filename}"
    
    # Update user's profile_photo field
    user.profile_photo = file_url
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return JSONResponse(
        status_code=200,
        content={
            "url": file_url,
            "filename": unique_filename,
            "message": "Profile photo uploaded successfully"
        }
    )


@router.delete("/upload/profile-photo")
async def delete_profile_photo(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a user's profile photo.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.profile_photo:
        # Remove the file from disk
        file_path = UPLOAD_DIR / Path(user.profile_photo).name
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                pass  # File might not exist, that's okay
        
        # Clear the profile photo URL
        user.profile_photo = None
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return JSONResponse(
        status_code=200,
        content={"message": "Profile photo deleted successfully"}
    )


@router.post("/upload/post-image")
async def upload_post_image(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not is_allowed_extension(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    file_size = 0
    chunk = file.file.read(1024)
    while chunk:
        file_size += len(chunk)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // 1024 // 1024}MB"
            )
        chunk = file.file.read(1024)

    file.file.seek(0)

    extension = get_file_extension(file.filename)
    unique_filename = generate_unique_filename(extension)
    file_path = UPLOAD_DIR / unique_filename

    try:
        with file_path.open("wb") as buffer:
            buffer.write(file.file.read())
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )

    file_url = f"/uploads/{unique_filename}"

    return JSONResponse(
        status_code=200,
        content={
            "url": file_url,
            "filename": unique_filename,
        }
    )
