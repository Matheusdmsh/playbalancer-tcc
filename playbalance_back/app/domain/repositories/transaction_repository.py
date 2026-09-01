from datetime import datetime, timezone
from typing import List, Optional
from pymongo.database import Database
from bson import ObjectId
from app.interfaces.schemas.transaction import TransactionCreate, TransactionInDB, TransactionUpdate


class TransactionRepository:
    def __init__(self, database: Database):
        self.collection = database["transactions"]

    def serialize_transaction(self, transaction: dict) -> dict:
        """Converts ObjectId fields to string for Pydantic compatibility."""
        if "_id" in transaction and isinstance(transaction["_id"], ObjectId):
            transaction["_id"] = str(transaction["_id"])
        # Ensure user_id and group_id are strings if they are fetched as ObjectId
        if "user_id" in transaction and isinstance(transaction["user_id"], ObjectId):
            transaction["user_id"] = str(transaction["user_id"])
        if "group_id" in transaction and isinstance(transaction["group_id"], ObjectId):
            transaction["group_id"] = str(transaction["group_id"])
        return transaction

    async def create_transaction(self, transaction: TransactionCreate) -> TransactionInDB:
        transaction_dict = transaction.model_dump(by_alias=True, exclude_unset=True)
        # Convert user_id and group_id from string to ObjectId for storage in MongoDB
        # This assumes your MongoDB stores these as ObjectId. If they are plain strings, remove this conversion.
        transaction_dict['group_id'] = ObjectId(transaction_dict['group_id'])
        transaction_dict['user_id'] = ObjectId(transaction_dict['user_id'])
        transaction_dict['created_at'] = datetime.now(timezone.utc)
        transaction_dict['updated_at'] = datetime.now(timezone.utc)

        result = await self.collection.insert_one(transaction_dict)
        created_transaction_doc = await self.collection.find_one({"_id": result.inserted_id})
        return TransactionInDB(**self.serialize_transaction(created_transaction_doc))

    async def get_transaction_by_id(self, transaction_id: str) -> Optional[TransactionInDB]:
        try:
            transaction_obj_id = ObjectId(transaction_id)
        except Exception:
            return None
        transaction_doc = await self.collection.find_one({"_id": transaction_obj_id})
        if transaction_doc:
            return TransactionInDB(**self.serialize_transaction(transaction_doc))
        return None

    async def get_transactions_by_group_id(self, group_id: str) -> List[TransactionInDB]:
        transactions = []
        group_obj_id = ObjectId(group_id)
        async for transaction_doc in self.collection.find({"group_id": group_obj_id}).sort("date", -1):
            transactions.append(TransactionInDB(**self.serialize_transaction(transaction_doc)))
        return transactions

    async def update_transaction(self, transaction_id: str, transaction_data: TransactionUpdate) -> Optional[TransactionInDB]:
        try:
            transaction_obj_id = ObjectId(transaction_id)
        except Exception:
            return None
        

        # Convert TransactionUpdate Pydantic model to a dict, excluding unset fields
        update_data = transaction_data.model_dump(exclude_unset=True)
        update_data['updated_at'] = datetime.now(timezone.utc)

        # No need to handle group_id or user_id here as they are not in TransactionUpdate schema

        await self.collection.update_one(
            {"_id": transaction_obj_id},
            {"$set": update_data}
        )
        updated_transaction_doc = await self.collection.find_one({"_id": transaction_obj_id})
        if updated_transaction_doc:
            return TransactionInDB(**self.serialize_transaction(updated_transaction_doc))
        return None

    async def delete_transaction(self, transaction_id: str) -> bool:
        try:
            transaction_obj_id = ObjectId(transaction_id)
        except Exception:
            return False
        result = await self.collection.delete_one({"_id": transaction_obj_id})
        return result.deleted_count > 0
    
    async def count_all_transactions(self) -> int:
        """Conta o número total de transações."""
        return await self.collection.count_documents({})

    async def get_all_transactions(self) -> list:
        """Busca todas as transações, garantindo a serialização."""
        transactions_cursor = self.collection.find({}).sort("created_at", -1)
        transactions_list = await transactions_cursor.to_list(length=None)
        
        # Reutiliza sua função de serialização existente
        return [self.serialize_transaction(t) for t in transactions_list]