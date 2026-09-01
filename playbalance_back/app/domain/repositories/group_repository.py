from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone

class GroupRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["groups"] # Nome da coleção no MongoDB

    @staticmethod
    def _to_float_or_none(value) -> Optional[float]:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _serialize_member(self, member: dict) -> dict:
        serialized = {
            "id": str(member["id"]) if isinstance(member.get("id"), ObjectId) else member.get("id"),
            "skill_level": self._to_float_or_none(member.get("skill_level"))
        }

        history = member.get("skill_history", [])
        if isinstance(history, list):
            serialized["skill_history"] = []
            for item in history:
                if not isinstance(item, dict):
                    continue
                entry = {
                    "booking_id": str(item.get("booking_id")) if isinstance(item.get("booking_id"), ObjectId) else item.get("booking_id"),
                    "previous_skill_level": self._to_float_or_none(item.get("previous_skill_level")),
                    "new_skill_level": self._to_float_or_none(item.get("new_skill_level")),
                    "source": item.get("source"),
                    "changed_at": item.get("changed_at")
                }
                if entry["booking_id"] is None or entry["new_skill_level"] is None or entry["changed_at"] is None:
                    continue
                if item.get("sample_size") is not None:
                    entry["sample_size"] = item.get("sample_size")
                serialized["skill_history"].append(entry)
        else:
            serialized["skill_history"] = []

        return serialized

    def _normalize_member_for_write(self, member: dict) -> dict:
        normalized = {
            "id": ObjectId(member["id"]) if isinstance(member.get("id"), str) else member.get("id"),
            "skill_level": self._to_float_or_none(member.get("skill_level"))
        }
        history = member.get("skill_history", [])
        if isinstance(history, list):
            normalized["skill_history"] = [item for item in history if isinstance(item, dict)]
        else:
            normalized["skill_history"] = []
        return normalized

    def serialize_group(self, group: dict) -> dict:
        """Converte campos ObjectId para string e garante campos padrão."""
        if not group:
            return None
        group["_id"] = str(group["_id"])
        group["owner_id"] = str(group["owner_id"])
        if "members" in group and isinstance(group["members"], list):
            group["members"] = [self._serialize_member(member) for member in group["members"]]
        else:
            group["members"] = []
        
        # Serializar lista de admins
        if "admins" in group and isinstance(group["admins"], list):
            group["admins"] = [str(admin_id) if isinstance(admin_id, ObjectId) else admin_id for admin_id in group["admins"]]
        else:
            group["admins"] = []

        # Normalizar start_time para string (compatibilidade com GroupInDB)
        if "start_time" in group and group["start_time"] is not None:
            try:
                group["start_time"] = str(group["start_time"])
            except Exception:
                pass
        
        return group
    
    async def find_by_invite_token(self, token: str) -> Optional[dict]:
        """Encontra um grupo pelo seu token de convite."""
        group = await self.collection.find_one({"invite_token": token})
        return self.serialize_group(group) if group else None

    async def list_groups_for_user(self, user_id: str) -> List[dict]:
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            return []
        groups = await self.collection.find({"members.id": user_obj_id}).to_list(length=100)
        return [self.serialize_group(group) for group in groups]

    async def create(self, group_data: dict) -> str:
        group_data["owner_id"] = ObjectId(group_data["owner_id"])
        if "members" in group_data and isinstance(group_data["members"], list):
            group_data["members"] = [self._normalize_member_for_write(member) for member in group_data["members"]]
        else:
            group_data["members"] = []

        result = await self.collection.insert_one(group_data)
        return str(result.inserted_id)

    async def get_by_id(self, group_id: str) -> Optional[dict]:
        try:
            group_obj_id = ObjectId(group_id)
        except Exception:
            return None
        group = await self.collection.find_one({"_id": group_obj_id})
        return self.serialize_group(group) if group else None

    async def update_partial(self, group_id: str, data: dict) -> bool:
        try:
            group_obj_id = ObjectId(group_id)
        except Exception:
            return False
        data.pop("owner_id", None)
        # Permitir atualização do invite_token aqui, mas não de members
        data.pop("members", None)

        result = await self.collection.update_one(
            {"_id": group_obj_id},
            {"$set": data}
        )
        return result.modified_count > 0

    async def update_owner(self, group_id: str, new_owner_id: str) -> bool:
        try:
            group_obj_id = ObjectId(group_id)
            new_owner_obj_id = ObjectId(new_owner_id)
        except Exception:
            return False
        result = await self.collection.update_one(
            {"_id": group_obj_id},
            {"$set": {"owner_id": new_owner_obj_id}}
        )
        return result.modified_count > 0

    async def delete(self, group_id: str) -> bool:
        try:
            group_obj_id = ObjectId(group_id)
        except Exception:
            return False
        result = await self.collection.delete_one({"_id": group_obj_id})
        return result.deleted_count > 0

    async def list_by_owner(self, owner_id: str) -> List[dict]:
        try:
            owner_obj_id = ObjectId(owner_id)
        except Exception:
            return []
        groups = await self.collection.find({"owner_id": owner_obj_id}).to_list(length=100)
        return [self.serialize_group(group) for group in groups]

    async def add_member(self, group_id: str, member_id: str, skill_level: Optional[float] = None) -> bool:
        try:
            group_obj_id = ObjectId(group_id)
            member_obj_id = ObjectId(member_id)
        except Exception:
            return False
        member_doc = {"id": member_obj_id, "skill_level": self._to_float_or_none(skill_level), "skill_history": []}
        result = await self.collection.update_one(
            {"_id": group_obj_id, "members.id": {"$ne": member_obj_id}},
            {"$push": {"members": member_doc}}
        )
        return result.modified_count > 0

    async def remove_member(self, group_id: str, member_id: str) -> bool:
        try:
            group_obj_id = ObjectId(group_id)
            member_obj_id = ObjectId(member_id)
        except Exception:
            return False
        result = await self.collection.update_one(
            {"_id": group_obj_id},
            {"$pull": {"members": {"id": member_obj_id}}}
        )
        return result.modified_count > 0
    
    async def update_skill_level(self, group_id: str, member_id: str, skill_level: Optional[float]) -> bool:
        try:
            group_obj_id = ObjectId(group_id)
            member_obj_id = ObjectId(member_id)
        except Exception:
            return False
        result = await self.collection.update_one(
            {"_id": group_obj_id, "members.id": member_obj_id},
            {"$set": {"members.$.skill_level": self._to_float_or_none(skill_level)}}
        )
        return result.modified_count > 0

    async def update_skill_level_with_history(
        self,
        group_id: str,
        member_id: str,
        skill_level: Optional[float],
        booking_id: str,
        source: str,
        sample_size: Optional[int] = None,
    ) -> bool:
        try:
            group_obj_id = ObjectId(group_id)
            member_obj_id = ObjectId(member_id)
        except Exception:
            return False

        doc = await self.collection.find_one(
            {"_id": group_obj_id, "members.id": member_obj_id},
            {"members.$": 1}
        )
        if not doc or not doc.get("members"):
            return False

        member = doc["members"][0]
        current_skill = self._to_float_or_none(member.get("skill_level"))
        new_skill = self._to_float_or_none(skill_level)
        history = member.get("skill_history", [])
        if not isinstance(history, list):
            history = []

        existing_index = -1
        for index, entry in enumerate(history):
            if isinstance(entry, dict) and str(entry.get("booking_id")) == str(booking_id):
                existing_index = index
                break

        changed = current_skill != new_skill
        if not changed and existing_index == -1:
            result = await self.collection.update_one(
                {"_id": group_obj_id, "members.id": member_obj_id},
                {"$set": {"members.$.skill_level": new_skill}}
            )
            return result.matched_count > 0

        now = datetime.now(timezone.utc)
        if existing_index >= 0:
            existing = history[existing_index]
            previous_value = self._to_float_or_none(existing.get("previous_skill_level"))
            entry = {
                "booking_id": str(booking_id),
                "previous_skill_level": previous_value if previous_value is not None else current_skill,
                "new_skill_level": new_skill,
                "source": source,
                "changed_at": now,
            }
            if sample_size is not None:
                entry["sample_size"] = sample_size
            history[existing_index] = entry
        else:
            entry = {
                "booking_id": str(booking_id),
                "previous_skill_level": current_skill,
                "new_skill_level": new_skill,
                "source": source,
                "changed_at": now,
            }
            if sample_size is not None:
                entry["sample_size"] = sample_size
            history.append(entry)

        result = await self.collection.update_one(
            {"_id": group_obj_id, "members.id": member_obj_id},
            {"$set": {"members.$.skill_level": new_skill, "members.$.skill_history": history}}
        )
        return result.matched_count > 0
    
    async def get_all_groups(self) -> List[dict]:
        """Busca todos os grupos."""
        groups = await self.collection.find({}).to_list(length=None)
        return [self.serialize_group(group) for group in groups]

    async def count_all_groups(self) -> int:
        """Conta o número total de grupos."""
        return await self.collection.count_documents({})
    
    async def add_admin(self, group_id: str, user_id: str) -> bool:
        """Adiciona um usuário como admin do grupo."""
        try:
            group_obj_id = ObjectId(group_id)
            user_obj_id = ObjectId(user_id)
        except Exception:
            return False
        result = await self.collection.update_one(
            {"_id": group_obj_id, "admins": {"$ne": user_obj_id}},
            {"$push": {"admins": user_obj_id}}
        )
        return result.modified_count > 0
    
    async def remove_admin(self, group_id: str, user_id: str) -> bool:
        """Remove um usuário como admin do grupo."""
        try:
            group_obj_id = ObjectId(group_id)
            user_obj_id = ObjectId(user_id)
        except Exception:
            return False
        result = await self.collection.update_one(
            {"_id": group_obj_id},
            {"$pull": {"admins": user_obj_id}}
        )
        return result.modified_count > 0