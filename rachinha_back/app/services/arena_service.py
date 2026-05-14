from app.domain.repositories.arena_repository import ArenaRepository
from datetime import datetime, timezone

class ArenaService:
    def __init__(self, arena_repo: ArenaRepository):
        self.arena_repo = arena_repo

    async def create_arena(self, owner_id: str, data: dict):
        data["owner_id"] = owner_id
        data["created_at"] = data.get("created_at", datetime.now(timezone.utc))
        data["updated_at"] = data.get("updated_at", datetime.now(timezone.utc))
        return await self.arena_repo.create(data)
    
    async def edit_arena(self, arena_id: str, data: dict):
        data["updated_at"] = datetime.now(timezone.utc)
        return await self.arena_repo.update_partial(arena_id, data)

    async def list_owner_arenas(self, owner_id: str):
        return await self.arena_repo.list_by_owner(owner_id)

    async def get_arena_by_id(self, arena_id: str):
        return await self.arena_repo.get_by_id(arena_id)
    
    async def delete_arena(self, arena_id: str):
        return await self.arena_repo.delete(arena_id)