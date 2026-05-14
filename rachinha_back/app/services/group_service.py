from typing import Dict, List, Optional
from app.domain.repositories.group_repository import GroupRepository
from app.domain.repositories.user_repository import UserRepository
from app.services.booking_service import BookingService
from app.domain.repositories.invite_repository import InviteRepository
from bson import ObjectId
import random
import string
from datetime import datetime, timezone

from app.services.notification_service import NotificationService
from app.interfaces.schemas.notification import NotificationCreate
from app.utils.email_sender import EmailSender


email_sender = EmailSender()

def convert_object_ids(data):
    if isinstance(data, list):
        return [convert_object_ids(item) for item in data]
    elif isinstance(data, dict):
        return {
            k: str(v) if isinstance(v, ObjectId) else convert_object_ids(v)
            for k, v in data.items()
        }
    return data

class GroupService:
    def __init__(self, group_repo: GroupRepository = None, user_repo: UserRepository = None, booking_service: Optional[BookingService] = None, invite_repo: Optional[InviteRepository] = None, notification_service: NotificationService = None):
        self.group_repo = group_repo
        self.user_repo = user_repo
        self.booking_service = booking_service
        self.invite_repo = invite_repo
        self.notification_service = notification_service
    
    def is_admin(self, user_id: str, group: dict) -> bool:
        """Verifica se o usuário é admin do grupo (owner ou está na lista de admins)."""
        if not group:
            return False
        # Owner sempre é admin
        if str(group.get('owner_id')) == str(user_id):
            return True
        # Verificar se está na lista de admins
        admins = group.get('admins', [])
        return str(user_id) in [str(admin_id) for admin_id in admins]

    def _normalize_modality(self, modality: Optional[str]) -> Optional[str]:
        if not modality or not isinstance(modality, str):
            return None
        normalized = modality.strip().lower()
        return normalized or None

    def _to_numeric_skill(self, value) -> Optional[float]:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    async def recalculate_user_sport_ratings(self, user_id: str) -> Dict[str, float]:
        """
        Recalcula e persiste as notas médias por modalidade de um usuário,
        considerando apenas os grupos em que ele participa e que possuem modalidade.
        """
        if not self.group_repo or not self.user_repo:
            return {}

        groups = await self.group_repo.list_groups_for_user(user_id)
        if not groups:
            await self.user_repo.update_user(user_id, {
                "sport_ratings": {},
                "updated_at": datetime.now(timezone.utc)
            })
            return {}

        sum_by_modality: Dict[str, float] = {}
        count_by_modality: Dict[str, int] = {}

        for group in groups:
            modality = self._normalize_modality(group.get("modality"))
            if not modality:
                continue

            member = next(
                (m for m in group.get("members", []) if str(m.get("id")) == str(user_id)),
                None
            )
            if not member:
                continue

            skill_value = self._to_numeric_skill(member.get("skill_level"))
            if skill_value is None:
                continue

            sum_by_modality[modality] = sum_by_modality.get(modality, 0.0) + skill_value
            count_by_modality[modality] = count_by_modality.get(modality, 0) + 1

        ratings = {
            modality: round(sum_by_modality[modality] / count_by_modality[modality], 2)
            for modality in sum_by_modality
            if count_by_modality.get(modality, 0) > 0
        }

        await self.user_repo.update_user(user_id, {
            "sport_ratings": ratings,
            "updated_at": datetime.now(timezone.utc)
        })
        return ratings

    async def _recalculate_ratings_for_group_members(self, group: Optional[dict]):
        if not group or not self.user_repo:
            return
        member_ids = {
            str(member.get("id"))
            for member in group.get("members", [])
            if member.get("id") is not None
        }
        for member_id in member_ids:
            await self.recalculate_user_sport_ratings(member_id)

    async def _ensure_group_in_user_favorites(self, user_id: str, group_id: str) -> None:
        """Keeps favorite_groups in sync when a user creates or manages a group."""
        if not self.user_repo or not user_id or not group_id:
            return
        await self.user_repo.update_user(user_id, {
            "$addToSet": {"favorite_groups": str(group_id)},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        })

    async def generate_invite_link(self, group_id: str, current_user_id: str) -> str:
        """Gera ou regenera um link de convite para o grupo."""
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise ValueError("Grupo não encontrado.")
        if not self.is_admin(current_user_id, group):
            raise ValueError("Apenas administradores do grupo podem gerar links de convite.")

        token = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
        await self.group_repo.update_partial(group_id, {"invite_token": token})
        
        return f"https://rachinha.com/user/group/join/{token}"

    async def join_group_by_invite_link(self, token: str, current_user_id: str) -> dict:
        """Adiciona um usuário a um grupo usando um token de convite."""
        group = await self.group_repo.find_by_invite_token(token)
        if not group:
            raise ValueError("Link de convite inválido ou expirado.")

        if any(member.get('id') == current_user_id for member in group.get('members', [])):
            raise ValueError("Você já é um membro deste grupo.")

        user = await self.user_repo.get_user_by_id(current_user_id)
        skill_level = user.get('skill_level')

        success = await self.group_repo.add_member(group['_id'], current_user_id, skill_level)
        if not success:
            raise Exception("Não foi possível entrar no grupo.")

        if self.booking_service:
            await self.booking_service.sync_group_member_to_bookings(group['_id'], current_user_id, 'add')

        await self.recalculate_user_sport_ratings(current_user_id)
        
        return group


    async def create_group(self, owner_id: str, group_data: dict) -> str:
        """
        Prepara os dados do grupo adicionando o dono e timestamps, então cria o grupo.
        """
        group_data['owner_id'] = owner_id
        
        now = datetime.now(timezone.utc)
        group_data['created_at'] = now
        group_data['updated_at'] = now
        
        # Inicializar owner como primeiro admin
        if 'admins' not in group_data or not group_data['admins']:
            group_data['admins'] = [owner_id]
        elif owner_id not in group_data['admins']:
            group_data['admins'].insert(0, owner_id)
        
        if "members" in group_data:
            if not any(str(member.get('id')) == owner_id for member in group_data["members"]):
                group_data["members"].insert(0, {"id": owner_id, "skill_level": None})
        else:
            group_data["members"] = [{"id": owner_id, "skill_level": None}]

        group_id = await self.group_repo.create(group_data)

        await self._ensure_group_in_user_favorites(owner_id, group_id)

        created_group = await self.group_repo.get_by_id(group_id)
        await self._recalculate_ratings_for_group_members(created_group)
        
        return group_id

    async def get_group_by_id(self, group_id: str):
        group = await self.group_repo.get_by_id(group_id)
        return convert_object_ids(group)

    async def list_user_groups(self, user_id: str):
        groups = await self.group_repo.list_groups_for_user(user_id)
        return convert_object_ids(groups)

    async def add_member_to_group(self, current_user_id: str, group_id: str, member_id: str, skill_level: float = 0) -> dict:
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise ValueError('Group not found.')

        if not self.is_admin(current_user_id, group):
            raise ValueError('Only group admins can add members.')

        if any(str(member.get('id', member.get('_id'))) == member_id for member in group.get('members', [])):
            raise ValueError('Member already in group.')
        
        # AVISO: Permitir adicionar fake users (poderão ser ghosted), mas bloquear na promoção a admin
        # Verificar se o usuário existe
        user = await self.user_repo.get_user_by_id(member_id)
        if not user:
            raise ValueError('User not found.')

        success = await self.group_repo.add_member(group_id, member_id, skill_level)
        if success and self.notification_service:
            group_owner = await self.user_repo.get_user_by_id(group['owner_id'])
            notification = NotificationCreate(
                user_id=member_id,
                notification_type="group_invitation",
                message=f"Você foi adicionado ao grupo '{group['name']}' por {group_owner['name']}.",
                related_id=group_id,
                link=f"/user/group/{group_id}"
            )
            await self.notification_service.create_and_send_notification(notification)

        if success:
            member = await self.user_repo.get_user_by_id(member_id)
            if member.get('is_placeholder') is False:
                await email_sender.send_email(
                    template_name="group_invite",
                    subject="BEM VINDO AO TIME! Você foi adicionado ao grupo {{ group_name }}",
                    recipients=[{
                        "email": member['email'],
                    "variables": {
                        "group_name": group['name'],
                        "owner_name": group_owner['name'],
                        "group_link": f"https://rachinha.com/group/{group_id}"
                    }
                }]
            )

        if success and self.booking_service:
            await self.booking_service.sync_group_member_to_bookings(group_id, member_id, 'add')
        if success:
            await self.recalculate_user_sport_ratings(member_id)
        return {'status': 'Member added successfully.'}

    async def remove_member_from_group(self, group_id: str, member_id: str) -> dict:
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise ValueError('Group not found.')

        if not any(str(member.get('id', member.get('_id'))) == member_id for member in group.get('members', [])):
            raise ValueError('Member not in group.')

        if member_id == str(group['owner_id']):
            raise ValueError('Cannot remove group owner from members list directly. Transfer ownership first.')

        success = await self.group_repo.remove_member(group_id, member_id)
        if success and self.booking_service:
            await self.booking_service.sync_group_member_to_bookings(group_id, member_id, 'remove')
        if success:
            await self.recalculate_user_sport_ratings(member_id)
        return {'status': 'Member removed successfully.'}

    async def transfer_group_ownership(self, group_id: str, new_owner_id: str, current_user_id: str) -> dict:
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise ValueError('Group not found.')

        if str(group['owner_id']) != str(current_user_id):
            raise ValueError('Only the current owner can transfer ownership.')

        if not any(str(member.get('id', member.get('_id'))) == new_owner_id for member in group.get('members', [])):
            raise ValueError('New owner must be a member of the group.')
        
        # VALIDAÇÃO: Não pode transferir para fake user
        new_owner = await self.user_repo.get_user_by_id(new_owner_id)
        if not new_owner:
            raise ValueError('New owner user not found.')
        
        if new_owner.get('is_placeholder') is True:
            raise ValueError('Cannot transfer ownership to a placeholder user.')

        success = await self.group_repo.update_owner(group_id, new_owner_id)
        if success:
            # Adicionar novo owner à lista de admins se não estiver lá
            await self.group_repo.add_admin(group_id, new_owner_id)
            await self._ensure_group_in_user_favorites(new_owner_id, group_id)
        return {'status': 'Ownership transferred successfully.'}
    
    async def update_group(self, current_user_id: str, group_id: str, update_data: dict) -> bool:
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise ValueError('Group not found.')

        if not self.is_admin(current_user_id, group):
            raise ValueError('Only group admins can update the group.')

        current_modality = self._normalize_modality(group.get('modality'))
        new_modality = self._normalize_modality(update_data.get('modality')) if 'modality' in update_data else current_modality
        update_data.pop('owner_id', None)
        update_data['updated_at'] = datetime.now(timezone.utc)

        success = await self.group_repo.update_partial(group_id, update_data)
        if success and current_modality != new_modality:
            await self._recalculate_ratings_for_group_members(group)
        return success
    
    async def delete_group(self, current_user_id: str, group_id: str) -> bool:
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise ValueError('Group not found.')

        if str(group['owner_id']) != current_user_id:
            raise ValueError('Only the group owner can delete the group.')

        member_ids = [
            str(member.get('id'))
            for member in group.get('members', [])
            if member.get('id') is not None
        ]

        success = await self.group_repo.delete(group_id)
        if success:
            for member_id in set(member_ids):
                await self.recalculate_user_sport_ratings(member_id)
        return success
    
    async def list_group_members(self, group_id: str) -> List[dict]:
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise ValueError('Group not found.')
        members = []
        for member in group.get('members', []):
            members.append({
                'id': str(member.get('id', member.get('_id'))),
                'skill_level': member.get('skill_level')
            })
        return members

    async def update_member_skill(self, group_id: str, member_id: str, skill_level: float, user_id: str) -> dict:
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise ValueError('Group not found.')
        if not self.is_admin(user_id, group):
            raise ValueError('Only group admins can update member skills.')

        if not any(str(member.get('id', member.get('_id'))) == member_id for member in group.get('members', [])):
            raise ValueError('Member not in group.')

        success = await self.group_repo.update_skill_level(group_id, member_id, skill_level)
        if success:
            await self.recalculate_user_sport_ratings(member_id)
            updated_group = await self.group_repo.get_by_id(group_id)
            return convert_object_ids(updated_group)
        else:
            raise ValueError('Failed to update member skill level.')
        
    async def get_group_by_invite_token(self, invite_token: str) -> dict:
        group = await self.group_repo.find_by_invite_token(invite_token)
        if not group:
            raise ValueError("Invalid or expired invite link.")
        return convert_object_ids(group)
    
    async def add_admin(self, group_id: str, user_id: str, current_user_id: str) -> dict:
        """Adiciona um admin ao grupo. Apenas o owner pode adicionar admins."""
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise ValueError('Group not found.')
        
        # Apenas o owner pode adicionar admins
        if str(group['owner_id']) != current_user_id:
            raise ValueError('Only the group owner can add admins.')
        
        # Verificar se o usuário existe e não é fake
        user = await self.user_repo.get_user_by_id(user_id)
        if not user:
            raise ValueError('User not found.')
        
        # VALIDAÇÃO CRÍTICA: Usuários fake NÃO podem ser admins
        if user.get('is_placeholder') is True:
            raise ValueError('Placeholder users cannot be promoted to admin.')
        
        # Verificar se o usuário é membro do grupo
        if not any(str(member.get('id', member.get('_id'))) == user_id for member in group.get('members', [])):
            raise ValueError('User must be a member of the group to become an admin.')
        
        # Verificar se já é admin
        if str(user_id) in [str(admin_id) for admin_id in group.get('admins', [])]:
            raise ValueError('User is already an admin.')
        
        # Verificar se está tentando adicionar o próprio owner (já é admin)
        if str(user_id) == str(group['owner_id']):
            raise ValueError('Owner is already an admin.')
        
        success = await self.group_repo.add_admin(group_id, user_id)
        if success:
            await self._ensure_group_in_user_favorites(user_id, group_id)
            updated_group = await self.group_repo.get_by_id(group_id)
            return convert_object_ids(updated_group)
        else:
            raise ValueError('Failed to add admin.')
    
    async def remove_admin(self, group_id: str, user_id: str, current_user_id: str) -> dict:
        """Remove um admin do grupo. Apenas o owner pode remover admins."""
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise ValueError('Group not found.')
        
        # Apenas o owner pode remover admins
        if str(group['owner_id']) != current_user_id:
            raise ValueError('Only the group owner can remove admins.')
        
        # Não pode remover o próprio owner da lista de admins
        if str(user_id) == str(group['owner_id']):
            raise ValueError('Cannot remove the group owner from admins.')
        
        # Verificar se o usuário é realmente um admin
        admin_ids = [str(admin_id) for admin_id in group.get('admins', [])]
        if str(user_id) not in admin_ids:
            raise ValueError('User is not an admin in this group.')
        
        success = await self.group_repo.remove_admin(group_id, user_id)
        if success:
            updated_group = await self.group_repo.get_by_id(group_id)
            return convert_object_ids(updated_group)
        else:
            raise ValueError('Failed to remove admin.')
    
    async def list_admins(self, group_id: str) -> List[str]:
        """Lista todos os admins do grupo."""
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise ValueError('Group not found.')
        
        # Retornar owner + admins (sem duplicatas)
        owner_id = str(group['owner_id'])
        admin_ids = [str(admin_id) for admin_id in group.get('admins', [])]
        
        # Owner sempre é admin, então incluir na lista
        all_admins = [owner_id] + [aid for aid in admin_ids if aid != owner_id]
        return all_admins