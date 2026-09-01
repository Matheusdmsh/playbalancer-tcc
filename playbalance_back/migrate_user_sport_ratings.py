"""
Script de migração para recalcular `sport_ratings` de TODOS os usuários.

Regra:
- Agrupa os grupos do usuário por modalidade (`modality`, normalizada para minúsculo).
- Usa o `skill_level` do membro naquele grupo.
- Média por modalidade com 2 casas decimais.
- Se o usuário não tiver grupos de uma modalidade (ou skill válido), essa modalidade não aparece.

Execução:
    python migrate_user_sport_ratings.py
"""

import asyncio
import os
import sys
from typing import Dict, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings


MONGODB_URL = settings.MONGODB_URL
DATABASE_NAME = settings.DB_NAME


def normalize_modality(modality: Optional[str]) -> Optional[str]:
    if not modality or not isinstance(modality, str):
        return None
    value = modality.strip().lower()
    return value or None


def to_numeric_skill(value) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


async def calculate_user_ratings(user_id: ObjectId, groups_collection) -> Dict[str, float]:
    groups = await groups_collection.find({"members.id": user_id}).to_list(length=None)

    sum_by_modality: Dict[str, float] = {}
    count_by_modality: Dict[str, int] = {}

    for group in groups:
        modality = normalize_modality(group.get("modality"))
        if not modality:
            continue

        member = next(
            (m for m in group.get("members", []) if str(m.get("id")) == str(user_id)),
            None,
        )
        if not member:
            continue

        skill_value = to_numeric_skill(member.get("skill_level"))
        if skill_value is None:
            continue

        sum_by_modality[modality] = sum_by_modality.get(modality, 0.0) + skill_value
        count_by_modality[modality] = count_by_modality.get(modality, 0) + 1

    return {
        modality: round(sum_by_modality[modality] / count_by_modality[modality], 2)
        for modality in sum_by_modality
        if count_by_modality.get(modality, 0) > 0
    }


async def migrate_user_sport_ratings():
    print("🚀 Iniciando recálculo de sport_ratings para todos os usuários...")
    print(f"📊 MongoDB: {MONGODB_URL} | DB: {DATABASE_NAME}")

    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    users_collection = db["users"]
    groups_collection = db["groups"]

    try:
        users = await users_collection.find({}, {"_id": 1, "name": 1}).to_list(length=None)
        total_users = len(users)
        print(f"📦 Usuários encontrados: {total_users}\n")

        updated = 0
        unchanged = 0
        failed = 0

        for index, user in enumerate(users, 1):
            user_id = user["_id"]
            user_name = user.get("name", "Sem nome")

            try:
                ratings = await calculate_user_ratings(user_id, groups_collection)

                result = await users_collection.update_one(
                    {"_id": user_id},
                    {"$set": {"sport_ratings": ratings}},
                )

                if result.modified_count > 0:
                    updated += 1
                    print(f"✅ {index}/{total_users} - {user_name}: atualizado -> {ratings}")
                else:
                    unchanged += 1
                    print(f"✓ {index}/{total_users} - {user_name}: sem mudança")
            except Exception as ex:
                failed += 1
                print(f"❌ {index}/{total_users} - {user_name}: erro -> {ex}")

        print("\n" + "=" * 60)
        print("📊 RESUMO")
        print("=" * 60)
        print(f"Total: {total_users}")
        print(f"✅ Atualizados: {updated}")
        print(f"⏭️ Sem mudança: {unchanged}")
        print(f"❌ Erros: {failed}")
        print("=" * 60)

    finally:
        client.close()
        print("\n🔌 Conexão encerrada.")


if __name__ == "__main__":
    asyncio.run(migrate_user_sport_ratings())
