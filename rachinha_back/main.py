from fastapi import FastAPI, Request
from fastapi import status
from jose import JWTError
import jwt
from app.interfaces.routes import auth, booking_message, court, booking, group, group_message, invites, notification, transaction, user, arena, feedback, beta_tester, upload, rachinha
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.services.auth_service import create_access_token
from app.core.config import get_db
import traceback
import time
from datetime import datetime, timezone


app = FastAPI(title="Rachinha API", root_path=get_settings().ROOT_PATH)

origins = [origin.strip() for origin in get_settings().ALLOWED_ORIGINS.split(",")]

# Configuração do Middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Authorization"],
)

@app.middleware("http")
async def api_error_tracking_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
        
    start_time = time.time()
    try:
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000
        
        db = get_db()
        # Salva a métrica básica de performance e status
        await db["api_metrics"].insert_one({
            "timestamp": datetime.now(timezone.utc),
            "status_code": response.status_code,
            "duration_ms": duration_ms
        })
        
        if response.status_code >= 500:
            await db["api_errors_5xx"].insert_one({
                "timestamp": datetime.now(timezone.utc),
                "path": request.url.path,
                "method": request.method,
                "status_code": response.status_code,
                "error_message": f"Server returned {response.status_code}",
                "traceback": ""
            })
        return response
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        db = get_db()
        await db["api_metrics"].insert_one({
            "timestamp": datetime.now(timezone.utc),
            "status_code": 500,
            "duration_ms": duration_ms
        })
        await db["api_errors_5xx"].insert_one({
            "timestamp": datetime.now(timezone.utc),
            "path": request.url.path,
            "method": request.method,
            "status_code": 500,
            "error_message": str(e),
            "traceback": traceback.format_exc()
        })
        raise e

@app.middleware("http")
async def token_renewal_middleware(request: Request, call_next):
    """
    Middleware que renova o token JWT em chamadas autenticadas bem-sucedidas.
    """
    # 1. Ignorar chamadas preflight (OPTIONS) - deve ser resolvido pelo CORSMiddleware
    if request.method == "OPTIONS":
        return await call_next(request)

    response = await call_next(request)

    # Verifica se a chamada foi bem sucedida e não é de autenticação
    is_success = response.status_code == status.HTTP_200_OK
    is_auth_route = request.url.path.startswith(auth.router.prefix)

    if is_success and not is_auth_route:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                # Decodifica para pegar o user_id e renovar o token
                payload = jwt.decode(token, get_settings().JWT_SECRET, algorithms=["HS256"])
                user_id: str = payload.get("sub")
                if user_id:
                    new_token = create_access_token(data={"sub": user_id})
                    response.headers["Authorization"] = f"Bearer {new_token}"
            except JWTError:
                pass

    return response

@app.get("/", tags=["Health"])
def running():
    return {"detail": f"Rachinha está rodando! {get_settings().ROOT_PATH}"}

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return {"detail": "Favicon not found!"}

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(group.router)
app.include_router(group_message.router)
app.include_router(transaction.router)
app.include_router(arena.router)
app.include_router(court.router)
app.include_router(booking.router)
app.include_router(booking_message.router)
app.include_router(invites.router)
app.include_router(notification.router)
app.include_router(feedback.router)
app.include_router(beta_tester.router)
app.include_router(upload.router)
app.include_router(rachinha.router)
