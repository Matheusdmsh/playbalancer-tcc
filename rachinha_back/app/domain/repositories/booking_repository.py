from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import date, datetime, timezone
from bson import ObjectId

from app.domain.repositories.invite_repository import InviteRepository

class BookingRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db['bookings']
        self.invite_repo = InviteRepository(db)

    async def create(self, booking_data: dict) -> str:
        if 'court_id' in booking_data and isinstance(booking_data['court_id'], str):
            booking_data['court_id'] = ObjectId(booking_data['court_id'])
        if 'user_id' in booking_data and isinstance(booking_data['user_id'], str):
            booking_data['user_id'] = ObjectId(booking_data['user_id'])
        if 'owner_id' in booking_data and isinstance(booking_data['owner_id'], str):
            booking_data['owner_id'] = ObjectId(booking_data['owner_id'])
        if 'associated_group_id' in booking_data and isinstance(booking_data['associated_group_id'], str):
            booking_data['associated_group_id'] = ObjectId(booking_data['associated_group_id'])

        for field_name in ['players', 'reserve_players']:
            if field_name in booking_data and isinstance(booking_data[field_name], list):
                booking_data[field_name] = [ObjectId(item) if isinstance(item, str) else item for item in booking_data[field_name]]

        result = await self.collection.insert_one(booking_data)
        return str(result.inserted_id)
    
    async def list_my_bookings(self, user_id: str) -> List[dict]:
        user_obj_id = ObjectId(user_id)
        query = {'owner_id': user_obj_id}
        bookings = await self.collection.find(query).to_list(length=100)
        for booking in bookings:
            booking['_id'] = str(booking['_id'])
            if 'user_id' in booking and isinstance(booking['user_id'], ObjectId):
                booking['user_id'] = str(booking['user_id'])
            if 'court_id' in booking and isinstance(booking['court_id'], ObjectId):
                booking['court_id'] = str(booking['court_id'])
            if 'owner_id' in booking and isinstance(booking['owner_id'], ObjectId):
                booking['owner_id'] = str(booking['owner_id'])
            if 'associated_group_id' in booking and isinstance(booking['associated_group_id'], ObjectId):
                booking['associated_group_id'] = str(booking['associated_group_id'])
            for field_name in ['players', 'reserve_players']:
                field_data = booking.get(field_name)
                if field_data is None:
                    booking[field_name] = []
                elif isinstance(field_data, list):
                    booking[field_name] = [str(item) if isinstance(item, ObjectId) else item for item in field_data]
                else:
                    booking[field_name] = [str(field_data)]
        return bookings

    async def get_by_id(self, booking_id: str) -> Optional[dict]:
        try:
            booking_obj_id = ObjectId(booking_id)
        except Exception:
            return None

        booking = await self.collection.find_one({'_id': booking_obj_id})
        if booking:
            return BookingRepository._deep_serialize(booking)
        return None

    async def list_by_user(self, user_id: str) -> List[dict]:
        invites = await self.invite_repo.list_invites_by_user(user_id)
        booking_ids = [invite['booking_id'] for invite in invites]
        if not booking_ids:
            return []

        query = {
            '_id': {'$in': [ObjectId(booking_id) for booking_id in booking_ids]}
        }
        bookings = await self.collection.find(query).to_list(length=None)
        return bookings

    async def list_bookings_by_associated_group(self, group_id: str) -> List[dict]:
        try:
            group_obj_id = ObjectId(group_id)
        except Exception:
            return []
        
        bookings = await self.collection.find({'associated_group_id': group_obj_id}).to_list(length=None)
        return [BookingRepository._deep_serialize(b) for b in bookings]

    async def check_conflict(self, court_id: str, start: datetime, end: datetime, exclude_booking_id: Optional[str] = None) -> bool:
        query = {
            'court_id': ObjectId(court_id),
            '$or': [
                {'start_time': {'$lt': end}, 'end_time': {'$gt': start}}
            ]
        }
        if exclude_booking_id:
            query['_id'] = {'$ne': ObjectId(exclude_booking_id)}
        conflict = await self.collection.find_one(query)
        return conflict is not None
    
    async def list_bookings_by_court(self, court_id: str) -> List[dict]:
        bookings = await self.collection.find({'court_id': ObjectId(court_id)}).to_list(length=100)
        for booking in bookings:
            booking['_id'] = str(booking['_id'])
            if 'user_id' in booking and isinstance(booking['user_id'], ObjectId):
                booking['user_id'] = str(booking['user_id'])
            if 'court_id' in booking and isinstance(booking['court_id'], ObjectId):
                booking['court_id'] = str(booking['court_id'])
            if 'owner_id' in booking and isinstance(booking['owner_id'], ObjectId):
                booking['owner_id'] = str(booking['owner_id'])
            if 'associated_group_id' in booking and isinstance(booking['associated_group_id'], ObjectId):
                booking['associated_group_id'] = str(booking['associated_group_id'])
        return bookings

    async def list_user_bookings(self, user_id: str) -> List[dict]:
        bookings = await self.collection.find({'user_id': ObjectId(user_id)}).to_list(length=100)
        for booking in bookings:
            booking['_id'] = str(booking['_id'])
            if 'user_id' in booking and isinstance(booking['user_id'], ObjectId):
                booking['user_id'] = str(booking['user_id'])
            if 'court_id' in booking and isinstance(booking['court_id'], ObjectId):
                booking['court_id'] = str(booking['court_id'])
            if 'owner_id' in booking and isinstance(booking['owner_id'], ObjectId):
                booking['owner_id'] = str(booking['owner_id'])
            if 'associated_group_id' in booking and isinstance(booking['associated_group_id'], ObjectId):
                booking['associated_group_id'] = str(booking['associated_group_id'])
        return bookings
    
    async def update_partial(self, booking_id: str, update_data: dict) -> bool:
        def normalize_payload(data: dict) -> dict:
            if 'court_id' in data and isinstance(data['court_id'], str) and data['court_id'] != "offline":
                data['court_id'] = ObjectId(data['court_id'])
            if 'user_id' in data and isinstance(data['user_id'], str):
                data['user_id'] = ObjectId(data['user_id'])
            if 'owner_id' in data and isinstance(data['owner_id'], str):
                data['owner_id'] = ObjectId(data['owner_id'])
            if 'associated_group_id' in data and isinstance(data['associated_group_id'], str):
                data['associated_group_id'] = ObjectId(data['associated_group_id'])

            for field_name in ['players', 'reserve_players']:
                if field_name in data and isinstance(data[field_name], list):
                    data[field_name] = [ObjectId(item) if isinstance(item, str) else item for item in data[field_name]]

            return data

        # Suporta update com operadores MongoDB ($set/$push/...) e update simples.
        if any(key.startswith('$') for key in update_data.keys()):
            update_doc = update_data.copy()
            if '$set' in update_doc and isinstance(update_doc['$set'], dict):
                update_doc['$set'] = normalize_payload(update_doc['$set'])
        else:
            normalized = normalize_payload(update_data.copy())
            update_doc = {'$set': normalized}

        result = await self.collection.update_one(
            {'_id': ObjectId(booking_id)},
            update_doc
        )
        return result.modified_count > 0
    
    async def create_many(self, bookings: List[dict]) -> List[str]:
        processed_bookings = []
        for booking_data in bookings:
            if 'court_id' in booking_data and isinstance(booking_data['court_id'], str) and booking_data['court_id'] != "offline":
                booking_data['court_id'] = ObjectId(booking_data['court_id'])
            if 'user_id' in booking_data and isinstance(booking_data['user_id'], str):
                booking_data['user_id'] = ObjectId(booking_data['user_id'])
            if 'owner_id' in booking_data and isinstance(booking_data['owner_id'], str):
                booking_data['owner_id'] = ObjectId(booking_data['owner_id'])
            if 'associated_group_id' in booking_data and isinstance(booking_data['associated_group_id'], str):
                booking_data['associated_group_id'] = ObjectId(booking_data['associated_group_id'])

            for field_name in ['players', 'reserve_players']:
                if field_name in booking_data and isinstance(booking_data[field_name], list):
                    booking_data[field_name] = [ObjectId(item) if isinstance(item, str) else item for item in booking_data[field_name]]
            processed_bookings.append(booking_data)

        result = await self.collection.insert_many(processed_bookings)
        return [str(inserted_id) for inserted_id in result.inserted_ids]

    async def add_player_to_booking(self, booking_id: str, player_id: str, skill_level: float) -> bool:
        player_entry = {"id": ObjectId(player_id), "skill_level": skill_level}
        result = await self.collection.update_one(
            {'_id': ObjectId(booking_id)},
            {'$addToSet': {'players': player_entry}}
        )
        return result.modified_count > 0
    
    async def get_bookings_by_ids(self, booking_ids: List[str]) -> List[dict]:
        object_ids = []
        for booking_id in booking_ids:
            try:
                object_ids.append(ObjectId(booking_id))
            except Exception:
                continue
        
        if not object_ids:
            return []

        bookings = await self.collection.find({'_id': {'$in': object_ids}}).to_list(length=None)
        for booking in bookings:
            booking['_id'] = str(booking['_id'])
            if 'user_id' in booking and isinstance(booking['user_id'], ObjectId):
                booking['user_id'] = str(booking['user_id'])
            if 'court_id' in booking and isinstance(booking['court_id'], ObjectId):
                booking['court_id'] = str(booking['court_id'])
            if 'owner_id' in booking and isinstance(booking['owner_id'], ObjectId):
                booking['owner_id'] = str(booking['owner_id'])
            if 'associated_group_id' in booking and isinstance(booking['associated_group_id'], ObjectId):
                booking['associated_group_id'] = str(booking['associated_group_id'])
            for field_name in ['players', 'reserve_players']:
                field_data = booking.get(field_name)
                if field_data is None:
                    booking[field_name] = []
                elif isinstance(field_data, list):
                    booking[field_name] = [str(item) if isinstance(item, ObjectId) else item for item in field_data]
                else:
                    booking[field_name] = [str(field_data)]
        return bookings

    async def add_reserve_player_to_booking(self, booking_id: str, player_id: str, skill_level: float) -> bool:
        player_entry = {"id": ObjectId(player_id), "skill_level": skill_level}
        result = await self.collection.update_one(
            {'_id': ObjectId(booking_id)},
            {'$addToSet': {'reserve_players': player_entry}}
        )
        return result.modified_count > 0

    async def remove_player_from_booking(self, booking_id: str, player_id: str) -> bool:
        result = await self.collection.update_one(
            {'_id': ObjectId(booking_id)},
            {'$pull': {'players': {'id': ObjectId(player_id)}}}
        )
        return result.modified_count > 0

    async def remove_reserve_player_from_booking(self, booking_id: str, player_id: str) -> bool:
        result = await self.collection.update_one(
            {'_id': ObjectId(booking_id)},
            {'$pull': {'reserve_players': {'id': ObjectId(player_id)}}}
        )
        return result.modified_count > 0
    
    async def get_bookings_by_court_and_date(self, court_id: str, search_date: date) -> List[dict]:
        start_of_day = datetime.combine(search_date, datetime.min.time(), tzinfo=timezone.utc)
        end_of_day = datetime.combine(search_date, datetime.max.time(), tzinfo=timezone.utc)

        query = {
            'court_id': ObjectId(court_id),
            'start_time': {'$gte': start_of_day, '$lt': end_of_day}
        }
        bookings = await self.collection.find(query).to_list(length=None)
        return bookings
    

    async def get_bookings_by_associated_group(self, group_id: str) -> List[dict]:
        """Returns bookings associated with a specific group ID."""
        try:
            group_obj_id = ObjectId(group_id)
        except Exception:
            return []
        
        bookings = await self.collection.find({'associated_group_id': group_obj_id}).to_list(length=None)
        serialized_bookings = []
        for booking in bookings:
            if booking:
                booking['_id'] = str(booking['_id'])
                if 'user_id' in booking and isinstance(booking['user_id'], ObjectId):
                    booking['user_id'] = str(booking['user_id'])
                if 'court_id' in booking and isinstance(booking['court_id'], ObjectId):
                    booking['court_id'] = str(booking['court_id'])
                if 'owner_id' in booking and isinstance(booking['owner_id'], ObjectId):
                    booking['owner_id'] = str(booking['owner_id'])
                if 'associated_group_id' in booking and isinstance(booking['associated_group_id'], ObjectId):
                    booking['associated_group_id'] = str(booking['associated_group_id'])
                for field_name in ['players', 'reserve_players']:
                    field_data = booking.get(field_name)
                    if field_data is None:
                        booking[field_name] = []
                    elif isinstance(field_data, list):
                        booking[field_name] = [str(item) if isinstance(item, ObjectId) else item for item in field_data]
                    else:
                        booking[field_name] = [str(field_data)]
                serialized_bookings.append(booking)
        return serialized_bookings
    
    async def update_player_skill_level(self, booking_id: str, player_id: str, skill_level: float) -> bool:
        result = await self.collection.update_one(
            {'_id': ObjectId(booking_id), 'players.id': ObjectId(player_id)},
            {'$set': {'players.$.skill_level': skill_level}}
        )
        return result.modified_count > 0

    async def update_reserve_player_skill_level(self, booking_id: str, player_id: str, skill_level: float) -> bool:
        result = await self.collection.update_one(
            {'_id': ObjectId(booking_id), 'reserve_players.id': ObjectId(player_id)},
            {'$set': {'reserve_players.$.skill_level': skill_level}}
        )
        return result.modified_count > 0

    async def upsert_player_vote(self, booking_id: str, player_id: str, rater_id: str, vote: int) -> list:
        """Upserts {rater_id, vote} in players[].votes[]. Returns updated votes list."""
        booking_obj = ObjectId(booking_id)
        player_obj  = ObjectId(player_id)
        rater_obj   = ObjectId(rater_id)
        # Remove previous vote from this rater
        await self.collection.update_one(
            {'_id': booking_obj},
            {'$pull': {'players.$[p].votes': {'rater_id': rater_obj}}},
            array_filters=[{'p.id': player_obj}]
        )
        # Push new vote
        await self.collection.update_one(
            {'_id': booking_obj},
            {'$push': {'players.$[p].votes': {'rater_id': rater_obj, 'vote': vote}}},
            array_filters=[{'p.id': player_obj}]
        )
        # Fetch and return updated votes list
        doc = await self.collection.find_one(
            {'_id': booking_obj, 'players.id': player_obj},
            {'players.$': 1}
        )
        if not doc:
            return []
        return doc.get('players', [{}])[0].get('votes', [])

    async def upsert_player_rating(self, booking_id: str, player_id: str, rater_id: str, rating: int) -> list:
        """Adds or replaces a rater's individual rating inside players[].ratings[].
        Returns the updated ratings list for that player."""
        booking_obj = ObjectId(booking_id)
        player_obj = ObjectId(player_id)
        rater_obj = ObjectId(rater_id)
        # Remove previous rating from this rater (if any)
        await self.collection.update_one(
            {'_id': booking_obj},
            {'$pull': {'players.$[p].ratings': {'rater_id': rater_obj}}},
            array_filters=[{'p.id': player_obj}]
        )
        # Push new rating
        await self.collection.update_one(
            {'_id': booking_obj},
            {'$push': {'players.$[p].ratings': {'rater_id': rater_obj, 'value': rating}}},
            array_filters=[{'p.id': player_obj}]
        )
        # Fetch updated ratings list
        doc = await self.collection.find_one(
            {'_id': booking_obj, 'players.id': player_obj},
            {'players.$': 1}
        )
        if not doc:
            return []
        return doc.get('players', [{}])[0].get('ratings', [])
    
    @staticmethod
    def _deep_serialize(data):
        """Recursively converts ObjectId → str in any dict/list structure."""
        if isinstance(data, list):
            return [BookingRepository._deep_serialize(item) for item in data]
        elif isinstance(data, dict):
            return {k: BookingRepository._deep_serialize(v) for k, v in data.items()}
        elif isinstance(data, ObjectId):
            return str(data)
        return data

    def _serialize_booking(self, booking: dict) -> dict:
        """Converts all ObjectId fields recursively (including players[].ratings[].rater_id)."""
        if not booking:
            return None
        return BookingRepository._deep_serialize(booking)

    # --- NOVOS MÉTODOS ADICIONADOS ---
    async def count_all_bookings(self) -> int:
        """Conta o número total de reservas."""
        return await self.collection.count_documents({})

    async def get_all_bookings(self) -> list:
        """Busca todas as reservas e as serializa."""
        bookings = await self.collection.find({}).to_list(length=None)
        return [self._serialize_booking(b) for b in bookings]