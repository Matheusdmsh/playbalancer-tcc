from datetime import timedelta, time, datetime, timezone
import math
from app.domain.repositories.arena_repository import ArenaRepository
from app.domain.repositories.booking_repository import BookingRepository
from app.domain.repositories.court_repository import CourtRepository
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.group_repository import GroupRepository
from app.domain.repositories.invite_repository import InviteRepository
from app.interfaces.routes import booking
from app.utils.email_sender import EmailSender
import calendar
from bson import ObjectId
import random
from typing import Any, Dict, List, Optional, Literal
from app.core.config import settings
from app.services.notification_service import NotificationService 
from app.interfaces.schemas.notification import NotificationCreate

def convert_object_ids(data):
    if isinstance(data, list):
        return [convert_object_ids(item) for item in data]
    elif isinstance(data, dict):
        return {
            k: str(v) if isinstance(v, ObjectId) else convert_object_ids(v)
            for k, v in data.items()
        }
    return data

class BookingService:
    def __init__(self, booking_repo: BookingRepository, court_repo: CourtRepository, user_repo: UserRepository, group_repo: GroupRepository = None, invite_repo: InviteRepository = None, email_sender: EmailSender = None, notification_service: NotificationService = None, arena_repo: ArenaRepository = None):
        self.booking_repo = booking_repo
        self.court_repo = court_repo
        self.user_repo = user_repo
        self.group_repo = group_repo
        self.invite_repo = invite_repo
        self.arena_repo = arena_repo
        self.email_sender = email_sender or EmailSender()
        self.notification_service = notification_service

    @staticmethod
    def _vote_average_to_skill(avg_vote: float) -> float:
        # Map vote average from [-1, 1] to skill range [1, 5].
        return round((((avg_vote + 1) / 2) * 4) + 1, 1)

    @staticmethod
    def _parse_booking_datetime(booking: dict) -> datetime:
        """Returns a stable datetime used to rank bookings by recency."""
        for field_name in ("end_time", "start_time", "updated_at", "created_at"):
            value = booking.get(field_name)
            parsed = None
            if isinstance(value, datetime):
                parsed = value
            elif isinstance(value, str):
                try:
                    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
                except ValueError:
                    parsed = None

            if parsed is not None:
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                return parsed

        return datetime.min.replace(tzinfo=timezone.utc)

    @staticmethod
    def _weighted_recent_average(scores: List[float], limit: int = 5) -> Optional[float]:
        if not scores:
            return None

        recent_scores = scores[:limit]
        # Most recent score gets highest weight (N..1). For 5 bookings => 5,4,3,2,1.
        weights = list(range(len(recent_scores), 0, -1))
        weighted_sum = sum(score * weight for score, weight in zip(recent_scores, weights))
        weight_total = sum(weights)
        if weight_total <= 0:
            return None
        return round(weighted_sum / weight_total, 1)

    @staticmethod
    def _to_numeric_skill(value: Any) -> Optional[float]:
        if value in (None, ""):
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _round_skill_for_draw(value: Any) -> float:
        numeric_value = BookingService._to_numeric_skill(value)
        if numeric_value is None:
            return 0.0
        return math.floor((numeric_value * 2) + 0.5) / 2

    async def _can_manage_booking(self, booking: dict, user_id: str) -> bool:
        """
        Permite gerenciamento se:
        1) usuário é owner do booking; OU
        2) booking pertence a um grupo e usuário é owner/admin desse grupo.
        """
        if not booking:
            return False

        if str(booking.get('owner_id')) == str(user_id):
            return True

        associated_group_id = booking.get('associated_group_id')
        if not associated_group_id or not self.group_repo:
            return False

        group = await self.group_repo.get_by_id(str(associated_group_id))
        if not group:
            return False

        if str(group.get('owner_id')) == str(user_id):
            return True

        admins = group.get('admins', [])
        return str(user_id) in [str(admin_id) for admin_id in admins]

    async def list_bookings_by_court(self, court_id: str):
        bookings = await self.booking_repo.list_bookings_by_court(court_id)
        return convert_object_ids(bookings)

    async def list_user_bookings(self, user_id: str):
        bookings = await self.booking_repo.list_user_bookings(user_id)
        return convert_object_ids(bookings)
    
    async def list_by_user(self, user_id: str):
        bookings = await self.booking_repo.list_by_user(user_id)
        return convert_object_ids(bookings)
    
    async def list_bookings_by_group(self, group_id: str, user_id: str):
        if not self.group_repo:
            raise ValueError("GroupRepository not available.")
        
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise ValueError("Grupo não encontrado.")

        # O campo agora é 'members', que é uma lista de dicts com 'id' e 'skill_level'
        if not any(member.get('id') == user_id for member in group.get('members', [])):
            raise ValueError("Você não é membro deste grupo.")

        bookings = await self.booking_repo.list_bookings_by_associated_group(group_id)
        return convert_object_ids(bookings)

    async def edit_booking(self, user_id: str, booking_id: str, data: dict):
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise ValueError('Reserva não encontrada.')

        if not await self._can_manage_booking(booking, user_id):
            raise ValueError('Você não tem permissão para editar esta reserva.')

        # Garante que o court_id a ser verificado seja o novo ou o já existente.
        court_id = data.get('court_id', booking['court_id'])

        if 'start_time' in data and 'end_time' in data:
            start = data['start_time']
            end = data['end_time']
            duration = end - start

            if duration < timedelta(hours=1) or duration.total_seconds() % 1800 != 0:
                raise ValueError('A duração deve ser de no mínimo 1h e múltipla de 30min.')

            if court_id != "offline":

                conflict = await self.booking_repo.check_conflict(court_id, start, end, booking_id)
                if conflict:
                    raise ValueError('Conflito de horário com outra reserva.')

                court = await self.court_repo.get_by_id(court_id)
                if not court:
                    raise ValueError('Quadra não encontrada.')

                weekday = calendar.day_name[start.weekday()].lower()
                available_slots = [
                    slot for slot in court['available_hours']
                    if slot['day_of_week'].lower() == weekday
                ]

                is_valid_slot = any(
                    time.fromisoformat(slot['start_time']) <= start.time() and
                    time.fromisoformat(slot['end_time']) >= end.time()
                    for slot in available_slots
                )

                if not is_valid_slot:
                    raise ValueError('Horário fora da disponibilidade da quadra.')

        data['updated_at'] = datetime.now(timezone.utc)
        return await self.booking_repo.update_partial(booking_id, data)
    
    async def list_my_bookings(self, user_id: str):
        bookings = await self.booking_repo.list_my_bookings(user_id)
        return convert_object_ids(bookings)

    async def create_recurring_booking(self, user_id: str, data: dict):
        repo = self.booking_repo
        start = data['start_time']
        end = data['end_time']
        occurrences = data['occurrences']
        recurrence_type = data['recurrence_type']
        now = datetime.now(timezone.utc)

        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)

        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
            
        if start < now:
            raise ValueError('Não é possível fazer agendamentos retroativos.')

        duration = end - start
        if duration < timedelta(hours=1) or duration.total_seconds() % 1800 != 0:
            raise ValueError('A duração deve ser de no mínimo 1h e múltipla de 30min.')

        if data['court_id'] == "offline":
            court = None
        else:
            court = await self.court_repo.get_by_id(data['court_id'])
            if not court:
                raise ValueError('Quadra não encontrada.')

        bookings = []
        invited_members = {user_id}

        if data.get('associated_group_id') and self.group_repo and self.invite_repo:
            group_id = data['associated_group_id']
            group = await self.group_repo.get_by_id(group_id)
            if not group:
                raise ValueError('Grupo associado não encontrado.')

            group_members = set(member['id'] for member in group.get('members', []))
            invited_members.update(group_members)

        for i in range(occurrences):
            delta = timedelta(weeks=i) if recurrence_type == 'weekly' else None
            s_loop = start + delta
            e_loop = end + delta

            if data['court_id'] != "offline":
                weekday = calendar.day_name[s_loop.weekday()].lower()
                available_slots = [
                    slot for slot in court['available_hours']
                    if slot['day_of_week'].lower() == weekday
                ]
                is_valid_slot = any(
                    time.fromisoformat(slot['start_time']) <= s_loop.time() and
                    time.fromisoformat(slot['end_time']) >= e_loop.time()
                    for slot in available_slots
                )
                if not is_valid_slot:
                    raise ValueError(f'Horário indisponível para a data {s_loop.date()}.')

                conflict = await repo.check_conflict(data['court_id'], s_loop, e_loop)
                if conflict:
                    raise ValueError(f'Conflito de horário na data {s_loop.date()}.')


                if not data.get('location'):
                    if court and court.get('belong_arena'):
                        arena_id = court['belong_arena']
                        arena = await self.arena_repo.get_arena_by_id(arena_id)
                        if arena and arena.get('location'):
                            data['location'] = arena['location']

            bookings.append({
                'court_id': data['court_id'],
                'user_id': user_id,
                'start_time': s_loop,
                'end_time': e_loop,
                'modality': data['modality'],
                'status': 'confirmed',
                'created_at': now,
                'updated_at': now,
                'max_players': data.get('max_players', 0),
                'players': [],
                'reserve_players': [],
                'owner_id': user_id,
                'location': data['location'],
                'associated_group_id': data.get('associated_group_id'),
                'status_list': data.get('status_list', False),
            })

        ids = await repo.create_many(bookings)

        # Loop para enviar convites para cada reserva criada
        for booking_id in ids:
            # Busca a reserva específica para obter os dados corretos
            booking_obj = await self.booking_repo.get_by_id(booking_id)
            if not booking_obj:
                continue # Pula para a próxima se a reserva não for encontrada

            # Extrai a data e hora corretas do objeto da reserva
            booking_start_time = booking_obj['start_time']
            booking_end_time = booking_obj['end_time']

            for member_id in invited_members:
                if member_id not in booking_obj.get('players', []) and member_id not in booking_obj.get('reserve_players', []):
                    invite_data = {
                        'booking_id': str(booking_id),
                        'user_id': member_id,
                        'status': 'pending'
                    }
                    await self.invite_repo.create_invite(invite_data)

                    if self.notification_service:
                        inviter_user = await self.user_repo.get_user_by_id(user_id)
                        message = f"Você foi convidado por {inviter_user['name']} para um jogo!"
                        if member_id == user_id:
                            message = "Sua reserva foi criada! Confirme sua presença para garantir sua vaga."

                        notification = NotificationCreate(
                            user_id=member_id,
                            notification_type="booking_invitation",
                            message=message,
                            related_id=str(booking_id),
                            link=f"/user/booking/{booking_id}"
                        )
                        await self.notification_service.create_and_send_notification(notification)

                    invited_user = await self.user_repo.get_user_by_id(member_id)
                    if invited_user and invited_user.get('is_placeholder') is False:
                        try:
                            inviter_name = (await self.user_repo.get_user_by_id(user_id)).get('name', 'Um amigo')
                            subject = 'CONVOCADO! {{ inviter_name }}, te convidou para um jogo!'
                            if member_id == user_id:
                                subject = 'Você agendou com sucesso!'

                            # Pega o alt do location se existir, senão usa o nome da quadra
                            court_name = None
                            if booking_obj.get('location') and isinstance(booking_obj['location'], dict):
                                court_name = booking_obj['location'].get('alt')
                            if not court_name:
                                court_name = court.get('name', 'Quadra') if court else 'Quadra Offline'
                            
                            await self.email_sender.send_email(
                                template_name='booking_invite',
                                subject=subject,
                                recipients=[{
                                    'email': invited_user['email'],
                                    'variables': {
                                        'name': invited_user['name'].split(' ')[0],
                                        'inviter_name': inviter_name,
                                        'court_name': court_name,
                                        'court_address': court.get('address', 'Endereço não informado') if court else 'Não aplicável',
                                        'booking_code': booking_id,
                                        'date': booking_start_time.strftime('%A, %d %b').capitalize(),
                                        'time': f'{booking_start_time.strftime("%H:%M")} - {booking_end_time.strftime("%H:%M")}',
                                        'modality': data['modality'],
                                        'price_per_person': f'R$ {data.get("price_per_person", 0):.2f}',
                                        'accept_invite_link': f'https://rachinha.com/bookings/{booking_id}/accept-invite',
                                        'decline_invite_link': f'https://rachinha.com/bookings/{booking_id}/decline-invite'
                                    }
                                }]
                            )
                        except Exception as e:
                            print(f'Erro ao enviar e-mail de convite para {invited_user["email"]}: {e}')

        return ids

    async def add_player_to_booking(self, user_id: str, booking_id: str, player_id: str, skill_level: float) -> dict:
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise ValueError('Reserva não encontrada.')

        if not await self._can_manage_booking(booking, user_id):
            raise ValueError('Você não tem permissão para adicionar jogadores a esta reserva.')

        if player_id in booking.get('players', []):
            raise ValueError('Jogador já está na lista de jogadores.')
        
        if player_id in booking.get('reserve_players', []):
            raise ValueError('Jogador já está na lista de reserva.')
        
        if booking.get('associated_group_id') and self.group_repo:
            group = await self.group_repo.get_by_id(booking['associated_group_id'])
            if group and 'members' in group:
                for member in group['members']:
                    if str(member.get('id')) == str(player_id):
                        skill_level = member.get('skill_level', 0)
                        break

        if len(booking.get('players', [])) < booking.get('max_players', 0) or booking.get('max_players', 0) == 0:
            await self.booking_repo.add_player_to_booking(booking_id, player_id, skill_level)

            if self.notification_service:
                owner_user = await self.user_repo.get_user_by_id(user_id)
                notification = NotificationCreate(
                    user_id=player_id,
                    notification_type="booking_invitation",
                    message=f"{owner_user['name']} adicionou você a um jogo.",
                    related_id=booking_id,
                    link=f"/user/booking/{booking_id}"
                )
                await self.notification_service.create_and_send_notification(notification)

            if player_id in booking.get('reserve_players', []):
                await self.booking_repo.remove_reserve_player_from_booking(booking_id, player_id)

            if self.invite_repo:
                invite_data = {
                    'booking_id': booking_id,
                    'user_id': player_id,
                    'status': 'accepted'
                }
                existing_invite = await self.invite_repo.get_invite_by_booking_and_user(booking_id, player_id)
                if existing_invite:
                    await self.invite_repo.update_invite_status(existing_invite['_id'], 'accepted')
                else:
                    await self.invite_repo.create_invite(invite_data)

            return {'status': 'added_to_players'}
        else:
            await self.booking_repo.add_reserve_player_to_booking(booking_id, player_id, skill_level)

            if self.notification_service:
                owner_user = await self.user_repo.get_user_by_id(user_id)
                notification = NotificationCreate(
                    user_id=player_id,
                    notification_type="booking_invitation",
                    message=f"{owner_user['name']} adicionou você à lista de espera de um jogo.",
                    related_id=booking_id,
                    link=f"/user/booking/{booking_id}"
                )
                await self.notification_service.create_and_send_notification(notification)
            
            if self.invite_repo:
                invite_data = {
                    'booking_id': booking_id,
                    'user_id': player_id,
                    'status': 'accepted'
                }
                existing_invite = await self.invite_repo.get_invite_by_booking_and_user(booking_id, player_id)
                if existing_invite:
                    await self.invite_repo.update_invite_status(existing_invite['_id'], 'accepted')
                else:
                    await self.invite_repo.create_invite(invite_data)

            return {'status': 'added_to_reserve'}

    async def join_booking_by_link(self, booking_id: str, user_id: str) -> dict:
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise ValueError('Reserva não encontrada.')

        if user_id in booking.get('players', []):
            raise ValueError('Você já está nesta reserva.')
        
        if user_id in booking.get('reserve_players', []):
            raise ValueError('Você já está na lista de reserva desta reserva.')

        if len(booking.get('players', [])) < booking.get('max_players', 0) or booking.get('max_players', 0) == 0:
            await self.booking_repo.add_player_to_booking(booking_id, user_id, skill_level=0)
            if user_id in booking.get('reserve_players', []):
                await self.booking_repo.remove_reserve_player_from_booking(booking_id, user_id)
            return {'status': 'added_to_players', 'booking_id': booking_id}
        else:
            await self.booking_repo.add_reserve_player_to_booking(booking_id, user_id, skill_level=0)
            return {'status': 'added_to_reserve', 'booking_id': booking_id}

    async def list_bookings_by_ids(self, booking_ids: List[str]) -> List[dict]:
        """
        Recebe uma lista de IDs de booking e retorna os detalhes de cada um.
        """
        object_ids = []
        for bid in booking_ids:
            try:
                object_ids.append(ObjectId(bid))
            except Exception as e:
                print(f"ID inválido: {bid}, erro: {e}")

        if not object_ids:
            return []

        bookings = await self.booking_repo.get_bookings_by_ids(object_ids)
        return convert_object_ids(bookings)

    def _teams_signature(self, teams: List[List[str]]) -> tuple:
        """Canonical signature used to detect repeated draws regardless of team order."""
        normalized_teams = [tuple(sorted(str(player_id) for player_id in team)) for team in teams]
        normalized_teams.sort()
        return tuple(normalized_teams)

    def _build_balanced_random_teams(
        self,
        players: List[Dict[str, float]],
        num_teams: int,
        players_per_team: int,
    ) -> tuple[List[List[str]], List[float]]:
        """Build teams with randomness while greedily balancing skill sums."""
        teams: List[List[str]] = [[] for _ in range(num_teams)]
        team_skills: List[float] = [0.0] * num_teams

        # Random tie-break among same-skill players keeps each draw non-deterministic.
        decorated_players = [
            (player["skill"], random.random(), player)
            for player in players
        ]
        decorated_players.sort(key=lambda item: (item[0], item[1]), reverse=True)

        for _, _, player in decorated_players:
            available_team_indexes = [
                idx for idx in range(num_teams) if len(teams[idx]) < players_per_team
            ]

            min_skill_sum = min(team_skills[idx] for idx in available_team_indexes)
            candidate_indexes = [
                idx for idx in available_team_indexes if team_skills[idx] == min_skill_sum
            ]

            chosen_team_index = random.choice(candidate_indexes)
            teams[chosen_team_index].append(str(player["id"]))
            team_skills[chosen_team_index] += player["skill"]

        return teams, team_skills

    async def organize_teams(self, user_id: str, booking_id: str, players_per_team: int, selected_player_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise ValueError('Reserva não encontrada.')

        if not await self._can_manage_booking(booking, user_id):
            raise ValueError('Você não tem permissão para organizar os times desta reserva.')

        all_players = booking.get('players', [])  # lista completa da reserva

        # NOVO: Lista que vai armazenar os 6 jogadores que não foram selecionados
        automatic_reserves_data: List[Dict[str, Any]] = []
        # Se vier lista de selecionados, filtra só eles
        if selected_player_ids:
            selected_set = {str(pid) for pid in selected_player_ids}
            players_to_organize = []

            for player in all_players:
                # player pode ser dict ou string
                if isinstance(player, dict):
                    pid = player.get('id') or player.get('_id')
                else:
                    pid = player

                if pid is None:
                    continue

                if str(pid) in selected_set:
                    players_to_organize.append(player)

                else:
                # SEPARANDO: O jogador confirmado, mas não selecionado, VAI PARA A RESERVA
                    automatic_reserves_data.append(player)
            players = players_to_organize
        else:
            # comportamento antigo (todos os confirmados)
            players = all_players
            automatic_reserves_data = []

        
        if len(players) < 2:
            raise ValueError('É necessário pelo menos 2 jogadores para organizar times.')

        # Normaliza: vira [{id, skill}] usando arredondamento em passos de 0.5 apenas para sorteio.
        players_with_skill: List[Dict[str, float]] = []
        for player in players:
            player_id = player.get('id') or player.get('_id') or player
            skill = self._round_skill_for_draw(player.get('skill_level', 0)) if isinstance(player, dict) else 0.0
            players_with_skill.append({'id': player_id, 'skill': skill})

        num_players = len(players_with_skill)
        num_full_teams = num_players // players_per_team  # só times completos

        # Validação: é preciso conseguir formar pelo menos 2 times completos
        if num_full_teams < 2:
            needed = players_per_team * 2
            raise ValueError(
                f'É necessário pelo menos {needed} jogadores para formar 2 times completos de {players_per_team}. '
                f'Atualmente há {num_players}.'
            )

        usable_count = num_full_teams * players_per_team

        last_organized = booking.get('organized_teams', {}) or {}
        previous_signature = None
        previous_teams = last_organized.get('teams')
        if isinstance(previous_teams, list) and previous_teams:
            previous_signature = self._teams_signature(previous_teams)

        max_attempts = 250
        best_candidate = None
        best_metric = None

        for _ in range(max_attempts):
            shuffled_players = players_with_skill[:]
            random.shuffle(shuffled_players)

            usable_players = shuffled_players[:usable_count]
            reserves_from_selection = shuffled_players[usable_count:]

            teams, team_skills = self._build_balanced_random_teams(
                usable_players,
                num_full_teams,
                players_per_team,
            )

            if any(len(team) == 0 for team in teams):
                continue

            candidate_signature = self._teams_signature(teams)
            is_repeated_draw = previous_signature is not None and candidate_signature == previous_signature
            balance_score = max(team_skills) - min(team_skills)

            # Prefer non-repeated draws first, then best balance score.
            metric = (1 if is_repeated_draw else 0, balance_score)

            if best_metric is None or metric < best_metric:
                best_metric = metric
                best_candidate = {
                    'teams': teams,
                    'team_skills': team_skills,
                    'reserves_from_selection': reserves_from_selection,
                }

                # Best-case metric found (different from previous and perfectly balanced).
                if metric == (0, 0):
                    break

        if not best_candidate:
            raise ValueError('Falha ao sortear times balanceados. Tente novamente.')

        teams = best_candidate['teams']
        team_skills = best_candidate['team_skills']
        reserves_from_selection = best_candidate['reserves_from_selection']

        # 1. Normaliza os reservas automáticos (os 6 que não foram selecionados)
        normalized_automatic_reserves: List[Dict[str, Any]] = []
        for player in automatic_reserves_data:
            player_id = player.get('id') or player.get('_id') or player
            skill = self._round_skill_for_draw(player.get('skill_level', 0)) if isinstance(player, dict) else 0.0
            normalized_automatic_reserves.append({'id': player_id, 'skill': skill})

        # 2. Combina os dois grupos de reservas
        final_reserves = normalized_automatic_reserves + reserves_from_selection

        organized_result = {
            "teams": teams,
            "team_skills_sum": team_skills,
            # Retorna a lista completa dos IDs dos reservas (os 6 + o que sobrou da seleção, se houver)
            "reserves": [str(p['id']) for p in final_reserves]
        }

        drawer_user = await self.user_repo.get_user_by_id(user_id)
        draw_entry = {
            "drawn_at": datetime.now(timezone.utc),
            "drawn_by_user_id": str(user_id),
            "drawn_by_name": drawer_user.get('name') if drawer_user else None,
            "players_per_team": players_per_team,
            "selected_player_ids": [str(pid) for pid in selected_player_ids] if selected_player_ids else None,
            "result": organized_result
        }

        # Salva snapshot atual + histórico acumulado dos sorteios
        await self.booking_repo.update_partial(
            booking_id,
            {
                "$set": {
                    "organized_teams": organized_result,
                    "updated_at": datetime.now(timezone.utc)
                },
                "$push": {
                    "organized_teams_history": draw_entry
                }
            }
        )
        
        return organized_result

    async def get_organized_teams_history(self, user_id: str, booking_id: str) -> List[dict]:
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise ValueError('Reserva não encontrada.')

        if not await self._can_manage_booking(booking, user_id):
            raise ValueError('Você não tem permissão para visualizar o histórico desta reserva.')

        return booking.get('organized_teams_history', [])

    async def clear_organized_teams(self, user_id: str, booking_id: str) -> Dict[str, Any]:
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise ValueError('Reserva não encontrada.')

        if not await self._can_manage_booking(booking, user_id):
            raise ValueError('Você não tem permissão para limpar o sorteio desta reserva.')

        await self.booking_repo.update_partial(
            booking_id,
            {
                "$unset": {
                    "organized_teams": "",
                },
                "$set": {
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )

        return {
            'status': 'organized_teams_cleared',
            'booking_id': booking_id,
        }

    async def accept_invite(self, user_id: str, invite_id: str) -> dict:
        invite = await self.invite_repo.get_invite_by_id(invite_id)
        if not invite:
            raise ValueError('Convite não encontrado.')

        if invite['user_id'] != user_id:
            raise ValueError('Você não tem permissão para interagir com este convite.')

        # if invite['status'] != 'pending':
        #     raise ValueError('Convite já foi aceito ou recusado.')

        booking = await self.booking_repo.get_by_id(invite['booking_id'])
        if not booking:
            raise ValueError('Reserva associada ao convite não encontrada.')

        if booking.get('status_list') is False:
            raise ValueError('Lista não está ativa')

        if any(str(p['id']) == str(user_id) for p in booking.get('players', [])):
            await self.invite_repo.update_invite_status(invite_id, 'accepted')
            return {'status': 'already_in_players', 'booking_id': booking['_id']}

        elif any(str(p['id']) == str(user_id) for p in booking.get('reserve_players', [])):
            await self.invite_repo.update_invite_status(invite_id, 'accepted')
            return {'status': 'already_in_reserve', 'booking_id': booking['_id']}

        if booking.get('associated_group_id') and self.group_repo:
            group = await self.group_repo.get_by_id(booking['associated_group_id'])
            if group and 'members' in group:
                for member in group['members']:
                    if str(member.get('id')) == str(user_id):
                        skill_level = member.get('skill_level', 0)
                        break

        if len(booking.get('players', [])) < booking.get('max_players', 0) or booking.get('max_players', 0) == 0:
            await self.booking_repo.add_player_to_booking(booking['_id'], user_id, skill_level)
            await self.invite_repo.update_invite_status(invite_id, 'accepted')
            return {'status': 'added_to_players', 'booking_id': booking['_id']}
        else:
            await self.booking_repo.add_reserve_player_to_booking(booking['_id'], user_id, skill_level)
            await self.invite_repo.update_invite_status(invite_id, 'accepted')
            return {'status': 'added_to_reserve', 'booking_id': booking['_id']}

    async def decline_invite(self, user_id: str, invite_id: str) -> dict:
        invite = await self.invite_repo.get_invite_by_id(invite_id)
        if not invite:
            raise ValueError('Convite não encontrado.')

        if invite['user_id'] != user_id:
            raise ValueError('Você não tem permissão para interagir com este convite.')
        
        if invite['status'] == 'accepted':
            booking = await self.booking_repo.get_by_id(invite['booking_id'])
            if not booking:
                raise ValueError('Reserva associada ao convite não encontrada.')

            if any(str(player['id']) == str(user_id) for player in booking.get('players', [])):
                await self.booking_repo.remove_player_from_booking(booking['_id'], user_id)
                reserve_players = booking.get('reserve_players', [])
                if reserve_players:
                    next_player_object = reserve_players[0]
                    await self.booking_repo.add_player_to_booking(booking['_id'], next_player_object['id'], next_player_object['skill_level'])
                    await self.booking_repo.remove_reserve_player_from_booking(booking['_id'], next_player_object['id'])
            elif any(str(player['id']) == str(user_id) for player in booking.get('reserve_players', [])):
                await self.booking_repo.remove_reserve_player_from_booking(booking['_id'], user_id)

        await self.invite_repo.update_invite_status(invite_id, 'declined')
        return {'status': 'declined', 'booking_id': invite['booking_id']}

    async def sync_group_member_to_bookings(self, group_id: str, member_id: str, action: Literal['add', 'remove']):
        if not self.group_repo or not self.invite_repo:
            print('Warning: GroupRepository or InviteRepository not available for sync_group_member_to_bookings.')
            return

        def _extract_member_ids(entries: List[Any]) -> set[str]:
            member_ids = set()
            for entry in entries or []:
                if isinstance(entry, dict):
                    entry_id = entry.get('id') or entry.get('_id')
                    if entry_id is not None:
                        member_ids.add(str(entry_id))
                else:
                    member_ids.add(str(entry))
            return member_ids

        bookings_associated = await self.booking_repo.get_bookings_by_associated_group(group_id)

        user = await self.user_repo.get_user_by_id(member_id)
        if not user:
            print(f'Warning: Member {member_id} not found during sync_group_member_to_bookings.')
            return

        for booking in bookings_associated:
            booking_id = str(booking['_id'])
            current_player_ids = _extract_member_ids(booking.get('players', []))
            current_reserve_player_ids = _extract_member_ids(booking.get('reserve_players', []))

            if action == 'add':
                if member_id not in current_player_ids and member_id not in current_reserve_player_ids:
                    should_notify = False
                    existing_invite = await self.invite_repo.get_invite_by_booking_and_user(booking_id, member_id)

                    if existing_invite:
                        if existing_invite.get('status') != 'pending':
                            await self.invite_repo.update_invite_status(existing_invite['_id'], 'pending')
                            should_notify = True
                    else:
                        invite_data = {
                            'booking_id': booking_id,
                            'user_id': member_id,
                            'status': 'pending'
                        }
                        await self.invite_repo.create_invite(invite_data)
                        should_notify = True

                    if should_notify and self.email_sender and user['is_placeholder'] is False:
                        try:
                            await self.email_sender.send_email(
                                template_name='booking_invite',
                                subject='Você foi convidado para um rachinha de grupo!',
                                recipients=[{
                                    'email': user['email'],
                                    'variables': {
                                        'name': user['name'].split(' ')[0],
                                        'booking_id': booking_id,
                                        'inviter_name': (await self.user_repo.get_user_by_id(booking['owner_id'])).get('name', 'O dono do grupo'),
                                        'court_name': (await self.court_repo.get_by_id(booking['court_id'])).get('name', 'Quadra') if self.court_repo else 'Quadra',
                                        'start_time': booking['start_time'].strftime('%d/%m/%Y %H:%M'),
                                        'end_time': booking['end_time'].strftime('%d/%m/%Y %H:%M')
                                    }
                                }]
                            )
                            print(f'Convite de booking de grupo enviado para {user["email"]}')
                        except Exception as e:
                            print(f'Erro ao enviar e-mail de convite de grupo para {user["email"]}: {e}')

            elif action == 'remove':
                if member_id in current_player_ids:
                    await self.booking_repo.remove_player_from_booking(booking_id, member_id)
                if member_id in current_reserve_player_ids:
                    await self.booking_repo.remove_reserve_player_from_booking(booking_id, member_id)
                
                invites_for_booking = await self.invite_repo.get_invites_for_booking(booking_id)
                for invite in invites_for_booking:
                    if invite['user_id'] == member_id and invite['status'] == 'pending':
                        await self.invite_repo.update_invite_status(invite['_id'], 'declined')
    
    async def list_user_invites(self, user_id: str) -> List[dict]:
        if not self.invite_repo:
            raise ValueError("InviteRepository not available.")
        return await self.invite_repo.list_invites_by_user(user_id)

    async def list_booking_invites(self, user_id: str, booking_id: str) -> List[dict]:
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise ValueError("Reserva não encontrada.")
        if not await self._can_manage_booking(booking, user_id):
            raise ValueError("Você não tem permissão para listar os convites desta reserva.")
        
        if not self.invite_repo:
            raise ValueError("InviteRepository not available.")
        return await self.invite_repo.get_invites_for_booking(booking_id)
    
    async def remove_player_from_booking(self, current_user_id: str, booking_id: str, user_id: str):
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise ValueError('Reserva não encontrada.')

        if not await self._can_manage_booking(booking, current_user_id):
            raise ValueError('Você não tem permissão para remover jogadores desta reserva.')

        is_in_players = any(str(p['id']) == str(user_id) for p in booking.get('players', []))
        is_in_reserves = any(str(p['id']) == str(user_id) for p in booking.get('reserve_players', []))

        if not is_in_players and not is_in_reserves:
            raise ValueError('Usuário não está na reserva.')

        if is_in_players:
            await self.booking_repo.remove_player_from_booking(booking_id, user_id)
            reserve_players = booking.get('reserve_players', [])
            if reserve_players:
                next_player_object = reserve_players[0] 
                await self.booking_repo.add_player_to_booking(booking_id, next_player_object['id'], next_player_object['skill_level'])
                await self.booking_repo.remove_reserve_player_from_booking(booking_id, next_player_object['id'])
            if self.invite_repo:
                existing_invite = await self.invite_repo.get_invite_by_booking_and_user(booking_id, user_id)
                if existing_invite:
                    await self.invite_repo.update_invite_status(existing_invite['_id'], 'declined')
        else:
            await self.booking_repo.remove_reserve_player_from_booking(booking_id, user_id)
            if self.invite_repo:
                existing_invite = await self.invite_repo.get_invite_by_booking_and_user(booking_id, user_id)
                if existing_invite:
                    await self.invite_repo.update_invite_status(existing_invite['_id'], 'declined')

        if self.notification_service:
            notification = NotificationCreate(
                user_id=user_id,
                notification_type="booking_removal",
                message="Você foi removido de uma reserva.",
                related_id=booking_id,
                link=f"/user/booking/{booking_id}"
            )
            await self.notification_service.create_and_send_notification(notification)
        return {'status': 'removido', 'booking_id': booking_id}
    
    async def update_player_skill_level(self, current_user_id: str, booking_id: str, player_id: str, skill_level: float):
        """
        Saves one admin's score for a player in a booking.
        - booking.players[].skill_level  = avg of all individual ratings stored in players[].ratings[]
        - group.members[].skill_level    = weighted avg of the player's 5 most recent group bookings
        """
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise ValueError('Reserva não encontrada.')

        confirmed_player_ids = [str(p.get('id')) for p in booking.get('players', [])]

        # Star ratings are managed by booking admins/owners.
        if not await self._can_manage_booking(booking, current_user_id):
            raise ValueError('Apenas administradores da reserva podem definir estrelas.')

        # Rated player must be in confirmed players list
        if player_id not in confirmed_player_ids:
            raise ValueError('Jogador avaliado não está na lista de confirmados.')

        if not 1 <= skill_level <= 5:
            raise ValueError('Skill level deve estar entre 1 e 5.')

        # 1. Upsert individual rating → get updated ratings list
        ratings = await self.booking_repo.upsert_player_rating(
            booking_id, player_id, current_user_id, skill_level
        )

        # 2. Recompute average and update booking player skill_level
        if ratings:
            values = []
            for rating in ratings:
                numeric_value = self._to_numeric_skill(rating.get('value', 0))
                if numeric_value is not None and numeric_value > 0:
                    values.append(numeric_value)
            avg_booking = round(sum(values) / len(values), 1) if values else 0.0
        else:
            avg_booking = float(skill_level)
        await self.booking_repo.update_player_skill_level(booking_id, player_id, avg_booking)

        # 3. Auto-update group member skill_level (weighted avg of last 5 bookings)
        group_id = str(booking.get('associated_group_id', ''))
        if group_id and self.group_repo:
            group_bookings = await self.booking_repo.list_bookings_by_associated_group(group_id)
            booking_skills = []
            for b in group_bookings:
                for p in b.get('players', []):
                    if str(p.get('id')) == player_id:
                        numeric_skill = self._to_numeric_skill(p.get('skill_level', 0))
                        if numeric_skill is not None and numeric_skill > 0:
                            booking_skills.append((self._parse_booking_datetime(b), numeric_skill))
                        break
            if booking_skills:
                booking_skills.sort(key=lambda item: item[0], reverse=True)
                recent_scores = [score for _, score in booking_skills]
                avg_group = self._weighted_recent_average(recent_scores, limit=5)
            else:
                avg_group = None

            if avg_group is not None:
                await self.group_repo.update_skill_level_with_history(
                    group_id=group_id,
                    member_id=player_id,
                    skill_level=avg_group,
                    booking_id=booking_id,
                    source='rating',
                    sample_size=len(values) if ratings else 1,
                )

        return {
            'status': 'skill_level_updated',
            'booking_id': booking_id,
            'player_id': player_id,
            'booking_avg': avg_booking,
        }

    async def submit_player_vote(self, current_user_id: str, booking_id: str, player_id: str, vote: int):
        """
        Registra voto (-1, 0, 1) para um jogador em um booking.
        Atualiza automaticamente group.members[].skill_level na escala 1..5.
        NÃO toca players[].skill_level (reservado para sorteio de times).
        """
        if vote not in (-1, 0, 1):
            raise ValueError('Voto deve ser -1, 0 ou 1.')

        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise ValueError('Reserva não encontrada.')

        # Janela de 48h após término
        now = datetime.now(timezone.utc)
        end_time = booking.get('end_time')
        if end_time and isinstance(end_time, str):
            end_time = datetime.fromisoformat(end_time)
        # Motor returns naive UTC datetimes by default — make aware for comparison
        if end_time and hasattr(end_time, 'tzinfo') and end_time.tzinfo is None:
            end_time = end_time.replace(tzinfo=timezone.utc)
        if not end_time or not (end_time < now < end_time + timedelta(hours=48)):
            raise ValueError('Fora da janela de avaliação (48h após término).')

        confirmed_ids = [str(p.get('id')) for p in booking.get('players', [])]

        # Rater deve estar nos confirmados
        if current_user_id not in confirmed_ids:
            raise ValueError('Apenas jogadores confirmados podem avaliar.')

        # Sem auto-avaliação
        if current_user_id == player_id:
            raise ValueError('Você não pode se auto-avaliar.')

        # Jogador avaliado deve ser confirmado
        if player_id not in confirmed_ids:
            raise ValueError('Jogador avaliado não está na lista de confirmados.')

        # Upsert vote
        votes = await self.booking_repo.upsert_player_vote(
            booking_id, player_id, current_user_id, vote
        )

        # Calcular score do booking para esse player
        if votes:
            avg = sum(v.get('vote', 0) for v in votes) / len(votes)
            score = self._vote_average_to_skill(avg)
        else:
            score = self._vote_average_to_skill(float(vote))

        # Auto-update group skill_level (weighted avg of last 5 bookings)
        group_id = str(booking.get('associated_group_id', ''))
        if group_id and group_id != 'None' and self.group_repo:
            group_bookings = await self.booking_repo.list_bookings_by_associated_group(group_id)
            booking_scores = []
            for b in group_bookings:
                for p in b.get('players', []):
                    if str(p.get('id')) == player_id:
                        p_votes = p.get('votes', [])
                        if p_votes:
                            p_avg = sum(v.get('vote', 0) for v in p_votes) / len(p_votes)
                            booking_scores.append((self._parse_booking_datetime(b), self._vote_average_to_skill(p_avg)))
                        break
            if booking_scores:
                booking_scores.sort(key=lambda item: item[0], reverse=True)
                recent_scores = [score for _, score in booking_scores]
                group_avg = self._weighted_recent_average(recent_scores, limit=5)
            else:
                group_avg = None

            if group_avg is not None:
                await self.group_repo.update_skill_level_with_history(
                    group_id=group_id,
                    member_id=player_id,
                    skill_level=group_avg,
                    booking_id=booking_id,
                    source='vote',
                    sample_size=len(votes),
                )

        return {
            'status': 'vote_registered',
            'booking_id': booking_id,
            'player_id': player_id,
            'vote_score': score,
            'total_votes': len(votes),
        }