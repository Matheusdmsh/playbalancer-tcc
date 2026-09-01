from typing import List, Optional

from app.domain.repositories.transaction_repository import TransactionRepository
from app.domain.repositories.group_repository import GroupRepository
from app.domain.repositories.user_repository import UserRepository
from app.interfaces.schemas.transaction import TransactionCreate, TransactionInDB, TransactionUpdate
from app.domain.repositories.exceptions import NotFoundException, UnauthorizedException


class TransactionService:
    def __init__(self,
                 transaction_repository: TransactionRepository,
                 group_repository: GroupRepository,
                 user_repository: UserRepository):
        self.transaction_repository = transaction_repository
        self.group_repository = group_repository
        self.user_repository = user_repository
    
    def is_group_admin(self, user_id: str, group: dict) -> bool:
        """Verifica se o usuário é admin do grupo (owner ou está na lista de admins)."""
        if not group:
            return False
        # Owner sempre é admin
        if str(group.get('owner_id')) == str(user_id):
            return True
        # Verificar se está na lista de admins
        admins = group.get('admins', [])
        return str(user_id) in [str(admin_id) for admin_id in admins]
        
    async def create_transaction(self, transaction_data: TransactionCreate, current_user_id: str) -> TransactionInDB:
        # Validate if group exists
        group = await self.group_repository.get_by_id(transaction_data.group_id) # Returns a dict
        if not group:
            raise NotFoundException(f"Group with ID {transaction_data.group_id} not found.")

        # Validate if the user is a member of the group using member_ids from the dict
        member_ids = [member["id"] for member in group.get("members", [])]
        if current_user_id not in member_ids:
            raise UnauthorizedException("User is not a member of this group and cannot add transactions.")

        transaction_data.user_id = current_user_id

        return await self.transaction_repository.create_transaction(transaction_data)

    async def get_transaction(self, transaction_id: str, current_user_id: str) -> Optional[TransactionInDB]:
        transaction = await self.transaction_repository.get_transaction_by_id(transaction_id)
        if not transaction:
            return None

        # Check if the user is a member of the group associated with the transaction
        group = await self.group_repository.get_by_id(transaction.group_id) # Returns a dict
        if not group:
            raise NotFoundException(f"Group with ID {transaction.group_id} not found for transaction.")

        member_ids = [member["id"] for member in group.get("members", [])]
        if current_user_id not in member_ids:
            raise UnauthorizedException("User is not authorized to view this transaction.")
        
        return transaction

    async def get_transactions_for_group(self, group_id: str, current_user_id: str) -> List[TransactionInDB]:
        group = await self.group_repository.get_by_id(group_id) # Returns a dict
        if not group:
            raise NotFoundException(f"Group with ID {group_id} not found.")

        member_ids = [member["id"] for member in group.get("members", [])]
        if current_user_id not in member_ids:
            raise UnauthorizedException("User is not authorized to view transactions for this group.")

        return await self.transaction_repository.get_transactions_by_group_id(group_id)

    async def update_transaction(self, transaction_id: str, transaction_data: TransactionUpdate, current_user_id: str) -> Optional[TransactionInDB]:
        transaction = await self.transaction_repository.get_transaction_by_id(transaction_id)
        if not transaction:
            raise NotFoundException(f"Transaction with ID {transaction_id} not found.")

        group = await self.group_repository.get_by_id(transaction.group_id)
        if not group:
            raise NotFoundException(f"Group with ID {transaction.group_id} not found for transaction.")

        is_admin = self.is_group_admin(current_user_id, group)

        if str(transaction.user_id) != current_user_id and not is_admin:
            raise UnauthorizedException("User is not authorized to update this transaction.")

        # The TransactionUpdate schema does not contain group_id or user_id,
        # so no need to pop them from transaction_data.

        return await self.transaction_repository.update_transaction(transaction_id, transaction_data)

    async def delete_transaction(self, transaction_id: str, current_user_id: str) -> bool:
        transaction = await self.transaction_repository.get_transaction_by_id(transaction_id)
        if not transaction:
            raise NotFoundException(f"Transaction with ID {transaction_id} not found.")

        # Only the user who created the transaction or a group admin can delete it
        group = await self.group_repository.get_by_id(transaction.group_id) # Returns a dict
        if not group:
            raise NotFoundException(f"Group with ID {transaction.group_id} not found for transaction.")

        # Check if current_user is a group admin
        is_admin = self.is_group_admin(current_user_id, group)

        if str(transaction.user_id) != current_user_id and not is_admin:
            raise UnauthorizedException("User is not authorized to delete this transaction.")

        return await self.transaction_repository.delete_transaction(transaction_id)

    async def get_group_balance(self, group_id: str, current_user_id: str) -> dict:
        group = await self.group_repository.get_by_id(group_id) # Returns a dict
        if not group:
            raise NotFoundException(f"Group with ID {group_id} not found.")

        member_ids = [member["id"] for member in group.get("members", [])]
        if current_user_id not in member_ids:
            raise UnauthorizedException("User is not authorized to view the balance for this group.")

        transactions = await self.transaction_repository.get_transactions_by_group_id(group_id)

        total_revenue = sum(t.amount for t in transactions if t.type == "revenue")
        total_expense = sum(t.amount for t in transactions if t.type == "expense")
        balance = total_revenue - total_expense

        return {
            "group_id": group_id,
            "total_revenue": total_revenue,
            "total_expense": total_expense,
            "balance": balance
        }