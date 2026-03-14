"""initial tables

Revision ID: 0001
Revises: 
Create Date: 2026-03-13
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('telegram_id', sa.BigInteger(), nullable=False, unique=True),
        sa.Column('username', sa.String(length=50), nullable=False, unique=True),
        sa.Column('level', sa.String(length=10), nullable=False),
        sa.Column('city', sa.String(length=50)),
        sa.Column('interests', sa.JSON()),
        sa.Column('profile_photo', sa.Text()),
        sa.Column('words_count', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'posts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('text', sa.Text()),
        sa.Column('image_url', sa.Text()),
        sa.Column('level_tag', sa.String(length=10)),
        sa.Column('likes', sa.Integer(), server_default='0'),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime()),
    )

    op.create_table(
        'follows',
        sa.Column('follower_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('following_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    )

    op.create_table(
        'likes',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('post_id', sa.Integer(), sa.ForeignKey('posts.id', ondelete='CASCADE')),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.UniqueConstraint('post_id', 'user_id', name='uq_post_user_like'),
    )

    op.create_table(
        'comments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('post_id', sa.Integer(), sa.ForeignKey('posts.id', ondelete='CASCADE')),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'games',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('type', sa.String(length=20)),
        sa.Column('score', sa.Integer()),
        sa.Column('words_used', sa.JSON()),
    )

    op.create_table(
        'experiment_assignments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('experiment_key', sa.String(length=50), nullable=False),
        sa.Column('variant', sa.String(length=50), nullable=False),
        sa.Column('assigned_at', sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'experiment_key', name='uq_user_experiment'),
    )

    op.create_table(
        'feed_events',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('post_id', sa.Integer(), sa.ForeignKey('posts.id', ondelete='CASCADE')),
        sa.Column('event', sa.String(length=30), nullable=False),
        sa.Column('variant', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('feed_events')
    op.drop_table('experiment_assignments')
    op.drop_table('games')
    op.drop_table('comments')
    op.drop_table('likes')
    op.drop_table('follows')
    op.drop_table('posts')
    op.drop_table('users')
