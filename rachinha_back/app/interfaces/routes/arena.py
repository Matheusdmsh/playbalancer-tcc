from fastapi import APIRouter, Depends, HTTPException
from app.interfaces.schemas.arena import ArenaCreate, ArenaUpdate
from app.core.security import get_current_user
from app.domain.repositories.arena_repository import ArenaRepository
from app.services.arena_service import ArenaService

from app.core.config import get_db
from typing import List

router = APIRouter(prefix="/arenas", tags=["Arenas"])

@router.get("/public/{arena_id}")
async def get_arena_public(arena_id: str, db=Depends(get_db)):
    """Retorna dados básicos de uma arena de forma pública (para exibição na página da quadra)."""
    repo = ArenaRepository(db)
    arena = await repo.get_arena_by_id(arena_id)
    if not arena:
        raise HTTPException(status_code=404, detail="Arena não encontrada")
    return arena


@router.post("/create")
async def create_arena(arena: ArenaCreate, db=Depends(get_db), user=Depends(get_current_user)):
    if 'admin' not in user["role"]:
        raise HTTPException(status_code=403, detail="Apenas administradores podem criar arenas")
    service = ArenaService(ArenaRepository(db))
    arena_id = await service.create_arena(user["_id"], arena.dict())
    return {"id": arena_id}

@router.get("/myarenas")
async def list_my_arenas(db=Depends(get_db), user=Depends(get_current_user)):
    if 'admin' not in user["role"]:
        raise HTTPException(status_code=403, detail="Apenas administradores podem listar arenas")
    service = ArenaService(ArenaRepository(db))
    return await service.list_owner_arenas(user["_id"])

@router.delete("/delete/{arena_id}")
async def delete_arena(arena_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    if 'admin' not in user["role"]:
        raise HTTPException(status_code=403, detail="Apenas administradores podem deletar arenas")
    service = ArenaService(ArenaRepository(db))
    result = await service.delete_arena(arena_id)
    if not result:
        raise HTTPException(status_code=404, detail="Arena não encontrada")
    return {"detail": "Arena deletada com sucesso"}

@router.get("/{arena_id}")
async def get_arena(arena_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    if 'admin' not in user["role"]:
        raise HTTPException(status_code=403, detail="Apenas administradores podem listar arenas")
    service = ArenaService(ArenaRepository(db))
    arena = await service.get_arena_by_id(arena_id)
    if not arena:
        raise HTTPException(status_code=404, detail="Arena não encontrada")
    return arena


@router.put("/edit/{arena_id}")
async def edit_arena(arena_id: str, arena: ArenaUpdate, db=Depends(get_db), user=Depends(get_current_user)):
    if 'admin' not in user["role"]:
        raise HTTPException(status_code=403, detail="Apenas administradores podem editar arenas")
    service = ArenaService(ArenaRepository(db))
    result = await service.edit_arena(arena_id, arena.dict(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Arena não encontrada")
    
    return {"detail": "Arena editada com sucesso"}
