from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_db
from app.core.streak import update_streak
from app.models import User
from app.models.follow import Follow
from app.models.conversation import Conversation, ConversationParticipant, Message
from app.schemas.chat import ConversationCreate, ConversationListItem, MessageOut, MessageSend, UnreadCountResponse


def _user_to_other_dict(u: User) -> dict:
    return {
        "id": u.id,
        "username": u.username,
        "full_name": u.full_name,
        "profile_photo": u.profile_photo,
        "level": u.level,
        "last_active_date": u.last_active_date,
        "is_online": u.last_active_date == str(date.today()),
    }

router = APIRouter(prefix="/api/v1", tags=["chat"])


@router.get("/conversations")
def list_conversations(user_id: int, db: Session = Depends(get_db)):
    participant_rows = db.scalars(
        select(ConversationParticipant)
        .where(ConversationParticipant.user_id == user_id)
        .options(
            joinedload(ConversationParticipant.conversation)
            .joinedload(Conversation.participants)
        )
    ).unique().all()

    results = []
    for p in participant_rows:
        conv = p.conversation
        last_message = db.scalar(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )

        other_participant = None
        for op in conv.participants:
            if op.user_id != user_id:
                other_user = db.get(User, op.user_id)
                if other_user:
                    other_participant = _user_to_other_dict(other_user)
                break

        unread_count = db.scalar(
            select(func.count(Message.id))
            .where(
                Message.conversation_id == conv.id,
                Message.sender_id != user_id,
                Message.created_at > (p.last_read_at or datetime(2000, 1, 1, tzinfo=timezone.utc)),
            )
        ) or 0

        results.append({
            "id": conv.id,
            "other_user": other_participant,
            "last_message": {
                "id": last_message.id,
                "sender_id": last_message.sender_id,
                "text": last_message.text,
                "created_at": last_message.created_at,
            } if last_message else None,
            "unread_count": unread_count,
            "created_at": conv.created_at,
            "is_pending": p.is_pending,
        })

    results.sort(key=lambda c: (c["last_message"] or {}).get("created_at", c["created_at"]), reverse=True)
    return results


@router.post("/conversations")
def create_conversation(payload: ConversationCreate, db: Session = Depends(get_db)):
    if payload.user_id == payload.participant_id:
        raise HTTPException(status_code=400, detail="Cannot chat with yourself")

    user = db.get(User, payload.user_id)
    other = db.get(User, payload.participant_id)
    if not user or not other:
        raise HTTPException(status_code=404, detail="User not found")

    existing_conv_ids = db.scalars(
        select(ConversationParticipant.conversation_id)
        .where(ConversationParticipant.user_id == payload.user_id)
    ).all()
    for conv_id in existing_conv_ids:
        other_in_conv = db.scalar(
            select(ConversationParticipant)
            .where(
                ConversationParticipant.conversation_id == conv_id,
                ConversationParticipant.user_id == payload.participant_id,
            )
        )
        if other_in_conv:
            conv = db.get(Conversation, conv_id)
            return _conversation_to_item(conv, payload.user_id, db, other_in_conv.is_pending)

    conv = Conversation()
    db.add(conv)
    db.flush()

    # Check if recipient follows sender — if not, conversation is pending for recipient
    recipient_follows_sender = db.scalar(
        select(Follow).where(
            Follow.follower_id == payload.participant_id,
            Follow.following_id == payload.user_id,
        )
    )
    is_pending_for_recipient = not recipient_follows_sender

    db.add(ConversationParticipant(conversation_id=conv.id, user_id=payload.user_id, is_pending=False))
    db.add(ConversationParticipant(conversation_id=conv.id, user_id=payload.participant_id, is_pending=is_pending_for_recipient))
    db.commit()
    db.refresh(conv)

    return _conversation_to_item(conv, payload.user_id, db, False)


def _conversation_to_item(conv: Conversation, viewer_id: int, db: Session, is_pending: bool = False) -> dict:
    other = None
    for p in conv.participants:
        if p.user_id != viewer_id:
            u = db.get(User, p.user_id)
            if u:
                other = _user_to_other_dict(u)
            break

    messages = sorted(conv.messages, key=lambda m: m.created_at, reverse=True)
    last_msg = messages[0] if messages else None

    return {
        "id": conv.id,
        "other_user": other,
        "last_message": {"id": last_msg.id, "sender_id": last_msg.sender_id, "text": last_msg.text, "created_at": last_msg.created_at} if last_msg else None,
        "unread_count": 0,
        "created_at": conv.created_at,
        "is_pending": is_pending,
    }


@router.get("/conversations/unread-count", response_model=UnreadCountResponse)
def unread_count(user_id: int, db: Session = Depends(get_db)):
    conv_ids = db.scalars(
        select(ConversationParticipant.conversation_id).where(
            ConversationParticipant.user_id == user_id
        )
    ).all()

    if not conv_ids:
        return {"unread_count": 0}

    total = 0
    for cid in conv_ids:
        last_read = db.scalar(
            select(ConversationParticipant.last_read_at).where(
                ConversationParticipant.conversation_id == cid,
                ConversationParticipant.user_id == user_id,
            )
        ) or datetime(2000, 1, 1, tzinfo=timezone.utc)

        unread = db.scalar(
            select(func.count(Message.id)).where(
                Message.conversation_id == cid,
                Message.sender_id != user_id,
                Message.created_at > last_read,
            )
        ) or 0
        total += unread

    return {"unread_count": total}


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def list_messages(conversation_id: int, user_id: int, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    is_member = db.scalar(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
    )
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a participant")

    participant = db.scalar(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
    )
    if participant:
        participant.last_read_at = datetime.now(timezone.utc)
        db.commit()

    viewer = db.get(User, user_id)
    if viewer:
        update_streak(viewer, db)
        db.commit()

    messages = db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return list(reversed(messages))


@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut)
async def send_message(conversation_id: int, payload: MessageSend, db: Session = Depends(get_db)):
    conv = db.scalar(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(joinedload(Conversation.participants))
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    is_member = db.scalar(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == payload.sender_id,
        )
    )
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a participant")

    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    msg = Message(
        conversation_id=conversation_id,
        sender_id=payload.sender_id,
        text=payload.text.strip(),
    )
    db.add(msg)
    conv.updated_at = datetime.now(timezone.utc)
    sender = db.get(User, payload.sender_id)
    if sender:
        update_streak(sender, db)
    db.commit()
    db.refresh(msg)

    # Push to recipient via WebSocket
    from app.api.chat_ws import manager
    for p in conv.participants:
        if p.user_id != payload.sender_id:
            await manager.send_to_user(p.user_id, {
                "type": "new_message",
                "conversation_id": conversation_id,
                "message": {
                    "id": msg.id,
                    "conversation_id": msg.conversation_id,
                    "sender_id": msg.sender_id,
                    "text": msg.text,
                    "created_at": msg.created_at.isoformat(),
                }
            })

    return msg


@router.post("/conversations/{conversation_id}/accept")
def accept_chat_request(conversation_id: int, user_id: int, db: Session = Depends(get_db)):
    participant = db.scalar(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
    )
    if not participant:
        raise HTTPException(status_code=404, detail="Not a participant")
    if not participant.is_pending:
        raise HTTPException(status_code=400, detail="Already accepted")

    participant.is_pending = False
    db.commit()
    return {"status": "accepted"}


@router.post("/conversations/{conversation_id}/mark-read")
def mark_read(conversation_id: int, user_id: int, db: Session = Depends(get_db)):
    participant = db.scalar(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
    )
    if not participant:
        raise HTTPException(status_code=404, detail="Not a participant")
    participant.last_read_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "ok"}


@router.delete("/conversations/{conversation_id}")
def decline_chat_request(conversation_id: int, user_id: int, db: Session = Depends(get_db)):
    participant = db.scalar(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
    )
    if not participant:
        raise HTTPException(status_code=404, detail="Not a participant")

    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conv)
    db.commit()
    return {"status": "deleted"}



