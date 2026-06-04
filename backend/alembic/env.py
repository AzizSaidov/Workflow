import os
from logging.config import fileConfig
from dotenv import load_dotenv

from sqlalchemy import engine_from_config, pool
from alembic import context

load_dotenv()

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Override sqlalchemy.url from .env
config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL", ""))

# Import ALL models so Base.metadata knows every table
from database import Base  # noqa: F401, E402
import users.models        # noqa: F401
import projects.models     # noqa: F401
import bids.models         # noqa: F401
import wallet.models       # noqa: F401
import escrow.models       # noqa: F401
import chats.models        # noqa: F401
import reviews.models      # noqa: F401
import profiles.models     # noqa: F401
import notifications.models # noqa: F401
import reports.models      # noqa: F401
import categories.models   # noqa: F401
import skills.models       # noqa: F401
import languages.models    # noqa: F401
import client_profiles.models # noqa: F401
import certifications.models  # noqa: F401
import portfolio.models    # noqa: F401
import contracts.models    # noqa: F401
import favorites.models    # noqa: F401
import disputes.models     # noqa: F401
import achievements.models # noqa: F401
import media.models        # noqa: F401

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
