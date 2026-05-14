from app.domain.repositories.beta_tester_repository import BetaTesterRepository


class BetaTesterService:
    def __init__(self, repository: BetaTesterRepository):
        self.repository = repository

    async def collect_email(self, email: str):
        await self.repository.create(email)

    async def get_all_emails(self):
        return await self.repository.get_all()
