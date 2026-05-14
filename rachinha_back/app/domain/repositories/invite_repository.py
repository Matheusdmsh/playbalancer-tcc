from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone

class InviteRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db['invites']

    async def create_invite(self, invite_data: dict) -> str:
        invite_data['booking_id'] = ObjectId(invite_data['booking_id'])
        invite_data['user_id'] = ObjectId(invite_data['user_id'])
        invite_data['sent_at'] = datetime.now(timezone.utc)
        result = await self.collection.insert_one(invite_data)
        return str(result.inserted_id)

    async def get_invite_by_id(self, invite_id: str) -> Optional[dict]:
        try:
            invite_obj_id = ObjectId(invite_id)
        except Exception:
            return None
        invite = await self.collection.find_one({'_id': invite_obj_id})
        if invite:
            invite['_id'] = str(invite['_id'])
            invite['booking_id'] = str(invite['booking_id'])
            invite['user_id'] = str(invite['user_id'])
        return invite

    async def update_invite_status(self, invite_id: str, status: str) -> bool:
        try:
            invite_obj_id = ObjectId(invite_id)
        except Exception:
            return False
        result = await self.collection.update_one(
            {'_id': invite_obj_id},
            {'$set': {'status': status, 'updated_at': datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0

    async def get_invites_for_booking(self, booking_id: str) -> List[dict]:
        try:
            booking_obj_id = ObjectId(booking_id)
        except Exception:
            return []
        invites = await self.collection.find({'booking_id': booking_obj_id}).to_list(length=None)
        for invite in invites:
            invite['_id'] = str(invite['_id'])
            invite['booking_id'] = str(invite['booking_id'])
            invite['user_id'] = str(invite['user_id'])
        return invites

    async def list_invites_by_user(self, user_id: str) -> List[dict]:
        """
        Lista todos os convites pendentes, aceitos ou recusados para um usuário específico.
        """
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            return []
        
        invites = await self.collection.find({'user_id': user_obj_id}).to_list(length=None)
        serialized_invites = []
        for invite in invites:
            if invite:
                invite['_id'] = str(invite['_id'])
                invite['booking_id'] = str(invite['booking_id'])
                invite['user_id'] = str(invite['user_id'])
                serialized_invites.append(invite)
        return serialized_invites
    
    async def get_invite_by_booking_and_user(self, booking_id: str, user_id: str) -> Optional[dict]:
        """
        Obtém um convite específico para um usuário em uma reserva.
        """
        try:
            booking_obj_id = ObjectId(booking_id)
            user_obj_id = ObjectId(user_id)
        except Exception:
            return None
        
        invite = await self.collection.find_one({
            'booking_id': booking_obj_id,
            'user_id': user_obj_id
        })
        
        if invite:
            invite['_id'] = str(invite['_id'])
            invite['booking_id'] = str(invite['booking_id'])
            invite['user_id'] = str(invite['user_id'])
        
        return invite