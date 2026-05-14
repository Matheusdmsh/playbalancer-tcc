from fastapi import APIRouter, Depends, HTTPException, Response, Request, status, Form
import httpx
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from app.interfaces.schemas.user import UserCreate, UserLogin
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.access_repository import AccessRepository
from app.domain.repositories.connection_repository import ConnectionRepository
from app.services.auth_service import hash_password, verify_password, create_access_token, create_email_verification_token, handle_google_login
from app.services.apple_auth_service import AppleAuthService
from datetime import datetime, timezone, timedelta
from app.core.config import get_db, settings
from app.core.security import get_current_user, get_current_user_optional
from fastapi.security import OAuth2PasswordRequestForm
from app.utils.email_sender import EmailSender 
from httpx_oauth.clients.google import GoogleOAuth2
import re
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from jose import jwt, JWTError
import uuid
from typing import Optional, List


router = APIRouter(prefix="/auth", tags=["Auth"])

class AppleLoginRequest(BaseModel):
    id_token: str
    name: Optional[str] = None
    username: Optional[str] = None

@router.post("/apple/login")
async def apple_login(request: AppleLoginRequest, db=Depends(get_db)):
    # 1. Verificar o token da Apple (pode ser do App ou da Web)
    apple_payload = await AppleAuthService.verify_apple_token(request.id_token)
            
    if not apple_payload:
        raise HTTPException(status_code=400, detail="Token da Apple inválido ou expirado")
        
    apple_id = apple_payload.get("sub")
    email = apple_payload.get("email")
    
    if not email:
        raise HTTPException(status_code=400, detail="E-mail não fornecido pela Apple")

    repo = UserRepository(db)
    conn_repo = ConnectionRepository(db)
    
    # 2. Verifica se já existe uma conexão para este ID da Apple
    connection = await conn_repo.find_by_provider_id("apple", apple_id)
    
    user = None
    if connection:
        user = await repo.find_by_id(connection["user_id"])
    
    if not user:
        # Verifica se já existe um usuário com esse e-mail (vínculo automático)
        user = await repo.find_by_email(email)
        
        if user:
            # Cria a conexão para o usuário existente
            await conn_repo.create_connection({
                "user_id": user["_id"],
                "provider": "apple",
                "provider_user_id": apple_id,
                "email": email
            })
        elif request.username:
            # Novo usuário: Cria usuário e conexão
            nickname = (request.name or email.split("@")[0]).strip()
            user_data = {
                "email": email,
                "password": hash_password(str(uuid.uuid4())),
                "role": "user",
                "name": request.name or email.split("@")[0],
                "username": request.username,
                "nickname": nickname,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "is_active": True,
                "is_email_verified": True,
                'photo_url': '',
                'phone_number': '',
                'sport_ratings': {},
                'is_placeholder': False,
                'active_card_template': 'v4'
            }
            user_id = await repo.create_user(user_data)
            user = await repo.find_by_id(str(user_id))
            
            # Cria a conexão
            await conn_repo.create_connection({
                "user_id": user["_id"],
                "provider": "apple",
                "provider_user_id": apple_id,
                "email": email
            })
        else:
            # Solicita setup (igual ao Google)
            temp_token = create_access_token(
                data={"sub": email, "type": "apple_setup", "apple_id": apple_id}, 
                expires_delta=timedelta(minutes=10)
            )
            return {
                "status": "setup_required",
                "temp_token": temp_token,
                "email": email
            }

    # Gera o token de acesso real
    access_token = create_access_token(data={"sub": str(user["_id"])})
    return {
        "status": "success",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "_id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "username": user["username"],
            "role": user.get("role", "user"),
            "is_active": user.get("is_active", True),
            "is_email_verified": user.get("is_email_verified", False),
            "created_at": user["created_at"].isoformat() if isinstance(user.get("created_at"), datetime) else str(user.get("created_at")),
            "updated_at": user["updated_at"].isoformat() if isinstance(user.get("updated_at"), datetime) else str(user.get("updated_at")),
            "photo_url": user.get("photo_url", ""),
            "phone_number": user.get("phone_number", ""),
            "active_card_template": user.get("active_card_template", "v4")
        }
    }

@router.post("/apple/callback/web")
async def apple_callback_web(
    id_token: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    user: Optional[str] = Form(None)
):
    """
    Callback for Apple Sign In on Web.
    Apple POSTs to this endpoint, and we redirect back to the frontend login page.
    """
    frontend_url = settings.FRONTEND_URL
    if not id_token:
        return RedirectResponse(url=f"{frontend_url}/login?error=apple_no_token")
    
    return RedirectResponse(
        url=f"{frontend_url}/login?apple_token={id_token}",
        status_code=303
    )

@router.post("/apple/callback/app")
async def apple_callback_app(
    id_token: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    user: Optional[str] = Form(None)
):
    """
    Callback for Apple Sign In on Android.
    Apple POSTs to this endpoint, and we redirect back to the Flutter app via Intent.
    """
    if not id_token:
        # Erro genérico de volta para o app
        return RedirectResponse(
            url="intent://callback?error=apple_no_token#Intent;package=com.rachinha.atena;scheme=signinwithapple;end",
            status_code=303
        )
    
    # Redireciona usando o esquema que o plugin sign_in_with_apple monitora no Android
    return RedirectResponse(
        url=f"intent://callback?apple_token={id_token}#Intent;package=com.rachinha.atena;scheme=signinwithapple;end",
        status_code=303
    )

email_sender = EmailSender()

google_client = GoogleOAuth2(
    settings.GOOGLE_CLIENT_ID,
    settings.GOOGLE_CLIENT_SECRET,
)

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db=Depends(get_db)):
    repo = UserRepository(db)
    nickname = (user.nickname or user.name.split(" ")[0]).strip()

    # If an email is provided, check for existing users (ghost or real)
    if user.email:
        existing_user = await repo.find_by_email(user.email)
        if existing_user and not existing_user.get("is_placeholder"):
            raise HTTPException(status_code=400, detail="Email já existe")
        
        existing_username = await repo.find_by_username(user.username)
        if existing_username:
            raise HTTPException(status_code=400, detail="Username já existe")

        # If a ghost user with this email exists, update it
        if existing_user and existing_user.get("is_placeholder"):
            # Update ghost user to a real user
            update_data = {
                "name": user.name,
                "username": user.username,
                "nickname": nickname,
                "password": hash_password(user.password),
                "is_placeholder": False,
                "is_email_verified": False, # Start email verification process
                "updated_at": datetime.now(timezone.utc),
                "active_card_template": existing_user.get("active_card_template", "v4"),
            }
            if user.phone_number:
                update_data["phone_number"] = user.phone_number

            await repo.update_user(existing_user["_id"], update_data)
            user_id = str(existing_user["_id"])

        else: # No user with this email, create a new one
            user_data = {
                "email": user.email,
                "password": hash_password(user.password),
                "role": user.role,
                "name": user.name,
                "username": user.username,
                "nickname": nickname,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "is_active": True,
                "is_email_verified": False, 
                'photo_url': '',
                'phone_number': user.phone_number,
                'sport_ratings': {},
                'is_placeholder': False,
                'active_card_template': 'v4'
            }
            user_id = await repo.create_user(user_data)
    else: # This is a ghost user creation, should be handled in a separate endpoint
        raise HTTPException(status_code=400, detail="Email is required for registration.")


    # --- Gerar e enviar o e-mail de verificação ---

    if user.is_placeholder is False:
        try:
            verification_token = create_email_verification_token(str(user_id))
            verification_link = f"https://rachinha.com/user/verify-email/{verification_token}"

            await email_sender.send_email(
                template_name="welcome",
                subject="É O SEU NOME NA LISTA! Bem-vindo(a) {{ name }} ao Rachinha.com! 🏆",
                recipients=[{
                    "email": user.email,
                    "variables": {
                        "name": user.name.split(" ")[0],
                        "verification_link": verification_link
                    }
                }]
            )
            print(f"E-mail de verificação enviado para {user.email}")
        except Exception as e:
            print(f"Erro ao enviar e-mail de verificação para {user.email}: {e}")

    return {"id": user_id, "detail": "Usuário registrado com sucesso. Por favor, verifique seu e-mail para ativar sua conta."}

from app.core.security import get_current_user

@router.post("/resend-verification")
async def resend_verification(db=Depends(get_db), current_user=Depends(get_current_user)):
    repo = UserRepository(db)
    user = await repo.find_by_id(str(current_user["_id"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("is_email_verified"):
        return {"detail": "Email já está verificado"}

    try:
        verification_token = create_email_verification_token(str(user["_id"]))
        verification_link = f"https://rachinha.com/user/verify-email/{verification_token}"

        await email_sender.send_email(
            template_name="welcome",
            subject="É O SEU NOME NA LISTA! Bem-vindo(a) {{ name }} ao Rachinha.com! 🏆",
            recipients=[{
                "email": user["email"],
                "variables": {
                    "name": user["name"].split(" ")[0],
                    "verification_link": verification_link
                }
            }]
        )
        return {"detail": "E-mail de verificação reenviado com sucesso!"}
    except Exception as e:
        print(f"Erro ao reenviar e-mail de verificação para {user['email']}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao tentar reenviar o e-mail.")

@router.get("/google/login")
async def google_login():
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    url = await google_client.get_authorization_url(
        redirect_uri,
        scope=["email", "profile"],
        extras_params={"access_type": "offline"},
    )
    return {"url": url}

@router.get("/google/callback")
async def google_callback(code: str, request: Request, db=Depends(get_db)):
    access_repo = AccessRepository(db)
    user_repo = UserRepository(db)
    conn_repo = ConnectionRepository(db)
    
    user_info = await handle_google_login(code, google_client)
    google_id = user_info.get("id") or user_info.get("sub")
    email = user_info.get("email")

    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Não foi possível obter informações do Google.")

    # Verifica se já existe uma conexão para este ID do Google
    connection = await conn_repo.find_by_provider_id("google", google_id)
    
    user = None
    if connection:
        user = await user_repo.find_by_id(connection["user_id"])
    
    if not user:
        # Se não houver conexão, verifica se já existe um usuário com esse e-mail
        user = await user_repo.find_by_email(email)
        if user:
            # Vínculo automático: Cria conexão para este usuário
            await conn_repo.create_connection({
                "user_id": user["_id"],
                "provider": "google",
                "provider_user_id": google_id,
                "email": email
            })
        else:
            # Usuário não existe, redireciona para o frontend com informações temporárias
            # Criamos um token temporário com os dados necessários para o registro/vínculo posterior
            temp_data = {
                "sub": "temp_google_auth",
                "email": email,
                "name": user_info.get("name"),
                "photo_url": user_info.get("picture"),
                "provider": "google",
                "provider_user_id": google_id
            }
            temp_token = create_access_token(temp_data, expires_delta=timedelta(minutes=15))
            
            frontend_url = f"{settings.FRONTEND_URL}/callback?temp_token={temp_token}"
            return RedirectResponse(url=frontend_url)
    
    if not user.get("is_active"):
        raise HTTPException(status_code=400, detail="Usuário inativo")

    await user_repo.update_user(user["_id"], {"last_login": datetime.now(timezone.utc)})

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    token_expiration_time = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    await access_repo.log_access({
        "user_id": str(user["_id"]),
        "email": user["email"],
        "username": user["username"],
        "login_time": datetime.now(timezone.utc),
        "token_expiration": token_expiration_time,
        "user_agent": request.headers.get("user-agent"),
        "ip_address": request.client.host,
        "method": "google_login",
        "success": True
    })

    frontend_url = f"{settings.FRONTEND_URL}/callback?token={token}"
    return RedirectResponse(url=frontend_url)

@router.post("/login", tags=["Auth"])
async def login(credentials: UserLogin, request: Request, response: Response, db=Depends(get_db)):
    repo = UserRepository(db)
    access_repo = AccessRepository(db)

    user = await repo.find_by_email(credentials.username)
    if not user:
        user = await repo.find_by_username(credentials.username)

    success = user and verify_password(credentials.password, user["password"])

    if success and not user.get("is_email_verified"):
        pass # Allow login anyway, but UI will show a banner

    await repo.update_user(user["_id"], {"last_login": datetime.now(timezone.utc)})

    token_expiration_time = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    await access_repo.log_access({
        "user_id": str(user["_id"]) if user else None,
        "email": user["email"] if user else None,
        "username": user["username"] if user else None,
        "login_time": datetime.now(timezone.utc),
        "token_expiration": token_expiration_time,
        "user_agent": request.headers.get("user-agent"),
        "ip_address": request.client.host,
        "method": "login_password",
        "success": success
    })

    if not success:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        expires=int(token_expiration_time.timestamp()),
        path="/"
    )

    return {"access_token": token, "token_type": "bearer"}


@router.post("/login/swagger", tags=["Auth"])
async def login_swagger(form_data: OAuth2PasswordRequestForm = Depends(), request: Request = None, response: Response = None, db=Depends(get_db)):
    repo = UserRepository(db)
    access_repo = AccessRepository(db)

    user = await repo.find_by_email(form_data.username)
    if not user:
        user = await repo.find_by_username(form_data.username)

    success = user and verify_password(form_data.password, user["password"])

    if success and not user.get("is_email_verified"):
        pass # Allow login anyway, but UI will show a banner

    token_expiration_time = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    await access_repo.log_access({
        "user_id": str(user["_id"]) if user else None,
        "email": user["email"] if user else None,
        "username": user["username"] if user else None,
        "login_time": datetime.now(timezone.utc),
        "token_expiration": token_expiration_time,
        "user_agent": request.headers.get("user-agent") if request else None,
        "ip_address": request.client.host if request else None,
        "method": "swagger_login",
        "success": success
    })

    if not success:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})

    if response:
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            samesite="lax",
            secure=False,
            expires=int(token_expiration_time.timestamp()),
            path="/",
        )

    return {"access_token": token, "token_type": "bearer"}

class GoogleToken(BaseModel):
    id_token: str

@router.post("/google/check")
async def google_check(token: GoogleToken, db=Depends(get_db)):
    """
    Verifica o status da conta Google (Vinculada, Email existe, ou Novo Usuário).
    """
    try:
        id_info = await extract_google_data(token.id_token)
        email = id_info['email']
        google_id = id_info['provider_user_id']
        
        user_repo = UserRepository(db)
        conn_repo = ConnectionRepository(db)

        # Verifica se já existe conexão
        connection = await conn_repo.find_by_provider_id("google", google_id)
        if connection:
            return {"status": "linked", "email": email}

        # Verifica se o email existe
        user = await user_repo.find_by_email(email)
        if user:
            return {"status": "email_match", "email": email}

        # Novo usuário
        return {"status": "new_user", "email": email}

    except Exception as e:
        print(f"Erro completo no check Google: {str(e)}")
        # Se for um erro do Google, o detalhe pode vir do e.args ou similar
        detail_msg = "Token do Google inválido ou expirado"
        if "audience mismatch" in str(e).lower():
            detail_msg = "Erro de configuração: Audience Mismatch (ID do Cliente incorreto)"
        
        raise HTTPException(status_code=401, detail=detail_msg)

@router.post("/google/authenticate")
async def google_authenticate(token: GoogleToken, request: Request, db=Depends(get_db)):
    """
    Realiza o login via Google se houver conexão ou email match.
    """
    try:
        id_info = await extract_google_data(token.id_token)
        email = id_info['email']
        google_id = id_info['provider_user_id']
        
        user_repo = UserRepository(db)
        conn_repo = ConnectionRepository(db)
        access_repo = AccessRepository(db)

        # Verifica conexão
        connection = await conn_repo.find_by_provider_id("google", google_id)
        user = None
        if connection:
            user = await user_repo.find_by_id(connection["user_id"])
        
        if not user:
            # Verifica por e-mail (vínculo automático)
            user = await user_repo.find_by_email(email)
            if user:
                await conn_repo.create_connection({
                    "user_id": user["_id"],
                    "provider": "google",
                    "provider_user_id": google_id,
                    "email": email
                })
            else:
                # Não loga diretamente, forçando o fluxo de registro do frontend
                # (O frontend deveria ter chamado o /check e depois /register)
                raise HTTPException(status_code=400, detail="Usuário não cadastrado. Use /google/register.")

        if not user.get("is_active"):
            raise HTTPException(status_code=400, detail="Usuário inativo")

        # Login bem-sucedido
        await user_repo.update_user(user["_id"], {"last_login": datetime.now(timezone.utc)})
        
        token_expiration_time = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
        
        await access_repo.log_access({
            "user_id": str(user["_id"]),
            "email": user["email"],
            "username": user["username"],
            "login_time": datetime.now(timezone.utc),
            "token_expiration": token_expiration_time,
            "user_agent": request.headers.get("user-agent"),
            "ip_address": request.client.host,
            "method": "google_auth_token",
            "success": True
        })

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        print(f"Erro no authenticate Google: {e}")
        detail_msg = "Falha na autenticação com Google"
        if "audience mismatch" in str(e).lower():
            detail_msg = "Erro de configuração: Audience Mismatch no Login"
            
        raise HTTPException(status_code=401, detail=detail_msg)

class GoogleRegister(BaseModel):
    temp_token: str
    username: str
    nickname: Optional[str] = None
    password: Optional[str] = None

async def extract_google_data(token_str: str):
    """
    Extrai dados do Google de um Google ID Token, Access Token ou de um temp_token JWT interno.
    """
    if not token_str:
        raise HTTPException(status_code=400, detail="Token não fornecido")

    # Tenta como Google ID Token (JWT)
    if token_str.count(".") == 2:
        try:
            # Lista de audiências (Client IDs) válidos para o nosso backend
            allowed_audiences = [
                settings.GOOGLE_CLIENT_ID,
                settings.GOOGLE_ANDROID_CLIENT_ID,
                settings.GOOGLE_IOS_CLIENT_ID
            ]
            # Remove IDs vazios ou placeholders
            allowed_audiences = [aud for aud in allowed_audiences if aud and "YOUR_GOOGLE" not in aud]
            
            id_info = id_token.verify_oauth2_token(
                token_str, google_requests.Request(), 
                audience=allowed_audiences,
                clock_skew_in_seconds=60
            )
            return {
                "email": id_info['email'],
                "provider_user_id": id_info['sub'],
                "name": id_info.get('name', id_info.get('email', '').split('@')[0]),
                "photo_url": id_info.get('picture'),
                "provider": "google"
            }
        except Exception as e:
            print(f"ID Token verification failed: {e}")
    # Tenta como Access Token (pergunta ao Google userInfo)
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token_str}"}
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "email": data['email'],
                    "provider_user_id": data['sub'],
                    "name": data.get('name', data.get('email', '').split('@')[0]),
                    "photo_url": data.get('picture'),
                    "provider": "google"
                }
    except Exception as e:
        print(f"Access Token verification failed: {e}")

    # Se falhar como token social direto, tenta como nosso temp_token JWT
    try:
        payload = jwt.decode(token_str, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("sub") == "temp_google_auth" or payload.get("type") == "apple_setup" or payload.get("sub") == "temp_apple_auth":
            return {
                "email": payload.get("email"),
                "provider_user_id": payload.get("provider_user_id") or payload.get("apple_id"),
                "provider": payload.get("provider", "google"),
                "name": payload.get("name"),
                "photo_url": payload.get("photo_url")
            }
    except JWTError:
        pass

    raise HTTPException(status_code=401, detail="Token social inválido ou expirado")

@router.post("/google/register")
async def google_register(data: GoogleRegister, request: Request, db=Depends(get_db)):
    payload = await extract_google_data(data.temp_token)

    user_repo = UserRepository(db)
    conn_repo = ConnectionRepository(db)

    # Verifica se o username já existe
    if await user_repo.find_by_username(data.username):
        raise HTTPException(status_code=400, detail="Username já em uso")

    # Checks for existing connection
    existing_conn = await conn_repo.find_by_provider_id(payload["provider"], payload["provider_user_id"])
    if existing_conn:
        raise HTTPException(status_code=400, detail=f"Esta conta do {payload['provider']} já está vinculada a um usuário")

    nickname = data.nickname or (payload.get("name") or payload["email"].split("@")[0]).split(" ")[0]
    # Usa a senha fornecida pelo usuário, ou gera uma aleatória
    final_password = data.password if data.password else str(uuid.uuid4())
    
    user_data = {
        "email": payload["email"],
        "name": payload["name"],
        "username": data.username,
        "nickname": nickname,
        "password": hash_password(final_password),
        "role": ["user"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "is_active": True,
        "is_email_verified": True,
        "photo_url": payload.get("photo_url"),
        "sport_ratings": {},
        "is_placeholder": False,
        "active_card_template": "v4"
    }

    user_id = await user_repo.create_user(user_data)
    
    await conn_repo.create_connection({
        "user_id": user_id,
        "provider": payload["provider"],
        "provider_user_id": payload["provider_user_id"],
        "email": payload["email"]
    })

    token = create_access_token({"sub": user_id, "role": ["user"]})
    return {"access_token": token, "token_type": "bearer"}

class GoogleLink(BaseModel):
    temp_token: str
    username: Optional[str] = None
    password: Optional[str] = None

class AppleLink(BaseModel):
    id_token: str

@router.post("/apple/link")
async def apple_link(data: AppleLink, db=Depends(get_db), current_user = Depends(get_current_user)):
    # 1. Verificar o token da Apple
    apple_payload = await AppleAuthService.verify_apple_token(data.id_token)
    if not apple_payload:
        raise HTTPException(status_code=400, detail="Token da Apple inválido ou expirado")
    
    apple_id = apple_payload.get("sub")
    email = apple_payload.get("email")
    
    conn_repo = ConnectionRepository(db)
    
    # 2. Verifica se este ID da Apple já está vinculado a alguém
    existing_conn = await conn_repo.find_by_provider_id("apple", apple_id)
    if existing_conn:
        raise HTTPException(status_code=400, detail="Esta conta da Apple já está vinculada a outro usuário")
    
    # 3. Verifica se o usuário atual já tem uma conexão Apple
    user_conn = await conn_repo.find_by_user_id(current_user["_id"], "apple")
    if user_conn:
        raise HTTPException(status_code=400, detail="Você já possui uma conta da Apple vinculada")
    
    # 4. Cria o vínculo
    await conn_repo.create_connection({
        "user_id": current_user["_id"],
        "provider": "apple",
        "provider_user_id": apple_id,
        "email": email
    })
    
    return {"status": "success", "detail": "Conta Apple vinculada com sucesso"}

@router.post("/google/link")
async def google_link(data: GoogleLink, db=Depends(get_db), current_user = Depends(get_current_user_optional)):
    payload = await extract_google_data(data.temp_token)

    user_repo = UserRepository(db)
    conn_repo = ConnectionRepository(db)

    user = None
    if current_user:
        user = current_user
    elif data.username and data.password:
        user = await user_repo.find_by_email(data.username)
        if not user:
            user = await user_repo.find_by_username(data.username)
        
        if not user or not verify_password(data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
    else:
        raise HTTPException(status_code=401, detail="Credenciais necessárias para vínculo")

    # Verifica se já existe uma conexão para este ID do Google
    existing_conn = await conn_repo.find_by_provider_id(payload["provider"], payload["provider_user_id"])
    if existing_conn:
        raise HTTPException(status_code=400, detail="Esta conta do Google já está vinculada a um usuário")

    # Verifica se o usuário já tem uma conexão Google
    user_conn = await conn_repo.find_by_user_id(user["_id"], payload["provider"])
    if user_conn:
        raise HTTPException(status_code=400, detail="Este usuário já possui uma conta do Google vinculada")

    await conn_repo.create_connection({
        "user_id": user["_id"],
        "provider": payload["provider"],
        "provider_user_id": payload["provider_user_id"],
        "email": payload["email"]
    })

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/connections")
async def get_connections(db=Depends(get_db), current_user=Depends(get_current_user)):
    conn_repo = ConnectionRepository(db)
    connections = await conn_repo.find_all_by_user(current_user["_id"])
    return connections

@router.delete("/connections/{provider}")
async def disconnect_provider(provider: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    conn_repo = ConnectionRepository(db)

    deleted = await conn_repo.delete_by_user_and_provider(current_user["_id"], provider)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conexão não encontrada")
    
    return {"detail": f"Conexão com {provider} removida com sucesso"}