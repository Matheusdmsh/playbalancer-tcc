from typing import Union
from bson import ObjectId
from datetime import datetime, timezone
from pydantic import BaseModel

from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.group_repository import GroupRepository
from app.domain.repositories.booking_repository import BookingRepository
from app.services.auth_service import verify_password, hash_password


class UserService:
    def __init__(
        self,
        user_repo: UserRepository,
        group_repo: GroupRepository = None,
        booking_repo: BookingRepository = None
    ):
        self.user_repo = user_repo
        self.group_repo = group_repo
        self.booking_repo = booking_repo

    async def update_user_profile(self, user_id: Union[str, ObjectId], update_data: Union[dict, BaseModel]) -> bool:
        return await self.user_repo.update_user(user_id, update_data)

    async def delete_user_account(self, user_id: Union[str, ObjectId]) -> bool:
        return await self.user_repo.delete_user(user_id)

    async def get_users_by_ids(self, user_ids: list[Union[str, ObjectId]]) -> list[dict]:
        users = []
        for user_id in user_ids:
            user = await self.user_repo.find_by_id(user_id)
            if user:
                user["_id"] = str(user["_id"])
                user.pop("password", None)
                users.append(user)
        return users

    async def search_for_users(
        self,
        query: str,
        group_id: str | None = None,
        booking_id: str | None = None,
        include_ghosts: bool = True
    ) -> list[dict]:
        """
        Serviço para buscar usuários com base em uma query de texto.
        """
        user_ids_filter: list[str] | None = None

        if group_id and self.group_repo:
            group = await self.group_repo.get_by_id(group_id)
            if not group:
                return []
            group_member_ids = [member.get("id") for member in group.get("members", []) if member.get("id")]
            user_ids_filter = group_member_ids

        if booking_id and self.booking_repo:
            booking = await self.booking_repo.get_by_id(booking_id)
            if not booking:
                return []
            booking_ids = set()
            if booking.get("owner_id"):
                booking_ids.add(booking["owner_id"])
            if booking.get("user_id"):
                booking_ids.add(booking["user_id"])
            booking_ids.update(booking.get("players", []) or [])
            booking_ids.update(booking.get("reserve_players", []) or [])

            if user_ids_filter is None:
                user_ids_filter = list(booking_ids)
            else:
                user_ids_filter = [user_id for user_id in user_ids_filter if user_id in booking_ids]

        return await self.user_repo.search_users(
            query_text=query,
            limit=5,
            user_ids=user_ids_filter,
            include_ghosts=include_ghosts
        )
    
    async def update_fcm_token(self, user_id: Union[str, ObjectId], fcm_token: str) -> bool:
        return await self.user_repo.update_fcm_token(user_id, fcm_token)
    
    async def update_user_role(self, user_id: str, role: str):
        # Lógica para adicionar a nova role ao array de roles do usuário
        return await self.user_repo.update_user(user_id, {"$addToSet": {"role": role}})