from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from app.models.notification import Notification
from app.models.user_grammar_progress import UserGrammarProgress
from app.models.user import User

def generate_grammar_notifications(db: Session) -> int:
    """Generate smart notifications for users who haven't practiced grammar recently"""
    count = 0
    today = datetime.now(timezone.utc).date()
    three_days_ago = (datetime.now(timezone.utc) - timedelta(days=3)).date()
    
    # Find users with low grammar activity
    users_with_progress = db.query(UserGrammarProgress.user_id).distinct().all()
    user_ids = [u[0] for u in users_with_progress]
    
    for user_id in user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            continue
            
        # Check last grammar practice
        progress = db.query(UserGrammarProgress).filter(
            UserGrammarProgress.user_id == user_id
        ).order_by(UserGrammarProgress.last_practiced_at.desc()).first()
        
        if not progress or datetime.strptime(progress.last_practiced_at[:10], '%Y-%m-%d').date() < three_days_ago:
            # Check if notification already sent today
            existing = db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.type == 'grammar_reminder',
                cast(Notification.created_at, Date) == today
            ).first()
            
            if not existing:
                notification = Notification(
                    user_id=user_id,
                    type='grammar_reminder',
                    text='Ready for your 2-minute grammar check? Practice German cases!',
                    is_read=0
                )
                db.add(notification)
                count += 1
        
        # Check for low correct rate rules
        low_score_rules = db.query(UserGrammarProgress).filter(
            UserGrammarProgress.user_id == user_id,
            UserGrammarProgress.total_attempts >= 5,
            (UserGrammarProgress.correct_attempts / UserGrammarProgress.total_attempts) < 0.6
        ).all()
        
        if low_score_rules:
            existing = db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.type == 'grammar_review',
                cast(Notification.created_at, Date) == today
            ).first()
            
            if not existing:
                notification = Notification(
                    user_id=user_id,
                    type='grammar_review',
                    text='Let\'s review those tricky German cases! Your accuracy could use some practice.',
                    is_read=0
                )
                db.add(notification)
                count += 1
    
    if count > 0:
        db.commit()
    
    return count
