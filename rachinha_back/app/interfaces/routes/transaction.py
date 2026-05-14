from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pymongo.database import Database
from app.interfaces.schemas.transaction import TransactionCreate, TransactionInDB, TransactionUpdate
from app.services.transaction_service import TransactionService
from app.domain.repositories.transaction_repository import TransactionRepository
from app.domain.repositories.group_repository import GroupRepository
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.exceptions import NotFoundException, UnauthorizedException, DuplicationException
from app.interfaces.schemas.user import UserInDB
from app.core.security import get_current_user
from app.core.config import get_db

router = APIRouter(prefix='/transactions', tags=['Transactions'])

def get_transaction_service(db: Database = Depends(get_db)) -> TransactionService:
    transaction_repo = TransactionRepository(db)
    group_repo = GroupRepository(db)
    user_repo = UserRepository(db)
    return TransactionService(transaction_repo, group_repo, user_repo)

@router.post("/", response_model=TransactionInDB, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: UserInDB = Depends(get_current_user),
    transaction_service: TransactionService = Depends(get_transaction_service)
):
    try:
        return await transaction_service.create_transaction(transaction, str(current_user.get('_id')))
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create transaction: {e}")


@router.get("/{transaction_id}", response_model=TransactionInDB)
async def get_transaction(
    transaction_id: str,
    current_user: UserInDB = Depends(get_current_user),
    transaction_service: TransactionService = Depends(get_transaction_service)
):
    try:
        transaction = await transaction_service.get_transaction(transaction_id, str(current_user.get('_id')))
        if not transaction:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
        return transaction
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve transaction: {e}")


@router.get("/groups/{group_id}", response_model=List[TransactionInDB])
async def get_transactions_for_group(
    group_id: str,
    current_user: UserInDB = Depends(get_current_user),
    transaction_service: TransactionService = Depends(get_transaction_service)
):
    try:
        return await transaction_service.get_transactions_for_group(group_id, str(current_user.get('_id')))
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve group transactions: {e}")


@router.put("/{transaction_id}", response_model=TransactionInDB)
async def update_transaction(
    transaction_id: str,
    transaction_data: TransactionUpdate,
    current_user: UserInDB = Depends(get_current_user),
    transaction_service: TransactionService = Depends(get_transaction_service)
):
    try:
        updated_transaction = await transaction_service.update_transaction(transaction_id, transaction_data, str(current_user.get('_id')))
        if not updated_transaction:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found or could not be updated")
        return updated_transaction
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update transaction: {e}")


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    current_user: UserInDB = Depends(get_current_user),
    transaction_service: TransactionService = Depends(get_transaction_service)
):
    try:
        deleted = await transaction_service.delete_transaction(transaction_id, str(current_user.get('_id')))
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found or could not be deleted")
        return {"message": "Transaction deleted successfully"}
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete transaction: {e}")

@router.get("/groups/{group_id}/balance", response_model=dict)
async def get_group_balance(
    group_id: str,
    current_user: UserInDB = Depends(get_current_user),
    transaction_service: TransactionService = Depends(get_transaction_service)
):
    try:
        return await transaction_service.get_group_balance(group_id, str(current_user.get('_id')))
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve group balance: {e}")