from bson import ObjectId


class AccessRepository:
    def __init__(self, db):
        self.collection = db["accesses"]

    async def log_access(self, data: dict):
        await self.collection.insert_one(data)

    async def count_all_access_logs(self) -> int:
        """Conta o número total de logs de acesso."""
        return await self.collection.count_documents({})

    async def get_all_access_logs(self) -> list:
        """Busca todos os logs de acesso, serializando os ObjectIds."""
        logs = await self.collection.find({}).sort("login_time", -1).to_list(length=None)
        for log in logs:
            # Converte ObjectId para string
            log["_id"] = str(log["_id"])
            if log.get("user_id") and isinstance(log.get("user_id"), ObjectId):
                log["user_id"] = str(log["user_id"])
        return logs