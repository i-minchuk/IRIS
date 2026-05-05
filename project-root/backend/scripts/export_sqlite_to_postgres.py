#!/usr/bin/env python3
"""
Export data from SQLite to PostgreSQL.
Usage:
    # First, configure your PostgreSQL URL in .env
    python scripts/export_sqlite_to_postgres.py

Requirements:
    pip install asyncpg
"""
import asyncio
import json

from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings


TABLES = [
    "users",
    "projects",
    "stages",
    "kits",
    "sections",
    "documents",
    "revisions",
    "change_sheets",
    "document_remarks",
    "approval_workflows",
    "approval_stages",
    "document_dependencies",
    "remarks",
    "remark_comments",
    "remark_tags",
    "remark_tag_links",
    "tenders",
    "tender_document_previews",
    "engineer_metrics",
    "gamification_events",
    "gamification_badges",
    "daily_quests",
    "combo_achievements",
    "notifications",
    "archive_entries",
    "archive_materials",
    "archive_constructions",
    "archive_search_index",
]


async def export_data():
    # SQLite (source) - synchronous engine
    sqlite_path = settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    sqlite_engine = create_engine(f"sqlite:///{sqlite_path}", echo=False)

    # PostgreSQL (destination) - async engine
    pg_url = settings.DATABASE_URL
    if "sqlite" in pg_url:
        print("❌ Set DATABASE_URL to PostgreSQL in .env to export!")
        return

    postgres_engine = create_async_engine(pg_url, echo=False)

    print(f"📤 Source:      SQLite ({sqlite_path})")
    print(f"📥 Destination: PostgreSQL")
    print()

    total_rows = 0

    with sqlite_engine.connect() as sqlite_conn:
        async with postgres_engine.begin() as pg_conn:
            for table in TABLES:
                try:
                    # Read from SQLite
                    result = sqlite_conn.execute(text(f"SELECT * FROM {table}"))
                    rows = result.mappings().all()
                    if not rows:
                        print(f"⚠️  {table}: empty, skipped")
                        continue

                    # Get column names
                    columns = list(rows[0].keys())

                    # Truncate PostgreSQL table
                    await pg_conn.execute(text(f"TRUNCATE TABLE {table} CASCADE"))

                    # Insert data
                    placeholders = ", ".join([f":{c}" for c in columns])
                    query = text(
                        f"INSERT INTO {table} ({', '.join(columns)}) "
                        f"VALUES ({placeholders})"
                    )

                    batch_size = 100
                    for i in range(0, len(rows), batch_size):
                        batch = rows[i : i + batch_size]
                        for row in batch:
                            row_dict = dict(row)
                            # Convert SQLite types for PostgreSQL
                            for key, value in row_dict.items():
                                if isinstance(value, bytes):
                                    # UUID bytes → hex string
                                    row_dict[key] = value.hex()
                                elif isinstance(value, str) and len(value) > 0:
                                    # Try to detect JSON strings for JSONB columns
                                    if value.startswith("[") or value.startswith("{"):
                                        try:
                                            json.loads(value)
                                            # It's valid JSON, keep as-is for SQLAlchemy
                                        except (json.JSONDecodeError, ValueError):
                                            pass
                            await pg_conn.execute(query, row_dict)

                    print(f"✅  {table}: {len(rows)} rows migrated")
                    total_rows += len(rows)

                except Exception as e:
                    print(f"❌  {table}: error — {e}")

    print(f"\n🎉 Migration complete! Total: {total_rows} rows across {len(TABLES)} tables")


if __name__ == "__main__":
    asyncio.run(export_data())