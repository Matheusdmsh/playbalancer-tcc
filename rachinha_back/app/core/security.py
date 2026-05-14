from fastapi import Depends, HTTPException, WebSocket, WebSocketException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import get_settings, settings, get_db
from app.domain.repositories.user_repository import UserRepository
from datetime import datetime, timezone
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login/swagger")

async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Credenciais inválidas ou token expirado", 
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        
        expiration_timestamp = payload.get("exp")
        if expiration_timestamp is None:
            raise credentials_exception
        
        expiration_datetime = datetime.fromtimestamp(expiration_timestamp, tz=timezone.utc)
        if expiration_datetime < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado", headers={"WWW-Authenticate": "Bearer"})
            
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception
    
    user = await UserRepository(db).find_by_id(user_id) 
    if user is None:
        raise credentials_exception

    return user

async def get_current_user_optional(token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl="auth/login/swagger", auto_error=False)), db=Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            return None
        return await UserRepository(db).find_by_id(user_id)
    except JWTError:
        return None

async def get_current_user_ws(websocket: WebSocket, db=Depends(get_db)):
    
    ws_credentials_exception = WebSocketException(
        code=status.WS_1008_POLICY_VIOLATION, 
        reason="Credenciais inválidas ou token ausente."
    )

    token: Optional[str] = None

    # 1. Tenta pegar o token do cookie 'rachinha_token'
    token = websocket.query_params.get("token")
    if not token:
        token = websocket.cookies.get("rachinha_token")

    if not token:
        # 2. Se não encontrar no cookie, tenta do header 'Authorization'
        auth_header = websocket.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    # Esta parte não é segura para produção, mas pode ser mantida para testes locais se necessário


    if not token:
        raise ws_credentials_exception

    try:
        settings = get_settings()
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        
        expiration_timestamp = payload.get("exp")
        if expiration_timestamp is None:
            raise ws_credentials_exception
        
        expiration_datetime = datetime.fromtimestamp(expiration_timestamp, tz=timezone.utc)

        if expiration_datetime < datetime.now(timezone.utc):
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Token expirado.")
            
        user_id: str = payload.get("sub")
        if user_id is None:
            raise ws_credentials_exception
        
        user_repo = UserRepository(db)
        user = await user_repo.find_by_id(user_id)
        
        if user is None:
            raise ws_credentials_exception
        return user
    except JWTError as e:
        raise ws_credentials_exception
    except Exception as e:
        raise ws_credentials_exception