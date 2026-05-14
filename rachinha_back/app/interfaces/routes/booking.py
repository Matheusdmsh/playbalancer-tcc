from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.domain.repositories.notification_repository import NotificationRepository
from app.interfaces.schemas.booking import BookingUpdate, RecurringBookingCreate
from app.core.security import get_current_user
from app.domain.repositories.booking_repository import BookingRepository
from app.services.booking_service import BookingService
from app.core.config import get_db
from app.domain.repositories.court_repository import CourtRepository
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.group_repository import GroupRepository
from app.domain.repositories.invite_repository import InviteRepository
from app.domain.repositories.arena_repository import ArenaRepository
from app.services.notification_service import NotificationConnectionManager, NotificationService
from app.utils.email_sender import EmailSender
from typing import List, Annotated, Optional
from bson.errors import InvalidId
from fastapi import Body
from pydantic import BaseModel
from datetime import datetime, timezone


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
    court_repo = CourtRepository(db)
    user_repo = UserRepository(db)
    group_repo = GroupRepository(db)
    notification_service = NotificationService(NotificationRepository(db), NotificationConnectionManager(), user_repo)
    return BookingService(booking_repo, court_repo, user_repo, group_repo, invite_repo, email_sender, notification_service)

@router.get('/my')
async def list_my_bookings(service: BookingService = Depends(get_booking_service), user=Depends(get_current_user)):
    return await service.list_my_bookings(user['_id'])

@router.get('/byuser/{user_id}')
async def list_bookings_by_user(user_id: str, service: BookingService = Depends(get_booking_service), user=Depends(get_current_user)):
    return await service.list_by_user(user_id)

@router.get('/bycourt/{court_id}')
async def list_bookings_by_court(court_id: str, service: BookingService = Depends(get_booking_service), user=Depends(get_current_user)):
    return await service.list_bookings_by_court(court_id)

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


# ==================== COURT BOOKING REQUEST (USER FLOW) ====================

class CourtBookingRequest(BaseModel):
    court_id: str
    start_time: datetime
    end_time: datetime
    modality: str
    notes: Optional[str] = None
    associated_group_id: Optional[str] = None

@router.post('/court-request')
async def request_court_booking(
    booking: CourtBookingRequest,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """Usuário solicita reserva de quadra - fica com status 'pending' até aprovação do admin."""
    booking_repo = BookingRepository(db)
    court_repo = CourtRepository(db)
    arena_repo = ArenaRepository(db)
    user_repo = UserRepository(db)
    notification_repo = NotificationRepository(db)
    notification_manager = NotificationConnectionManager()
    notification_service = NotificationService(notification_repo, notification_manager, user_repo)

    court = await court_repo.get_by_id(booking.court_id)
    if not court:
        raise HTTPException(status_code=404, detail="Quadra não encontrada")
    
    if not court.get('is_active', True):
        raise HTTPException(status_code=400, detail="Quadra não está disponível")

    # Verifica conflito de horário
    conflict = await booking_repo.check_conflict(booking.court_id, booking.start_time, booking.end_time)
    if conflict:
        raise HTTPException(status_code=400, detail="Conflito de horário com outra reserva")

    now = datetime.now(timezone.utc)
    
    # Busca localização da arena para incluir na reserva
    location = None
    if court.get('belong_arena'):
        arena = await arena_repo.get_arena_by_id(court['belong_arena'])
        if arena and arena.get('location'):
            location = arena['location']

    booking_data = {
        'court_id': booking.court_id,
        'user_id': str(user['_id']),
        'owner_id': str(user['_id']),
        'start_time': booking.start_time,
        'end_time': booking.end_time,
        'modality': booking.modality,
        'status': 'pending',
        'notes': booking.notes,
        'created_at': now,
        'updated_at': now,
        'players': [],
        'reserve_players': [],
        'court_owner_id': str(court.get('owner_id', '')),
        'associated_group_id': booking.associated_group_id,
        'location': location,
        'max_players': 0,
        'status_list': False,
    }

    booking_id = await booking_repo.create(booking_data)

    # Notifica o dono da quadra
    court_owner_id = str(court.get('owner_id', ''))
    if court_owner_id:
        from app.interfaces.schemas.notification import NotificationCreate
        requester = await user_repo.get_user_by_id(str(user['_id']))
        notification = NotificationCreate(
            user_id=court_owner_id,
            notification_type="booking_request",
            message=f"{requester.get('name', 'Um usuário')} solicitou uma reserva para {court.get('name', 'sua quadra')}.",
            related_id=str(booking_id),
            link=f"/admin/booking"
        )
        await notification_service.create_and_send_notification(notification)

    return {'id': str(booking_id), 'status': 'pending'}


@router.get('/admin/court-bookings')
async def list_admin_court_bookings(
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """Lista todas as reservas das quadras do admin."""
    if 'admin' not in user['role']:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    court_repo = CourtRepository(db)
    courts = await court_repo.list_by_owner(str(user['_id']))
    court_ids = [c['_id'] for c in courts]
    
    if not court_ids:
        return []
    
    booking_repo = BookingRepository(db)
    all_bookings = []
    for court_id in court_ids:
        bookings = await booking_repo.list_bookings_by_court(court_id)
        # Enriquece com dados da quadra
        court_data = next((c for c in courts if c['_id'] == court_id), None)
        for b in bookings:
            b['court_name'] = court_data.get('name', '') if court_data else ''
        all_bookings.extend(bookings)
    
    return all_bookings


@router.put('/{booking_id}/approve')
async def approve_court_booking(
    booking_id: str,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """Admin aprova uma reserva de quadra."""
    if 'admin' not in user['role']:
        raise HTTPException(status_code=403, detail="Acesso negado")

    booking_repo = BookingRepository(db)
    court_repo = CourtRepository(db)
    
    booking = await booking_repo.get_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    if booking.get('status') != 'pending':
        raise HTTPException(status_code=400, detail="Reserva não está pendente")
    
    court = await court_repo.get_by_id(booking['court_id'])
    if not court or str(court.get('owner_id')) != str(user['_id']):
        raise HTTPException(status_code=403, detail="Você não é dono desta quadra")
    
    now = datetime.now(timezone.utc)
    await booking_repo.update_partial(booking_id, {
        'status': 'confirmed',
        'approved_at': now,
        'approved_by': str(user['_id']),
        'updated_at': now
    })
    
    # Notifica o usuário
    user_repo = UserRepository(db)
    notification_repo = NotificationRepository(db)
    notification_manager = NotificationConnectionManager()
    notification_service = NotificationService(notification_repo, notification_manager, user_repo)
    
    from app.interfaces.schemas.notification import NotificationCreate
    notification = NotificationCreate(
        user_id=booking['user_id'],
        notification_type="booking_approved",
        message=f"Sua reserva para {court.get('name', 'a quadra')} foi aprovada! Um chat foi criado para você.",
        related_id=booking_id,
        link=f"/user/booking/{booking_id}"
    )
    await notification_service.create_and_send_notification(notification)
    
    return {'detail': 'Reserva aprovada com sucesso', 'booking_id': booking_id}


@router.put('/{booking_id}/reject')
async def reject_court_booking(
    booking_id: str,
    reason: Optional[str] = Body(None, embed=True),
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """Admin rejeita uma reserva de quadra."""
    if 'admin' not in user['role']:
        raise HTTPException(status_code=403, detail="Acesso negado")

    booking_repo = BookingRepository(db)
    court_repo = CourtRepository(db)
    
    booking = await booking_repo.get_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    court = await court_repo.get_by_id(booking['court_id'])
    if not court or str(court.get('owner_id')) != str(user['_id']):
        raise HTTPException(status_code=403, detail="Você não é dono desta quadra")
    
    now = datetime.now(timezone.utc)
    await booking_repo.update_partial(booking_id, {
        'status': 'rejected',
        'rejection_reason': reason,
        'rejected_at': now,
        'updated_at': now
    })
    
    # Notifica o usuário
    user_repo = UserRepository(db)
    notification_repo = NotificationRepository(db)
    notification_manager = NotificationConnectionManager()
    notification_service = NotificationService(notification_repo, notification_manager, user_repo)
    
    from app.interfaces.schemas.notification import NotificationCreate
    msg = f"Sua reserva para {court.get('name', 'a quadra')} foi rejeitada."
    if reason:
        msg += f" Motivo: {reason}"
    
    notification = NotificationCreate(
        user_id=booking['user_id'],
        notification_type="booking_rejected",
        message=msg,
        related_id=booking_id,
        link=f"/user/booking/{booking_id}"
    )
    await notification_service.create_and_send_notification(notification)
    
    return {'detail': 'Reserva rejeitada'}
