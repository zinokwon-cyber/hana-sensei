"""Initial schema - users and emojis tables

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("azure_oid", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("azure_oid"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_azure_oid", "users", ["azure_oid"])

    op.create_table(
        "emojis",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("prompt", sa.Text, nullable=False),
        sa.Column("image_url", sa.Text, nullable=False),
        sa.Column("style", sa.String(50), nullable=False, server_default="기본"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_emojis_user_id", "emojis", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_emojis_user_id", table_name="emojis")
    op.drop_table("emojis")
    op.drop_index("ix_users_azure_oid", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
