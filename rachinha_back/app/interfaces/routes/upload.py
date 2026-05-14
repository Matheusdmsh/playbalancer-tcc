from fastapi import APIRouter, Depends, HTTPException, UploadFile, status, File
from app.core.security import get_current_user
from app.services.storage_service import StorageService
from app.core.config import get_settings
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.group_repository import GroupRepository
from app.domain.repositories.arena_repository import ArenaRepository
from app.core.config import get_db

router = APIRouter(prefix="/upload", tags=["Upload"])
settings = get_settings()

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
MAX_FILE_SIZE_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024

def validate_image(file: UploadFile):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Tipo de arquivo inválido. Permitidos: {', '.join(ALLOWED_EXTENSIONS)}")
    
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail=f"O arquivo é muito grande. Tamanho máximo: {settings.MAX_FILE_SIZE_MB}MB.")
    return ext

@router.post("/user-photo", status_code=status.HTTP_200_OK)
async def upload_user_photo(
    file: UploadFile = File(...),
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    validate_image(file)
    user_id = str(current_user["_id"])
    new_name = f"user_{user_id}"
    
    storage = StorageService()
    try:
        content = await file.read()
        url = await storage.upload_file(content, file.filename, file.content_type, new_name)
        
        # Save to DB
        repo = UserRepository(db)
        await repo.update_user(user_id, {"photo_url": url})
        
        return {"detail": "Foto atualizada com sucesso.", "url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao enviar arquivo: {str(e)}")

@router.post("/group-photo/{group_id}", status_code=status.HTTP_200_OK)
async def upload_group_photo(
    group_id: str,
    file: UploadFile = File(...),
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    validate_image(file)
    
    repo = GroupRepository(db)
    group = await repo.find_by_id(group_id)
    if not group:
         raise HTTPException(status_code=404, detail="Turma não encontrada.")
    if group["owner_id"] != current_user["_id"] and current_user["_id"] not in group.get("admin_ids", []):
         raise HTTPException(status_code=403, detail="Sem permissão.")
    
    new_name = f"group_{group_id}"
    storage = StorageService()
    try:
        content = await file.read()
        url = await storage.upload_file(content, file.filename, file.content_type, new_name)
        
        await repo.update_group(group_id, {"photo_url": url})
        return {"detail": "Foto da turma atualizada com sucesso.", "url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao enviar arquivo: {str(e)}")

@router.post("/arena-photo/{arena_id}", status_code=status.HTTP_200_OK)
async def upload_arena_photo(
    arena_id: str,
    file: UploadFile = File(...),
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    validate_image(file)
    repo = ArenaRepository(db)
    arena = await repo.get_arena_by_id(arena_id)
    if not arena:
        raise HTTPException(status_code=404, detail="Arena não encontrada.")
    
    new_name = f"arena_{arena_id}"
    storage = StorageService()
    try:
        content = await file.read()
        url = await storage.upload_file(content, file.filename, file.content_type, new_name)
        
        await repo.update_arena(arena_id, {"photo_url": url})
        return {"detail": "Foto da arena atualizada.", "url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao enviar arquivo: {str(e)}")

@router.post("/image", status_code=status.HTTP_200_OK)
async def upload_image(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Faz o upload livre de uma imagem pro storage e retorna o link gerado (usado para formulários)."""
    validate_image(file)
    import time
    new_name = f"img_{int(time.time())}"
    storage = StorageService()
    try:
        content = await file.read()
        url = await storage.upload_file(content, file.filename, file.content_type, new_name)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao enviar arquivo: {str(e)}")
