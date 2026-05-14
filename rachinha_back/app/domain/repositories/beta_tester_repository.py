from motor.motor_asyncio import AsyncIOMotorDatabase

class BetaTesterRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["beta_testers"]

    async def create(self, email: str):
        await self.collection.insert_one({"email": email})

    async def get_all(self):
        docs = await self.collection.find().to_list()
        return [{"id": str(doc["_id"]), "email": doc["email"]} for doc in docs]
