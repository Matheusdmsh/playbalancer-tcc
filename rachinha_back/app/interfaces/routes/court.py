from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from app.domain.repositories.booking_repository import BookingRepository
from app.interfaces.schemas.court import CourtCreate , CourtUpdate
from app.core.security import get_current_user, get_current_user_optional
from app.domain.repositories.court_repository import CourtRepository
from app.services.court_service import CourtService
from app.services.arena_service import ArenaService
from app.domain.repositories.arena_repository import ArenaRepository
from app.services.storage_service import StorageService
from typing import Optional

from app.core.config import get_db



router = APIRouter(prefix="/courts", tags=["Courts"])

@router.post("/create")
async def create_court(court: CourtCreate, db=Depends(get_db), user=Depends(get_current_user)):
    if 'admin' not in user["role"]:
        raise HTTPException(status_code=403, detail="Apenas administradores podem criar quadras")
    service = CourtService(
    CourtRepository(db),
    BookingRepository(db)
)
    arena_service = ArenaService(ArenaRepository(db))
    arena = await arena_service.get_arena_by_id(court.belong_arena)
    if not arena:
        raise HTTPException(status_code=404, detail="Arena não encontrada")
    court_id = await service.create_court(user["_id"], court.dict(), arena["_id"])
    return {"id": court_id}

@router.get("/mycourts")
async def list_my_courts(db=Depends(get_db), user=Depends(get_current_user)):
    if 'admin' not in user["role"]:
        raise HTTPException(status_code=403, detail="Apenas administradores podem listar quadras")
    service = CourtService(CourtRepository(db))
    return await service.list_owner_courts(user["_id"])


@router.delete("/delete/{court_id}")
async def delete_court(court_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    if 'admin' not in user["role"]:
        raise HTTPException(status_code=403, detail="Apenas administradores podem deletar quadras")
    service = CourtService(CourtRepository(db))
    result = await service.delete_court(court_id)
    if not result:
        raise HTTPException(status_code=404, detail="Quadra não encontrada")
    return {"detail": "Quadra deletada com sucesso"}

@router.get("/public/list")
async def list_all_courts(
    sport: Optional[str] = Query(None, description="Filtrar por esporte"),
    date_filter: Optional[date] = Query(None, alias="date", description="Filtrar por data disponível"),
    location: Optional[str] = Query(None, description="Filtrar por localização (Onde)"),
    time_filter: Optional[str] = Query(None, alias="time", description="Filtrar por horário de check-in"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db=Depends(get_db)
):
    """Lista todas as quadras públicas com filtros opcionais combinados."""
    court_repo = CourtRepository(db)
    booking_repo = BookingRepository(db)
    arena_repo = ArenaRepository(db)
    service = CourtService(court_repo, booking_repo)
    
    all_courts = await court_repo.get_all_courts()

    # Filtra as quadras por localização buscando nas arenas
    if location:
        loc_lower = location.lower()
        all_arenas = await arena_repo.get_all_arenas()
        valid_arena_ids = set()
        
        for a in all_arenas:
            name_match = a.get("name") and loc_lower in a.get("name").lower()
            loc_data = a.get("location", {})
            city_match = loc_data.get("city") and loc_lower in loc_data.get("city").lower()
            street_match = loc_data.get("street") and loc_lower in loc_data.get("street").lower()
            
            if name_match or city_match or street_match:
                valid_arena_ids.add(a.get("_id"))
                
        all_courts = [c for c in all_courts if c.get("belong_arena") in valid_arena_ids]
    
    # Filtra por esporte
    if sport:
        all_courts = [c for c in all_courts if sport.lower() in [s.lower() for s in c.get('sports_supported', [])]]
    
    # Filtra por disponibilidade de data (+ tempo, se especificado)
    if date_filter:
        filtered = []
        for court in all_courts:
            if court.get('is_active', True):
                slots = await service.get_available_slots(
                    court['_id'],
                    datetime.combine(date_filter, datetime.min.time(), tzinfo=timezone.utc)
                )
                if slots:
                    if time_filter:
                        # Considera válido se ao menos um slot iniciar ou cruzar com o tempo exigido
                        slots_match = [s for s in slots if s.get("start_time", "").startswith(time_filter)]
                        if not slots_match:
                            continue # Pula esta quadra se ela não tiver o slot na hora pedida
                    
                    court['available_slots_count'] = len(slots)
                    filtered.append(court)
        all_courts = filtered
    
    # Filtra apenas quadras ativas (último check de segurança visual)
    all_courts = [c for c in all_courts if c.get('is_active', True)]
    
    # Paginação
    total = len(all_courts)
    start = (page - 1) * limit
    end = start + limit
    courts_page = all_courts[start:end]
    
    return {"courts": courts_page, "total": total, "page": page, "limit": limit}

@router.get("/public/{court_id}")
async def get_court_public(court_id: str, db=Depends(get_db)):
    """Retorna detalhes de uma quadra pública sem autenticação."""
    service = CourtService(CourtRepository(db), BookingRepository(db))
    court = await service.get_court_by_id(court_id)
    if not court:
        raise HTTPException(status_code=404, detail="Quadra não encontrada")
    return court

@router.get("/{court_id}")
async def get_court(court_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    service = CourtService(CourtRepository(db), BookingRepository(db))
    court = await service.get_court_by_id(court_id)
    if not court:
        raise HTTPException(status_code=404, detail="Quadra não encontrada")
    return court

@router.put("/edit/{court_id}")
async def edit_court(court_id: str, court: CourtUpdate, db=Depends(get_db), user=Depends(get_current_user)):
    if 'admin' not in user["role"]:
        raise HTTPException(status_code=403, detail="Apenas administradores podem editar quadras")
    service = CourtService(CourtRepository(db), BookingRepository(db))
    result = await service.edit_court(user["_id"], court.dict(exclude_unset=True), court_id)
    if not result:
        raise HTTPException(status_code=404, detail="Quadra não encontrada")
    
    return {"detail": "Quadra editada com sucesso"}


@router.get("/{court_id}/available-slots")
async def get_court_available_slots(
    court_id: str, 
    search_date: date = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    db=Depends(get_db), 
):    
    service = CourtService(CourtRepository(db), BookingRepository(db))
    
    # Convert search_date to datetime with timezone awareness for consistency
    # Assuming UTC for all datetime objects stored in the database
    search_datetime = datetime.combine(search_date, datetime.min.time(), tzinfo=timezone.utc)

    available_slots = await service.get_available_slots(court_id, search_datetime)
    
    if not available_slots:
        # If the court is not found or no slots are available for the day
        court = await service.get_court_by_id(court_id)
        if not court:
            raise HTTPException(status_code=404, detail="Quadra não encontrada.")
        else:
            return {"detail": "Nenhum horário disponível para esta quadra nesta data.", "available_slots": []}

    return {"court_id": court_id, "date": search_date.isoformat(), "available_slots": available_slots}

@router.get("/listCourtsByArena/{arena_id}")
async def list_courts_by_arena(arena_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    if 'admin' not in user["role"]:
        raise HTTPException(status_code=403, detail="Apenas administradores podem listar quadras")
    service = CourtService(
    CourtRepository(db),
    BookingRepository(db)
)
    return await service.list_courts_by_arena(arena_id)

@router.post("/upload-photo/{court_id}")
async def upload_court_photo(
    court_id: str,
    file: UploadFile = File(...),
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """Upload de foto de uma quadra."""
    if 'admin' not in user["role"]:
        raise HTTPException(status_code=403, detail="Apenas administradores podem fazer upload de fotos")
    
    court_repo = CourtRepository(db)
    court = await court_repo.get_by_id(court_id)
    if not court:
        raise HTTPException(status_code=404, detail="Quadra não encontrada")
    
    storage = StorageService()
    try:
        content = await file.read()
        import time
        unique_name = f"court_{court_id}_{int(time.time())}"
        url = await storage.upload_file(content, file.filename, file.content_type, unique_name)
        
        current_photos = court.get('photos_url', [])
        current_photos.append(url)
        await court_repo.update_partial(court_id, {'photos_url': current_photos})
        
        return {"url": url, "photos_url": current_photos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao enviar arquivo: {str(e)}")

@router.delete("/delete-photo/{court_id}")
async def delete_court_photo(
    court_id: str,
    photo_url: str = Query(..., description="URL da foto a ser removida"),
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """Remove uma foto de uma quadra."""
    if 'admin' not in user["role"]:
        raise HTTPException(status_code=403, detail="Apenas administradores podem remover fotos")
    
    court_repo = CourtRepository(db)
    court = await court_repo.get_by_id(court_id)
    if not court:
        raise HTTPException(status_code=404, detail="Quadra não encontrada")
    
    current_photos = court.get('photos_url', [])
    updated_photos = [p for p in current_photos if p != photo_url]
    await court_repo.update_partial(court_id, {'photos_url': updated_photos})
    
    return {"photos_url": updated_photos}