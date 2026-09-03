from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import get_db, settings
from app.core.security import get_current_user
from app.domain.repositories.access_repository import AccessRepository
from app.domain.repositories.user_repository import UserRepository
from app.interfaces.schemas.user import UserCreate, UserLogin
from app.services.auth_service import (
    create_access_token,
    create_email_verification_token,
    hash_password,
    verify_password,
)
from app.utils.email_sender import EmailSender


router = APIRouter(prefix="/auth", tags=["Auth"])
email_sender = EmailSender()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db=Depends(get_db)):
    repo = UserRepository(db)
    if not user.email:
        raise HTTPException(status_code=400, detail="Email is required for registration.")

    existing_user = await repo.find_by_email(user.email)
    if existing_user and not existing_user.get("is_placeholder"):
        raise HTTPException(status_code=400, detail="Email já existe")

    if not user.username:
        raise HTTPException(status_code=400, detail="Username é obrigatório")
    existing_username = await repo.find_by_username(user.username)
    if existing_username and not existing_user:
        raise HTTPException(status_code=400, detail="Username já existe")

    nickname = (user.nickname or user.name.split(" ")[0]).strip()
    now = datetime.now(timezone.utc)
    user_data = {
        "email": str(user.email),
        "password": hash_password(user.password),
        "role": user.role,
        "name": user.name,
        "username": user.username,
        "nickname": nickname,
        "created_at": now,
        "updated_at": now,
        "is_active": True,
        "is_email_verified": False,
        "photo_url": "",
        "phone_number": user.phone_number,
        "sport_ratings": {},
        "is_placeholder": False,
        "active_card_template": "v1",
    }

    if existing_user and existing_user.get("is_placeholder"):
        await repo.update_user(existing_user["_id"], user_data)
        user_id = str(existing_user["_id"])
    else:
        user_id = await repo.create_user(user_data)

    try:
        verification_token = create_email_verification_token(user_id)
        verification_link = f"{settings.FRONTEND_URL.rstrip('/')}/user/verify-email/{verification_token}"
        await email_sender.send_email(
            template_name="welcome",
            subject="Bem-vindo(a) ao PlayBalance, {{ name }} — confirme seu e-mail",
            recipients=[{
                "email": str(user.email),
                "variables": {
                    "name": user.name.split(" ")[0],
                    "verification_link": verification_link,
                },
            }],
        )
    except Exception as exc:
        print(f"Erro ao enviar e-mail de verificação para {user.email}: {exc}")

    return {
        "id": user_id,
        "detail": "Usuário registrado com sucesso. Por favor, verifique seu e-mail para ativar sua conta.",
    }


@router.post("/resend-verification")
async def resend_verification(db=Depends(get_db), current_user=Depends(get_current_user)):
    repo = UserRepository(db)
    user = await repo.find_by_id(str(current_user["_id"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("is_email_verified"):
        return {"detail": "Email já está verificado"}

    try:
        token = create_email_verification_token(str(user["_id"]))
        link = f"{settings.FRONTEND_URL.rstrip('/')}/user/verify-email/{token}"
        await email_sender.send_email(
            template_name="welcome",
            subject="Bem-vindo(a) ao PlayBalance, {{ name }} — confirme seu e-mail",
            recipients=[{
                "email": user["email"],
                "variables": {"name": user["name"].split(" ")[0], "verification_link": link},
            }],
        )
        return {"detail": "E-mail de verificação reenviado com sucesso!"}
    except Exception as exc:
        print(f"Erro ao reenviar e-mail de verificação para {user['email']}: {exc}")
        raise HTTPException(status_code=500, detail="Erro ao tentar reenviar o e-mail.")


async def _login_user(credentials, request: Request, response: Response | None, db):
    repo = UserRepository(db)
    access_repo = AccessRepository(db)
    identifier = credentials.username
    user = await repo.find_by_email(identifier)
    if not user:
        user = await repo.find_by_username(identifier)

    success = bool(user and user.get("password") and verify_password(credentials.password, user["password"]))
    token_expiration = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    await access_repo.log_access({
        "user_id": str(user["_id"]) if user else None,
        "email": user.get("email") if user else None,
        "username": user.get("username") if user else None,
        "login_time": datetime.now(timezone.utc),
        "token_expiration": token_expiration,
        "user_agent": request.headers.get("user-agent") if request else None,
        "ip_address": request.client.host if request and request.client else None,
        "method": "login_password",
        "success": success,
    })
    if not success:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    await repo.update_user(user["_id"], {"last_login": datetime.now(timezone.utc)})
    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    if response:
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            samesite="lax",
            secure=settings.COOKIE_SECURE,
            expires=int(token_expiration.timestamp()),
            path="/",
        )
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login")
async def login(credentials: UserLogin, request: Request, response: Response, db=Depends(get_db)):
    return await _login_user(credentials, request, response, db)


@router.post("/login/swagger")
async def login_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
    response: Response = None,
    db=Depends(get_db),
):
    return await _login_user(form_data, request, response, db)
