from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from typing import List
from app.core.config import get_db
from app.core.security import get_current_user
from app.domain.repositories.feedback_repository import FeedbackRepository
from app.domain.repositories.user_repository import UserRepository
from app.interfaces.schemas.feedback import Feedback
from app.services.feedback_service import FeedbackService 

router = APIRouter(prefix="/feedback", tags=["Feedback"])

def get_feedback_service(db=Depends(get_db)) -> FeedbackService:
    repo = FeedbackRepository(db)
    return FeedbackService(feed_repo=repo)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    feedback: Feedback,
    user=Depends(get_current_user),
    service: FeedbackService = Depends(get_feedback_service)
):
    feedback_id = await service.submit_feedback(feedback, user)
    return {"detail": "Feedback enviado com sucesso!", "id": feedback_id}