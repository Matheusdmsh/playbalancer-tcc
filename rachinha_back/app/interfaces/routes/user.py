from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.interfaces.schemas.user import ChangePasswordRequest, FCMTokenRequest, ForgotPasswordRequest, ResetPasswordRequest, UserGhostUpdate, UserSearchResult, UserUpdate, UserCreate
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.group_repository import GroupRepository
from app.domain.repositories.booking_repository import BookingRepository
from app.domain.repositories.court_repository import CourtRepository
from app.services.auth_service import create_password_reset_token, hash_password, verify_password
from app.services.user_service import UserService
from app.core.security import get_current_user
from app.core.config import get_db, settings
from jose import jwt, JWTError

from app.utils.email_sender import EmailSender 

router = APIRouter(prefix="/users", tags=["Users"])

email_sender = EmailSender()

@router.post("/ghost", status_code=status.HTTP_201_CREATED)
async def create_ghost_user(user: UserCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Cria um usuário fantasma. Requer apenas um nome.
    O email é opcional e, se fornecido, pode ser usado para vincular a uma conta real mais tarde.
    """
    if not user.name:
        raise HTTPException(status_code=400, detail="O nome é obrigatório para criar um usuário fantasma.")

    repo = UserRepository(db)

    if user.email:
        existing_user = await repo.find_by_email(user.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Um usuário com este email já existe.")


    user_data = {
        "name": user.name,
        "email": user.email,
        "is_placeholder": True,
        "username": f"ghost_{int(datetime.now(timezone.utc).timestamp())}", # Unique username
        "nickname": user.name.split(" ")[0],
        "password": None,
        "role": ["user"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "is_active": True,
        "is_email_verified": False,
        "sport_ratings": {},
        'photo_url': '',
        'phone_number': user.phone_number,
        'active_card_template': 'v4'
    }
    user_id = await repo.create_user(user_data)

    if user.email:
        try:
            await email_sender.send_email(
                template_name="ghost_user_invite",
                subject="Entre para a Pelada, você foi convidado para o rachinha.com!",
                recipients=[{
                    "email": user.email,
                    "variables": {
                        "name": user.name.split(" ")[0],
                        "create_account_link": "https://rachinha.com/login"
                    }
                }]
            )
        except Exception as e:
            print(f"Erro ao enviar e-mail de convite para usuário fantasma: {e}")

    return {"id": user_id, "detail": "Usuário fantasma criado com sucesso."}

@router.put("/ghost/{user_id}/email", status_code=status.HTTP_200_OK)
async def add_email_to_ghost_user(
    user_id: str,
    update_data: UserGhostUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Adiciona ou atualiza o e-mail de um usuário fantasma e envia um convite.
    """
    repo = UserRepository(db)
    user_to_update = await repo.find_by_id(user_id)

    if not user_to_update or not user_to_update.get("is_placeholder"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário fantasma não encontrado.")

    existing_user = await repo.find_by_email(update_data.email)
    if existing_user and not existing_user.get("is_placeholder"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este e-mail já está em uso por uma conta ativa.")

    updated = await repo.update_user(user_id, {"email": update_data.email})
    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Falha ao atualizar o e-mail do usuário fantasma.")

    try:
        await email_sender.send_email(
            template_name="ghost_user_invite",
            subject="Entre para a Pelada, você foi convidado para o rachinha.com!",
            recipients=[{
                "email": update_data.email,
                "variables": {
                    "name": user_to_update["name"].split(" ")[0],
                    "create_account_link": "https://rachinha.com/login"
                }
            }]
        )
    except Exception as e:
        print(f"Erro ao enviar e-mail de convite para usuário fantasma: {e}")

    return {"detail": "E-mail adicionado e convite enviado com sucesso."}

@router.get("/me")
async def get_my_profile(current_user=Depends(get_current_user)):
    user = current_user.copy()
    user["_id"] = str(user["_id"])
    user["active_card_template"] = user.get("active_card_template", "v4")
    return user


@router.put("/me")
async def update_my_profile(
    update_data: UserUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    repo = UserRepository(db)
    service = UserService(repo)

    updated = await service.update_user_profile(current_user["_id"], update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return {"detail": "Perfil atualizado com sucesso"}


@router.delete("/me/{user_id}")
async def delete_my_profile(
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    repo = UserRepository(db)
    service = UserService(repo)

    deleted = await service.delete_user_account(current_user["_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return {"detail": "Conta deletada com sucesso"}

@router.post("/users_by_ids")
async def get_users_by_ids(
    user_ids: list[str],
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    repo = UserRepository(db)
    service = UserService(repo)

    users = await service.get_users_by_ids(user_ids)
    if not users:
        raise HTTPException(status_code=404, detail="Usuários não encontrados")

    return users

@router.get("/verify-email/{token}", status_code=status.HTTP_200_OK)
async def verify_email(token: str, db=Depends(get_db)):
    user_repo = UserRepository(db)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Link de verificação inválido ou expirado.",
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])

        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        expiration_timestamp = payload.get("exp")

        if user_id is None or token_type != "email_verification" or expiration_timestamp is None:
            raise credentials_exception

        expiration_datetime = datetime.fromtimestamp(expiration_timestamp, tz=timezone.utc)
        if expiration_datetime < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Link de verificação expirado.")

        user = await user_repo.find_by_id(user_id)
        if user is None:
            raise credentials_exception

        if user.get("is_email_verified"):
            return {"detail": "Seu e-mail já foi verificado."}

        # Atualizar o status de verificação do e-mail
        updated = await user_repo.update_user(user_id, {"is_email_verified": True, "updated_at": datetime.now(timezone.utc)})

        if not updated:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Falha ao ativar sua conta. Tente novamente.")

        return {"detail": "E-mail verificado com sucesso! Sua conta está ativa."}

    except JWTError:
        raise credentials_exception
    except Exception as e:
        print(f"Erro ao verificar e-mail: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao verificar seu e-mail.")
    

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(request: ForgotPasswordRequest, db=Depends(get_db)):
    user_repo = UserRepository(db)
    user = await user_repo.find_by_email(request.email)

    if not user:
        # Para segurança, sempre retornar uma mensagem genérica para evitar enumeração de usuários
        return {"detail": "Se um usuário com este e-mail for encontrado, um link para redefinir a senha será enviado."}
    
    if user.get("is_placeholder") is False:
        try:
            reset_token = create_password_reset_token(str(user["_id"]))
            reset_link = f"https://rachinha.com/user/reset-password-form/{reset_token}" # Este link deve levar a um formulário no frontend

            await email_sender.send_email(
                template_name="password_reset", # Novo template de e-mail
                subject="CARTÃO AMARELO - Redefinição de Senha",
                recipients=[{
                    "email": user["email"],
                    "variables": {
                        "reset_link": reset_link
                    }
                }]
            )
            print(f"E-mail de redefinição de senha enviado para {user['email']}")
        except Exception as e:
            print(f"Erro ao enviar e-mail de redefinição de senha para {user['email']}: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro ao enviar o e-mail de redefinição de senha.")
    
    return {"detail": "Se um usuário com este e-mail for encontrado, um link para redefinir a senha será enviado."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(request: ResetPasswordRequest, db=Depends(get_db)):
    user_repo = UserRepository(db)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Link de redefinição de senha inválido ou expirado.",
    )
    try:
        payload = jwt.decode(request.token, settings.JWT_SECRET, algorithms=["HS256"])

        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        expiration_timestamp = payload.get("exp")

        if user_id is None or token_type != "password_reset" or expiration_timestamp is None:
            raise credentials_exception

        expiration_datetime = datetime.fromtimestamp(expiration_timestamp, tz=timezone.utc)
        if expiration_datetime < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Link de redefinição de senha expirado.")

        user = await user_repo.find_by_id(user_id)
        if user is None:
            raise credentials_exception

        # Hash da nova senha
        hashed_password = hash_password(request.new_password)

        # Atualiza a senha no banco de dados
        updated = await user_repo.update_user(user_id, {"password": hashed_password, "updated_at": datetime.now(timezone.utc)})

        if not updated:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Falha ao redefinir sua senha. Tente novamente.")

        return {"detail": "Sua senha foi redefinida com sucesso!"}

    except JWTError:
        raise credentials_exception
    except Exception as e:
        print(f"Erro ao redefinir senha: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao redefinir sua senha.")
    
@router.get("/search", response_model=List[UserSearchResult])
async def search_users_endpoint(
    q: str = Query(
        ..., 
        min_length=1, 
        max_length=50, 
        description="Termo de busca para nome ou nome de usuário."
    ),
    group_id: Optional[str] = Query(
        None,
        description="Filtra resultados apenas para membros de um grupo."
    ),
    booking_id: Optional[str] = Query(
        None,
        description="Filtra resultados apenas para usuários vinculados a uma reserva."
    ),
    include_ghosts: bool = Query(
        True,
        description="Se true, inclui usuários fantasmas na busca."
    ),
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Busca usuários na plataforma pelo nome ou nome de usuário, retornando
    uma lista com os 5 resultados mais relevantes.
    """
    user_repo = UserRepository(db)
    group_repo = GroupRepository(db)
    booking_repo = BookingRepository(db)
    service = UserService(user_repo, group_repo, booking_repo)
    
    users = await service.search_for_users(
        q,
        group_id=group_id,
        booking_id=booking_id,
        include_ghosts=include_ghosts
    )
    
    # Retorna uma lista vazia se nenhum usuário for encontrado, 
    # que é o comportamento esperado para uma busca.
    return users


@router.put("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    user_repo = UserRepository(db)

    # Verifica se a senha atual está correta
    user = await user_repo.find_by_id(current_user.get("_id"))
    if user is None or not verify_password(request.current_password, user.get("password", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Senha atual incorreta.")

    # Verifica se a nova senha e a confirmação são iguais
    if request.new_password != request.confirm_new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="As senhas não coincidem.")

    # Atualiza a senha no banco de dados
    hashed_password = hash_password(request.new_password)
    updated = await user_repo.update_user(user.get("_id"), {"password": hashed_password, "updated_at": datetime.now(timezone.utc)})

    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Falha ao trocar sua senha. Tente novamente.")

    return {"detail": "Sua senha foi trocada com sucesso!"}


@router.post("/register-fcm-token")
async def register_fcm_token(
    token_request: FCMTokenRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    user_repo = UserRepository(db)
    service = UserService(user_repo)

    updated = await service.update_fcm_token(current_user.get("_id"), token_request.fcm_token)

    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Falha ao registrar o token FCM.")

    return {"detail": "Token FCM registrado com sucesso."}

@router.put("/me/role")
async def update_my_role(
    role_data: dict, # Ex: {"role": "admin"}
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    repo = UserRepository(db)
    service = UserService(repo)
    
    valid_roles = ["user", "admin"]
    new_role = role_data.get("role")
    if new_role not in valid_roles:
        raise HTTPException(status_code=400, detail="Role inválida.")
    updated = await service.update_user_role(current_user["_id"], role_data.get("role"))
    if not updated:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return {"detail": "Role atualizada com sucesso"}

@router.get("/me/favorites")
async def get_favorite_courts(db=Depends(get_db), current_user=Depends(get_current_user)):
    repo = UserRepository(db)
    user = await repo.find_by_id(current_user["_id"])
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user.get("favorite_courts", [])

@router.post("/me/favorites/{court_id}")
async def add_favorite_court(court_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    repo = UserRepository(db)
    # First verify if the court exists
    court_repo = CourtRepository(db)
    if not await court_repo.get_by_id(court_id):
         raise HTTPException(status_code=404, detail="Quadra não encontrada")
         
    await repo.update_user(current_user["_id"], {"$addToSet": {"favorite_courts": court_id}})
    return {"detail": "Quadra adicionada aos favoritos"}

@router.delete("/me/favorites/{court_id}")
async def remove_favorite_court(court_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    repo = UserRepository(db)
    await repo.update_user(current_user["_id"], {"$pull": {"favorite_courts": court_id}})
    return {"detail": "Quadra removida dos favoritos"}


@router.get("/me/favorite-groups")
async def get_favorite_groups(db=Depends(get_db), current_user=Depends(get_current_user)):
    repo = UserRepository(db)
    user = await repo.find_by_id(current_user["_id"])
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user.get("favorite_groups", [])


@router.post("/me/favorite-groups/{group_id}")
async def add_favorite_group(group_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    repo = UserRepository(db)
    group_repo = GroupRepository(db)

    # Validate group existence before adding to favorites.
    if not await group_repo.get_by_id(group_id):
        raise HTTPException(status_code=404, detail="Grupo não encontrado")

    await repo.update_user(current_user["_id"], {"$addToSet": {"favorite_groups": group_id}})
    return {"detail": "Grupo adicionado aos favoritos"}


@router.delete("/me/favorite-groups/{group_id}")
async def remove_favorite_group(group_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    repo = UserRepository(db)
    await repo.update_user(current_user["_id"], {"$pull": {"favorite_groups": group_id}})
    return {"detail": "Grupo removido dos favoritos"}