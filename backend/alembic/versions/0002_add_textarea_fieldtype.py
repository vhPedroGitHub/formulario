"""Add textarea to FieldType enum

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-04 00:00:00.000000
"""
from alembic import op


revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'textarea'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; downgrade is a no-op
    pass
