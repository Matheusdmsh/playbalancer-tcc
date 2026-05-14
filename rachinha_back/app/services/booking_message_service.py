from datetime import datetime
from app.domain.repositories.booking_message_repository import MessageRepository
from app.domain.repositories.booking_repository import BookingRepository
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.court_repository import CourtRepository
from app.interfaces.schemas.booking_message import BookingMessageCreate
from typing import List, Optional
from bson import ObjectId
from app.services.notification_service import NotificationService 
from app.interfaces.schemas.notification import NotificationCreate

class MessageService:
    def __init__(self, message_repo: MessageRepository, booking_repo: BookingRepository, user_repo: UserRepository, court_repo: CourtRepository, notification_service: Optional[NotificationService] = None):
        self.message_repo = message_repo
        self.booking_repo = booking_repo
        self.user_repo = user_repo
        self.court_repo = court_repo
        self.notification_service = notification_service

    async def _check_chat_permission(self, user_id: str, booking_id: str) -> bool:
        """Verifica se o usuário tem permissão para acessar ou enviar mensagens no chat."""
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise ValueError("Agendamento não encontrado.")

        # Verificar se o usuário é o criador do booking
        is_booking_owner = str(user_id) == str(booking.get("owner_id"))

        # Verificar se o usuário é um jogador confirmado
        players_list = booking.get("players", [])
        players_in_booking_str = [str(p) for p in players_list] if isinstance(players_list, list) else []
        is_player = str(user_id) in players_in_booking_str

        # Verificar se o usuário é um jogador na lista de reserva
        reserve_players_list = booking.get("reserve_players", [])
        reserve_players_in_booking_str = [str(p) for p in reserve_players_list] if isinstance(reserve_players_list, list) else []
        is_reserve_player = str(user_id) in reserve_players_in_booking_str

        # Verificar se o usuário é o dono da quadra (arena)
        court_id = booking.get("court_id")
        is_court_owner = False
        if court_id:
            court = await self.court_repo.get_by_id(court_id)
            if court and court.get("owner_id"):
                is_court_owner = str(user_id) == str(court["owner_id"])

        can_access_chat = is_booking_owner or is_player or is_reserve_player or is_court_owner

        if not can_access_chat:
            raise ValueError("Você não tem permissão para acessar este chat.")
        return True

    async def get_chat_booking_messages(self, user_id: str, booking_id: str) -> List[dict]:
        await self._check_chat_permission(user_id, booking_id)
        messages = await self.message_repo.get_messages_by_booking_id(booking_id)
        return messages

    async def save_booking_message(self, user_id: str, message_create_data: BookingMessageCreate) -> dict:
        if str(user_id) != str(message_create_data.sender_id):
             raise ValueError("O sender_id enviado na mensagem não corresponde ao usuário autenticado.")

        booking_id = message_create_data.booking_id

        await self._check_chat_permission(user_id, booking_id)

        message_data_to_save = {
            "booking_id": booking_id,
            "sender_id": user_id,
            "content": message_create_data.content
        }
        
        message_id = await self.message_repo.create_booking_message(message_data_to_save)
        if message_id and self.notification_service:
            booking = await self.booking_repo.get_by_id(booking_id)
            sender_user = await self.user_repo.get_user_by_id(user_id)

            all_participants = set(booking.get('players', [])) | set(booking.get('reserve_players', [])) | {booking.get('owner_id')}
            print(f"All participants in booking {booking_id}: {all_participants}")
            for participant_id in all_participants:
                if str(participant_id) != str(user_id):
                    notification = NotificationCreate(
                        user_id=str(participant_id),
                        notification_type="new_booking_message",
                        message=f"Nova mensagem de {sender_user['name']} no jogo '{booking.get('modality', '')}'.",
                        related_id=booking_id,
                        link=f"/bookings/chat/{booking_id}"
                    )
                    await self.notification_service.create_and_send_notification(notification)

        message_from_db = await self.message_repo.collection.find_one({"_id": ObjectId(message_id)}) 
        
        if message_from_db:
            serialized_message = {}
            for k, v in message_from_db.items():
                if isinstance(v, ObjectId):
                    serialized_message[k] = str(v)
                elif isinstance(v, datetime):
                    serialized_message[k] = v.isoformat()
                elif isinstance(v, list):
                    serialized_message[k] = [
                        str(item) if isinstance(item, ObjectId) 
                        else (item.isoformat() if isinstance(item, datetime) else item) 
                        for item in v
                    ]
                else:
                    serialized_message[k] = v

            return serialized_message
        return {} 