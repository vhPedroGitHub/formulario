"""unique constraint on form_responses(form_id, user_id)

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-04
"""

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove any accidental duplicate rows first (keep the earliest one)
    op.execute(
        """
        DELETE FROM form_responses
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM form_responses
            GROUP BY form_id, user_id
        )
        """
    )
    op.create_unique_constraint(
        "uq_form_responses_form_user",
        "form_responses",
        ["form_id", "user_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_form_responses_form_user", "form_responses", type_="unique")
