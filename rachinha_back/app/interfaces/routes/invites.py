# rachinha/app/interfaces/routes/invites.py
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.domain.repositories.booking_repository import BookingRepository
from app.domain.repositories.court_repository import CourtRepository
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.group_repository import GroupRepository
from app.domain.repositories.invite_repository import InviteRepository
from app.services.booking_service import BookingService
from app.core.config import get_db
from app.utils.email_sender import EmailSender
from typing import List

router = APIRouter(prefix='/bookings', tags=['Invites'])

async def get_invite_repository(db=Depends(get_db)) -> InviteRepository:
    return InviteRepository(db)

async def get_email_sender() -> EmailSender:
    return EmailSender()

async def get_booking_service(
    db = Depends(get_db),
    invite_repo: InviteRepository = Depends(get_invite_repository),
    email_sender: EmailSender = Depends(get_email_sender)
) -> BookingService:
    booking_repo = BookingRepository(db)
    court_repo = CourtRepository(db)
    user_repo = UserRepository(db)
    group_repo = GroupRepository(db)

    return BookingService(booking_repo, court_repo, user_repo, group_repo, invite_repo, email_sender)

@router.get('/invites/my', summary='List my booking invites')
async def list_my_booking_invites(
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user)
):
    try:
        invites = await service.list_user_invites(user['_id'])
        return invites
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get('/{booking_id}/invites', summary='List invites for a specific booking (owner only)')
async def list_invites_for_booking(
    booking_id: str,
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user)
):
    try:
        invites = await service.list_booking_invites(user['_id'], booking_id)
        return invites
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/{booking_id}/invite/{invite_id}/accept', summary='Accept a booking invite')
async def accept_booking_invite(
    booking_id: str,
    invite_id: str,
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user)
):
    try:
        result = await service.accept_invite(user['_id'], invite_id)
        return {'detail': f'Convite {result["status"]}.', 'booking_id': result['booking_id']}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/{booking_id}/invite/{invite_id}/decline', summary='Decline a booking invite')
async def decline_booking_invite(
    booking_id: str,
    invite_id: str,
    service: BookingService = Depends(get_booking_service),
    user=Depends(get_current_user)
):
    try:
        result = await service.decline_invite(user['_id'], invite_id)
        return {'detail': f'Convite {result["status"]}.', 'booking_id': result['booking_id']}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))