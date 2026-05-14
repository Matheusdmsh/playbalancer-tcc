from pydantic_settings import BaseSettings
from motor.motor_asyncio import AsyncIOMotorClient
from functools import lru_cache

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "rachinha"
    JWT_SECRET: str = "segredo_super_secreto"
    ROOT_PATH: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173"
    FRONTEND_URL: str = "http://localhost:3000"

    BMAIL_API_URL: str = "https://api.rachinha.com/bmail/v2"
    BMAIL_CLIENT_ID: str = "seu_client_id_aqui"  
    BMAIL_CLIENT_SECRET: str = "seu_client_secret_aqui"  

    GOOGLE_CLIENT_ID: str = "YOUR_GOOGLE_CLIENT_ID"
    GOOGLE_CLIENT_SECRET: str = "YOUR_GOOGLE_CLIENT_SECRET"
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"

    GOOGLE_ANDROID_CLIENT_ID: str = "YOUR_GOOGLE_ANDROID_CLIENT_ID"

    GOOGLE_IOS_CLIENT_ID: str = "YOUR_GOOGLE_IOS_CLIENT_ID"

    APPLE_BUNDLE_ID: str = "com.rachinha.app"
    APPLE_SERVICE_ID: str = "com.rachinha.atena.web"

    STORAGE_API_URL: str = "https://api.btreedevs.com.br/bstorage"
    SERVICE_CLIENT_ID: str = "seu_client_id_aqui"  
    SERVICE_CLIENT_SECRET: str = "seu_client_secret_aqui"  
    MAX_FILE_SIZE_MB: int = 5

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

@lru_cache()
def get_settings():
    return settings

def get_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    return db
