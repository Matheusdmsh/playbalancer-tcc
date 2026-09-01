from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import get_db
from app.core.security import get_current_user
from app.domain.repositories.notification_repository import NotificationRepository

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def repository(db=Depends(get_db)):
    return NotificationRepository(db)

@router.get("/my")
async def list_notifications(user=Depends(get_current_user), repo=Depends(repository)):
    return await repo.get_by_user(user["_id"])

@router.get("/unread/count")
async def unread_count(user=Depends(get_current_user), repo=Depends(repository)):
    return {"unread_count": await repo.get_unread_count(user["_id"])}

@router.post("/read/all")
async def read_all(user=Depends(get_current_user), repo=Depends(repository)):
    count = await repo.mark_all_as_read(user["_id"])
    return {"message": f"{count} notificações marcadas como lidas."}

@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def read_one(notification_id: str, user=Depends(get_current_user), repo=Depends(repository)):
    if not await repo.mark_as_read(notification_id, user["_id"]):
        raise HTTPException(status_code=404, detail="Notificação não encontrada.")
