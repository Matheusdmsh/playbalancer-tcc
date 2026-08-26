from pydantic_settings import BaseSettings, SettingsConfigDict
from motor.motor_asyncio import AsyncIOMotorClient
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "rachinha"
    JWT_SECRET: str
    ROOT_PATH: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    COOKIE_SECURE: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173"
    FRONTEND_URL: str = "http://localhost:3000"

    BMAIL_API_URL: str = "https://api.rachinha.com/bmail/v2"
    BMAIL_CLIENT_ID: str = "seu_client_id_aqui"  
    BMAIL_CLIENT_SECRET: str = "seu_client_secret_aqui"  

    STORAGE_API_URL: str = "https://api.btreedevs.com.br/bstorage"
    SERVICE_CLIENT_ID: str = "seu_client_id_aqui"  
    SERVICE_CLIENT_SECRET: str = "seu_client_secret_aqui"  
    MAX_FILE_SIZE_MB: int = 5

settings = Settings()
mongo_client = AsyncIOMotorClient(settings.MONGODB_URL)

@lru_cache()
def get_settings():
    return settings

def get_db():
    return mongo_client[settings.DB_NAME]

def close_db():
    mongo_client.close()
