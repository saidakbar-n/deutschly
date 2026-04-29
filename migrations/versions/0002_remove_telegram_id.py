"""Remove telegram_id column from users table

Revision ID: 0002
Revises: 0001
Create Date: 2024-12-19

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column('users', 'telegram_id')


def downgrade() -> None:
    op.add_column('users', sa.Column('telegram_id', sa.BigInteger(), nullable=False, unique=True))
