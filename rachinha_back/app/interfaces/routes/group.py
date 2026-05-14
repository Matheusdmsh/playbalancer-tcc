from fastapi import APIRouter, Depends, HTTPException, status
from app.domain.repositories.invite_repository import InviteRepository
from app.domain.repositories.booking_repository import BookingRepository
from app.domain.repositories.court_repository import CourtRepository
from app.domain.repositories.notification_repository import NotificationRepository
from app.domain.repositories.user_repository import UserRepository
from app.interfaces.schemas.group import GroupCreate, GroupUpdate, GroupInDB
from app.core.security import get_current_user
from app.domain.repositories.group_repository import GroupRepository
from app.services.booking_service import BookingService
from app.services.group_service import GroupService
from app.core.config import get_db
from typing import List

from app.services.notification_service import NotificationConnectionManager, NotificationService

router = APIRouter(prefix="/groups", tags=["Groups"])

@router.post("/{group_id}/invite-link", response_model=dict)
async def generate_invite_link(group_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    """Gera ou regenera o link de convite para uma turma."""
    service = GroupService(GroupRepository(db))
    try:
        link = await service.generate_invite_link(group_id, user["_id"])
        return {"invite_link": link}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.post("/join/{invite_token}", response_model=GroupInDB)
async def join_group_with_link(invite_token: str, db=Depends(get_db), user=Depends(get_current_user)):
    """Permite que um usuário logado entre em uma turma usando um link de convite."""
    group_repo = GroupRepository(db)
    user_repo = UserRepository(db)
    booking_service = BookingService(
        booking_repo=BookingRepository(db),
        court_repo=CourtRepository(db),
        user_repo=user_repo,
        group_repo=group_repo,
        invite_repo=InviteRepository(db)
    )
    service = GroupService(group_repo=group_repo, user_repo=user_repo, booking_service=booking_service)
    try:
        group = await service.join_group_by_invite_link(invite_token, user["_id"])
        return GroupInDB(**group)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/create", response_model=GroupInDB, status_code=status.HTTP_201_CREATED)
async def create_group(group: GroupCreate, db=Depends(get_db), user=Depends(get_current_user)):
    """Cria um novo grupo. O usuário autenticado se torna o dono e primeiro membro."""
    service = GroupService(GroupRepository(db), UserRepository(db))
    group_data = group.dict()
    
    group_id = await service.create_group(user["_id"], group_data)
    
    created_group = await service.get_group_by_id(group_id)
    if not created_group:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Falha ao criar o grupo.")
    return created_group

@router.get("/mygroups", response_model=List[GroupInDB])
async def list_my_groups(db=Depends(get_db), user=Depends(get_current_user)):
    """Lista todos os grupos dos quais o usuário autenticado faz parte."""
    service = GroupService(GroupRepository(db))
    groups = await service.list_user_groups(user["_id"])
    return [GroupInDB(**group) for group in groups]

@router.get("/{group_id}", response_model=GroupInDB)
async def get_group(group_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    """Obtém os detalhes de um grupo pelo seu ID."""
    service = GroupService(GroupRepository(db))
    group = await service.get_group_by_id(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado.")
        
    return GroupInDB(**group)

@router.put("/edit/{group_id}", response_model=GroupInDB)
async def edit_group(group_id: str, group_update: GroupUpdate, db=Depends(get_db), user=Depends(get_current_user)):
    """Edita as informações de um grupo. Apenas o dono pode editar."""
    service = GroupService(GroupRepository(db), UserRepository(db))
    try:
        updated = await service.update_group(user["_id"], group_id, group_update.dict(exclude_unset=True))
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado ou sem alterações.")
        
        updated_group = await service.get_group_by_id(group_id)
        if not updated_group:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Falha ao recuperar o grupo atualizado.")
        return GroupInDB(**updated_group)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.put("/{group_id}/transfer-owner/{new_owner_id}", response_model=GroupInDB)
async def transfer_group_owner(group_id: str, new_owner_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    """Transfere a propriedade do grupo. Apenas o owner atual pode transferir."""
    service = GroupService(GroupRepository(db), UserRepository(db))
    try:
        await service.transfer_group_ownership(group_id, new_owner_id, user["_id"])
        updated_group = await service.get_group_by_id(group_id)
        if not updated_group:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao buscar grupo atualizado.")
        return GroupInDB(**updated_group)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.delete("/delete/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(group_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    """Deleta um grupo. Apenas o dono pode deletar."""
    service = GroupService(GroupRepository(db), UserRepository(db))
    try:
        deleted = await service.delete_group(user["_id"], group_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado ou não foi possível deletar.")
        return
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.post("/{group_id}/members/{member_id}", response_model=GroupInDB)
async def add_member_to_group(
    group_id: str,
    member_id: str,
    skill_level: float,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """Adiciona um membro ao grupo. Apenas admins do grupo podem fazer isso."""
    group_repo = GroupRepository(db)
    user_repo = UserRepository(db)
    invite_repo = InviteRepository(db)
    booking_service = BookingService(
        booking_repo=BookingRepository(db),
        court_repo=CourtRepository(db),
        user_repo=user_repo,
        group_repo=group_repo,
        invite_repo=invite_repo
    )
    notification_service = NotificationService(NotificationRepository(db), NotificationConnectionManager(), user_repo)
    service = GroupService(
        group_repo=group_repo,
        user_repo=user_repo,
        booking_service=booking_service,
        notification_service=notification_service,
        invite_repo=invite_repo
    )
    try:
        added = await service.add_member_to_group(user["_id"], group_id, member_id, skill_level)
        if not added:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não foi possível adicionar o membro ao grupo.")
        updated_group = await service.get_group_by_id(group_id)
        if not updated_group:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao buscar grupo atualizado.")
        return GroupInDB(**updated_group)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete("/{group_id}/members/{member_id}", response_model=GroupInDB)
async def remove_member_from_group(group_id: str, member_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    """Remove um membro do grupo. Apenas o dono do grupo pode fazer isso. O dono não pode ser removido."""
    group_repo = GroupRepository(db)
    user_repo = UserRepository(db)
    booking_service = BookingService(
        booking_repo=BookingRepository(db),
        court_repo=CourtRepository(db),
        user_repo=user_repo,
        group_repo=group_repo,
        invite_repo=InviteRepository(db)
    )
    service = GroupService(group_repo=group_repo, user_repo=user_repo, booking_service=booking_service)
    try:
        removed = await service.remove_member_from_group(group_id, member_id)
        if not removed:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não foi possível remover o membro do grupo.")
        updated_group = await service.get_group_by_id(group_id)
        if not updated_group:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao buscar grupo atualizado.")
        return GroupInDB(**updated_group)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    
@router.get("/{group_id}/members", response_model=List[str])
async def list_group_members(group_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    """Lista os membros de um grupo. Qualquer um pode ver os membros de um grupo."""
    service = GroupService(GroupRepository(db))
    try:
        members = await service.list_group_members(group_id)
        if members is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado.")
        return members
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    
@router.put("/{group_id}/members/{member_id}/skill", response_model=GroupInDB)
async def update_member_skill(group_id: str, member_id: str, skill_level: float, db=Depends(get_db), user=Depends(get_current_user)):
    """Atualiza o nível de habilidade de um membro do grupo. Apenas o dono do grupo pode fazer isso."""
    service = GroupService(GroupRepository(db), UserRepository(db))
    try:
        updated = await service.update_member_skill(group_id, member_id, skill_level, user['_id'])
        if not updated:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não foi possível atualizar o nível de habilidade do membro.")
        updated_group = await service.get_group_by_id(group_id)
        if not updated_group:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao buscar grupo atualizado.")
        return updated_group
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    
@router.get("/invite/{invite_token}", response_model=GroupInDB)
async def get_group_by_invite_token(invite_token: str, db=Depends(get_db)):
    service = GroupService(GroupRepository(db))
    try:
        group = await service.get_group_by_invite_token(invite_token)
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado.")
        return group
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.post("/{group_id}/admins/{user_id}", response_model=GroupInDB)
async def add_admin_to_group(group_id: str, user_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    """Adiciona um admin ao grupo. Apenas o owner pode adicionar admins."""
    service = GroupService(GroupRepository(db), UserRepository(db))
    try:
        updated_group = await service.add_admin(group_id, user_id, user["_id"])
        return GroupInDB(**updated_group)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.delete("/{group_id}/admins/{user_id}", response_model=GroupInDB)
async def remove_admin_from_group(group_id: str, user_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    """Remove um admin do grupo. Apenas o owner pode remover admins."""
    service = GroupService(GroupRepository(db), UserRepository(db))
    try:
        updated_group = await service.remove_admin(group_id, user_id, user["_id"])
        return GroupInDB(**updated_group)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.get("/{group_id}/admins", response_model=List[str])
async def list_group_admins(group_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    """Lista todos os admins do grupo."""
    service = GroupService(GroupRepository(db))
    try:
        admins = await service.list_admins(group_id)
        return admins
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))