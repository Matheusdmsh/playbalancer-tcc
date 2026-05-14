from datetime import datetime, timezone
from pydantic import BaseModel

from app.domain.repositories.feedback_repository import FeedbackRepository



class FeedbackService:
    def __init__(self, feed_repo: FeedbackRepository):
        self.feed_repo = feed_repo

    async def submit_feedback(self, feedback: BaseModel, user: dict) -> str:
        feedback_data = {
            "title": feedback.title,
            "description": feedback.description,
            "type": feedback.type,
            "user_id": str(user["_id"]),
            "created_at": datetime.now(timezone.utc)
        }
        feedback_id = await self.feed_repo.create_feedback(feedback_data)
        return str(feedback_id)