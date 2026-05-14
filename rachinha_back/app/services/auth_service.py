from typing import Any, Dict
import bcrypt
from datetime import datetime, timedelta, timezone
import httpx
from jose import jwt, JWTError
from app.core.config import get_db, get_settings
from httpx_oauth.clients.google import GoogleOAuth2
import uuid
from fastapi import WebSocket, Depends, status, WebSocketException

from app.domain.repositories.user_repository import UserRepository


# Carrega as configurações uma vez para reutilização
settings = get_settings()

async def handle_google_login(code: str, client: GoogleOAuth2) -> Dict[str, Any]:
    """
    Lida com o callback do login do Google para obter informações do usuário.
    """
    token = await client.get_access_token(code, settings.GOOGLE_REDIRECT_URI)
    async with httpx.AsyncClient() as http_client:
        response = await http_client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token['access_token']}"}
        )
        response.raise_for_status()
        return response.json()

def hash_password(password: str) -> str:
    """
    Gera um hash seguro para uma senha.
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    """
    Verifica se uma senha corresponde ao seu hash.
    """
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """
    Cria um token de acesso JWT único e seguro.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    
    if expires_delta:
        expire = now + expires_delta
    else:
        # Usa a configuração de expiração do seu arquivo de settings
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # Adiciona o tempo de criação (iat) e um ID único (jti) para garantir que cada token seja único
    to_encode.update({"iat": now})
    to_encode.update({"jti": str(uuid.uuid4())})
    
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")

async def get_current_user_ws(websocket: WebSocket, db=Depends(get_db)):
    """
    Dependência para autenticar usuários em conexões WebSocket.
    Aceita a conexão e valida o token do cookie.
    """
    await websocket.accept() # Aceita a conexão aqui

    ws_credentials_exception = WebSocketException(
        code=status.WS_1008_POLICY_VIOLATION, 
        reason="Credenciais inválidas ou token ausente."
    )
    token = websocket.cookies.get("access_token")
    if not token:
        raise ws_credentials_exception

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        expiration_timestamp = payload.get("exp")
        if expiration_timestamp is None or datetime.fromtimestamp(expiration_timestamp, tz=timezone.utc) < datetime.now(timezone.utc):
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Token expirado.")
            
        user_id: str = payload.get("sub")
        if user_id is None:
            raise ws_credentials_exception
        
        user_repo = UserRepository(db)
        user = await user_repo.find_by_id(user_id)
        
        if user is None:
            raise ws_credentials_exception
            
        return user
    except JWTError:
        raise ws_credentials_exception

def create_email_verification_token(user_id: str, expires_delta: timedelta = timedelta(hours=24)) -> str:
    """
    Cria um token JWT para verificação de e-mail.
    """
    to_encode = {"sub": str(user_id), "type": "email_verification"}
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    to_encode.update({"iat": datetime.now(timezone.utc)})
    to_encode.update({"jti": str(uuid.uuid4())})

    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")

def create_password_reset_token(user_id: str, expires_delta: timedelta = timedelta(minutes=60)) -> str:
    """
    Cria um token JWT para redefinição de senha.
    """
    to_encode = {"sub": str(user_id), "type": "password_reset"}
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    to_encode.update({"iat": datetime.now(timezone.utc)})
    to_encode.update({"jti": str(uuid.uuid4())})

    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")