from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Any, Dict, List, Optional
from bson import ObjectId
from datetime import datetime, timezone

class GroupMessageRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["group_messages"]

    async def get_last_message_for_each_group(self, group_ids: List[str]) -> Dict[str, Any]:
        """
        Busca a última mensagem para uma lista de IDs de turmas usando um pipeline de agregação.
        Retorna um dicionário mapeando group_id para os detalhes da última mensagem.
        """
        if not group_ids:
            return {}

        # Converte a lista de strings de IDs para uma lista de ObjectIds para a consulta
        object_ids = [ObjectId(gid) for gid in group_ids]

        pipeline = [
            # 1. Filtra apenas as mensagens das turmas especificadas
            {
                '$match': {
                    'group_id': {'$in': object_ids}
                }
            },
            # 2. Ordena as mensagens de cada turma pela data, da mais nova para a mais antiga
            {
                '$sort': {
                    'timestamp': -1
                }
            },
            # 3. Agrupa pelo ID da turma e pega a primeira mensagem (que é a mais recente)
            {
                '$group': {
                    '_id': '$group_id',
                    'last_message': {'$first': '$$ROOT'}
                }
            }
        ]

        cursor = self.collection.aggregate(pipeline)
        results = await cursor.to_list(length=None)

        # Formata o resultado em um dicionário para fácil acesso no frontend
        last_messages_map = {}
        for result in results:
            group_id_str = str(result['_id'])
            message_doc = result['last_message']
            
            # Serializa os campos ObjectId para string
            message_doc['_id'] = str(message_doc['_id'])
            message_doc['group_id'] = str(message_doc['group_id'])
            message_doc['sender_id'] = str(message_doc['sender_id'])
            
            last_messages_map[group_id_str] = message_doc

        return last_messages_map

    async def create_message(self, message_data: dict) -> str:
        message_data["timestamp"] = datetime.now(timezone.utc)
        if 'group_id' in message_data and isinstance(message_data['group_id'], str):
            message_data['group_id'] = ObjectId(message_data['group_id'])
        if 'sender_id' in message_data and isinstance(message_data['sender_id'], str):
            message_data['sender_id'] = ObjectId(message_data['sender_id'])
        result = await self.collection.insert_one(message_data)
        return str(result.inserted_id)

    async def get_messages_by_group_id(self, group_id: str, skip: int = 0, limit: int = 50) -> List[dict]:
        try:
            group_obj_id = ObjectId(group_id)
        except Exception:
            return []
        
        messages = await self.collection.find({"group_id": group_obj_id}).sort("timestamp", -1).skip(skip).limit(limit).to_list(length=limit)
        messages.reverse()

        for msg in messages:
            msg["_id"] = str(msg["_id"])
            if "sender_id" in msg and isinstance(msg["sender_id"], ObjectId):
                msg["sender_id"] = str(msg["sender_id"])
            if "group_id" in msg and isinstance(msg["group_id"], ObjectId):
                msg["group_id"] = str(msg["group_id"])
        return messages