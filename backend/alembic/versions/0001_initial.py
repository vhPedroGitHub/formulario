"""Initial migration

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'faculties',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(200), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'careers',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('faculty_id', sa.Integer(), sa.ForeignKey('faculties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('duration_years', sa.Integer(), nullable=False),
        sa.Column('groups_per_year', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'groups',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('career_id', sa.Integer(), sa.ForeignKey('careers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('group_number', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('career_id', 'year', 'group_number', name='uq_group_career_year_num'),
    )

    op.create_table(
        'special_roles',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('username', sa.String(64), nullable=False, unique=True, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('role', sa.Enum('admin', 'user', 'special', name='userrole'), nullable=False),
        sa.Column('special_role_id', sa.Integer(), sa.ForeignKey('special_roles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('faculty_id', sa.Integer(), sa.ForeignKey('faculties.id', ondelete='SET NULL'), nullable=True),
        sa.Column('career_id', sa.Integer(), sa.ForeignKey('careers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('group_id', sa.Integer(), sa.ForeignKey('groups.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_confirmed', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'forms',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_anonymous', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_editable', sa.Boolean(), nullable=False, default=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'form_audience',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('form_id', sa.Integer(), sa.ForeignKey('forms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('target_type', sa.Enum('faculty', 'career', 'group', 'user', 'special_role', name='audiencetargettype'), nullable=False),
        sa.Column('target_id', sa.Integer(), nullable=False),
    )

    op.create_table(
        'form_fields',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('form_id', sa.Integer(), sa.ForeignKey('forms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, default=0),
        sa.Column('type', sa.Enum('text', 'number', 'date', 'checkbox', 'radio', 'scale', 'file', 'table', name='fieldtype'), nullable=False),
        sa.Column('label', sa.String(500), nullable=False),
        sa.Column('help_text', sa.Text(), nullable=True),
        sa.Column('is_required', sa.Boolean(), nullable=False, default=False),
        sa.Column('options', postgresql.JSONB(), nullable=True),
        sa.Column('conditional_logic', postgresql.JSONB(), nullable=True),
    )

    op.create_table(
        'form_responses',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('form_id', sa.Integer(), sa.ForeignKey('forms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('form_id', 'user_id', name='uq_response_form_user'),
    )

    op.create_table(
        'form_answers',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('response_id', sa.Integer(), sa.ForeignKey('form_responses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('field_id', sa.Integer(), sa.ForeignKey('form_fields.id', ondelete='CASCADE'), nullable=False),
        sa.Column('value', postgresql.JSONB(), nullable=True),
    )

    op.create_table(
        'uploaded_files',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('answer_id', sa.Integer(), sa.ForeignKey('form_answers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('original_name', sa.String(255), nullable=False),
        sa.Column('stored_path', sa.String(500), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('size', sa.BigInteger(), nullable=False, default=0),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('form_id', sa.Integer(), sa.ForeignKey('forms.id', ondelete='SET NULL'), nullable=True),
        sa.Column('message', sa.String(500), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('uploaded_files')
    op.drop_table('form_answers')
    op.drop_table('form_responses')
    op.drop_table('form_fields')
    op.drop_table('form_audience')
    op.drop_table('forms')
    op.drop_table('refresh_tokens')
    op.drop_table('users')
    op.drop_table('special_roles')
    op.drop_table('groups')
    op.drop_table('careers')
    op.drop_table('faculties')
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS audiencetargettype")
    op.execute("DROP TYPE IF EXISTS fieldtype")
