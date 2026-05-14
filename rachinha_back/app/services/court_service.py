from app.domain.repositories.booking_repository import BookingRepository
from app.domain.repositories.court_repository import CourtRepository
from datetime import datetime, timedelta, timezone
import calendar

class CourtService:
    def __init__(self, court_repo: CourtRepository, booking_repo: BookingRepository):
        self.court_repo = court_repo
        self.booking_repo = booking_repo

    
    async def create_court(self, owner_id: str, data: dict, arena_id: str):
        data["owner_id"] = owner_id
        data["belong_arena"] = arena_id
        data["created_at"] = data.get("created_at", datetime.now(timezone.utc))
        data["updated_at"] = data.get("updated_at", datetime.now(timezone.utc))

        # Formatar os horários no formato HH:MM:SS
        if "available_hours" in data:
            for hour in data["available_hours"]:
                if "start_time" in hour and hasattr(hour["start_time"], "strftime"):
                    hour["start_time"] = hour["start_time"].strftime("%H:%M:%S")
                if "end_time" in hour and hasattr(hour["end_time"], "strftime"):
                    hour["end_time"] = hour["end_time"].strftime("%H:%M:%S")

        return await self.court_repo.create(data)
    
    async def edit_court(self, user_id: str, data: dict, court_id: str):
        data["updated_at"] = datetime.now(timezone.utc)
        
        # Formatar os horários no formato HH:MM:SS
        if "available_hours" in data and data["available_hours"]:
            for hour in data["available_hours"]:
                if "start_time" in hour and hasattr(hour["start_time"], "strftime"):
                    hour["start_time"] = hour["start_time"].strftime("%H:%M:%S")
                if "end_time" in hour and hasattr(hour["end_time"], "strftime"):
                    hour["end_time"] = hour["end_time"].strftime("%H:%M:%S")

        return await self.court_repo.update_partial(court_id, data)

    async def list_owner_courts(self, owner_id: str):
        return await self.court_repo.list_by_owner(owner_id)

    async def get_court_by_id(self, court_id: str):
        return await self.court_repo.get_by_id(court_id)
    
    async def delete_court(self, court_id: str):
        return await self.court_repo.delete(court_id)

    async def get_available_slots(self, court_id: str, search_date: datetime) -> list[str]:
        court = await self.court_repo.get_by_id(court_id)
        if not court:
            return []

        # Certifique-se de que search_date é um datetime com fuso horário
        if search_date.tzinfo is None:
            search_date = search_date.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        # Não trazer horários de dias passados
        if search_date.date() < now.date():
            return []

        day_of_week = calendar.day_name[search_date.weekday()].lower()
        
        # Obter horários de disponibilidade da quadra para o dia da semana
        available_court_hours = []
        for slot in court.get("available_hours", []):
            if slot["day_of_week"].lower() == day_of_week:
                try:
                    start_time_str = slot["start_time"]
                    end_time_str = slot["end_time"]
                    
                    # Garantir que os tempos estão no formato HH:MM:SS
                    if len(start_time_str) == 5: # HH:MM
                        start_time_str += ":00"
                    if len(end_time_str) == 5: # HH:MM
                        end_time_str += ":00"

                    start_time = datetime.strptime(start_time_str, "%H:%M:%S").time()
                    end_time = datetime.strptime(end_time_str, "%H:%M:%S").time()

                    available_court_hours.append((start_time, end_time))
                except ValueError:
                    continue

        if not available_court_hours:
            return []

        # Obter todas as reservas para a quadra e o dia específico
        bookings = await self.booking_repo.get_bookings_by_court_and_date(court_id, search_date.date())

        # Gerar todos os slots de 30 em 30 minutos
        all_possible_slots = []
        for start_court_time, end_court_time in available_court_hours:
            current_slot_start = datetime.combine(search_date.date(), start_court_time, tzinfo=timezone.utc)
            end_of_day_slot = datetime.combine(search_date.date(), end_court_time, tzinfo=timezone.utc)

            while current_slot_start + timedelta(minutes=30) <= end_of_day_slot:
                all_possible_slots.append(current_slot_start)
                current_slot_start += timedelta(minutes=30)
        
        available_slots_str = []
        for slot_start_dt in all_possible_slots:
            slot_end_dt = slot_start_dt + timedelta(minutes=30)

            # Se for o mesmo dia, remover slots dos horários que já passaram
            if search_date.date() == now.date() and slot_start_dt < now:
                continue

            is_booked = False
            for booking in bookings:
                booking_start = booking["start_time"].replace(tzinfo=timezone.utc)
                booking_end = booking["end_time"].replace(tzinfo=timezone.utc)

                if (slot_start_dt < booking_end and slot_end_dt > booking_start):
                    is_booked = True
                    break
            
            if not is_booked:
                available_slots_str.append(slot_start_dt.strftime("%H:%M"))

        return available_slots_str

    async def list_courts_by_arena(self, arena_id: str):
        return await self.court_repo.list_by_arena(arena_id)