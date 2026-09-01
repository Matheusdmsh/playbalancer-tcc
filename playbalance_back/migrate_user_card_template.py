"""
Migration script to ensure all users have `active_card_template`.

Rule:
- If `active_card_template` is missing, null, or no longer supported, set it to "v1".

Run:
    python migrate_user_card_template.py
"""

import asyncio
import os
import sys

from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings


MONGODB_URL = settings.MONGODB_URL
DATABASE_NAME = settings.DB_NAME
DEFAULT_CARD_TEMPLATE = "v1"
VALID_CARD_TEMPLATES = ("v1", "v2")


async def migrate_user_card_template() -> None:
    print("Starting migration: active_card_template restricted to v1/v2")
    print(f"MongoDB: {MONGODB_URL} | DB: {DATABASE_NAME}")

    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    users_collection = db["users"]

    try:
        result = await users_collection.update_many(
            {"active_card_template": {"$nin": list(VALID_CARD_TEMPLATES)}},
            {"$set": {"active_card_template": DEFAULT_CARD_TEMPLATE}},
        )

        print("=" * 60)
        print("MIGRATION SUMMARY")
        print("=" * 60)
        print(f"Matched users: {result.matched_count}")
        print(f"Updated users: {result.modified_count}")
        print("=" * 60)

    finally:
        client.close()
        print("Connection closed.")


if __name__ == "__main__":
    asyncio.run(migrate_user_card_template())
