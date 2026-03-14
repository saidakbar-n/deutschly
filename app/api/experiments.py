from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import ExperimentAssignment

router = APIRouter(prefix="/api/v1/experiments", tags=["experiments"])


@router.get("/assignments/{user_id}")
def list_assignments(user_id: int, db: Session = Depends(get_db)):
    rows = db.scalars(select(ExperimentAssignment).where(ExperimentAssignment.user_id == user_id)).all()
    return [{"experiment_key": r.experiment_key, "variant": r.variant, "assigned_at": r.assigned_at} for r in rows]
