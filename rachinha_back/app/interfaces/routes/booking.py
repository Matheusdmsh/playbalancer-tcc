from bson import ObjectId
from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel
from app.domain.repositories.notification_repository import NotificationRepository
from app.interfaces.schemas.booking import BookingUpdate, RecurringBookingCreate
from app.core.security import get_current_user
from app.domain.repositories.booking_repository import BookingRepository
from app.services.booking_service import BookingService
from app.core.config import get_db
from app.core.permissions import user_roles
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.group_repository import GroupRepository
from app.domain.repositories.invite_repository import InviteRepository
from app.services.notification_service import NotificationConnectionManager, NotificationService
from app.utils.email_sender import EmailSender
from typing import List, Optional, Annotated
from bson.errors import InvalidId


router = APIRouter(prefix='/bookings', tags=['Bookings'])

async def get_invite_repository(db=Depends(get_db)) -> InviteRepository:
    return InviteRepository(db)

async def get_email_sender() -> EmailSender:
    return EmailSender()

async def get_booking_service(
    db = Depends(get_db),
    invite_repo: InviteRepository = Depends(get_invite_repository),
    email_sender: EmailSender = Depends(get_email_sender),
) -> BookingService:
    booking_repo = BookingRepository(db)
    user_repo = UserRepository(db)
    group_repo = GroupRepository(db)
    notification_service = NotificationService(NotificationRepository(db), NotificationConnectionManager(), user_repo)
    return BookingService(booking_repo, user_repo, group_repo, invite_repo, email_sender, notification_service)

@router.get('/my')
async def list_my_bookings(service: BookingService = Depends(get_booking_service), user=Depends(get_current_user)):
    return await service.list_my_bookings(user['_id'])

@router.get('/byuser/{user_id}')
async def list_bookings_by_user(user_id: str, service: BookingService = Depends(get_booking_service), user=Depends(get_current_user)):
    is_self = str(user_id) == str(user['_id'])
    if not is_self and "rachinha" not in user_roles(user):
        raise HTTPException(status_code=403, detail="Sem permissão para consultar as reservas deste usuário")
    return await service.list_by_user(user_id)

@router.get('/bygroup/{group_id}')
async def list_bookings_by_group(
    group_id: str,
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user)
):
    try:
        return await service.list_bookings_by_group(group_id, user['_id'])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put('/edit/{booking_id}')
async def edit_booking(
    booking_id: str,
    booking: BookingUpdate,
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user)
):
    try:
        await service.edit_booking(user['_id'], booking_id, booking.dict(exclude_unset=True))
        return {'detail': 'Agendamento atualizado com sucesso.'}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
@router.post('', include_in_schema=False)
@router.post('/')
async def create_booking(booking: RecurringBookingCreate, service: BookingService = Depends(get_booking_service), user=Depends(get_current_user)):
    try:
        booking_ids = await service.create_recurring_booking(user['_id'], booking.dict())
        return {'ids': booking_ids}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/{booking_id}/invite/add')
async def add_player_to_booking(
    booking_id: str,
    player_id: str,
    skill_level: float = 0,
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user)
):
    try:
        result = await service.add_player_to_booking(user['_id'], booking_id, player_id, skill_level)
        return {'detail': f'Jogador {result["status"]}.'}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/{booking_id}/invite/remove')
async def remove_player_from_booking(
    booking_id: str,
    player_id: str,
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user)
):
    try:
        result = await service.remove_player_from_booking(user['_id'], booking_id, player_id)
        return {'detail': f'Jogador {result["status"]}.'}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
@router.post('/{booking_id}/invite/join')
async def join_booking_by_link(
    booking_id: str,
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user)
):
    try:
        result = await service.join_booking_by_link(booking_id, user['_id'])
        return {'detail': f'Você foi {result["status"]} na reserva.', 'booking_id': result['booking_id']}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class OrganizeTeamsBody(BaseModel):
    selected_player_ids: Optional[List[str]] = None

@router.post('/{booking_id}/organize-teams')
async def organize_teams(
    booking_id: str,
    players_per_team: int,
    body: OrganizeTeamsBody = Body(default=None),
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user),
):
    try:
        selected_ids = body.selected_player_ids if body else None
        teams_info = await service.organize_teams(
            user['_id'],
            booking_id,
            players_per_team,
            selected_player_ids=selected_ids,
        )
        return teams_info
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get('/{booking_id}/organize-teams/history')
async def get_organized_teams_history(
    booking_id: str,
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user),
):
    try:
        history = await service.get_organized_teams_history(user['_id'], booking_id)
        return {"history": history}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete('/{booking_id}/organize-teams')
async def clear_organized_teams(
    booking_id: str,
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user),
):
    try:
        result = await service.clear_organized_teams(user['_id'], booking_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post('/by_ids')
async def list_bookings_by_ids(
    booking_ids: List[str],
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user)
):
    try:
        bookings = await service.list_bookings_by_ids(booking_ids)
        return bookings
    except (ValueError, InvalidId) as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/{booking_id}/player/{player_id}/vote')
async def submit_player_vote(
    booking_id: str,
    player_id: str,
    vote: int,
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user)
):
    try:
        result = await service.submit_player_vote(user['_id'], booking_id, player_id, vote)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put('/{booking_id}/player/{player_id}/skill_level')
async def update_player_skill_level(
    booking_id: str,
    player_id: str,
    skill_level: float,
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user)
):
    try:
        result = await service.update_player_skill_level(user['_id'], booking_id, player_id, skill_level)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


