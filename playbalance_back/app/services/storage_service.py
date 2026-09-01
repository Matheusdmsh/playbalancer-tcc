import httpx
from datetime import datetime, timezone, timedelta
from app.core.config import get_settings

settings = get_settings()

class StorageService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(StorageService, cls).__new__(cls)
            cls._instance.access_token = None
            cls._instance.expires_at = datetime.min.replace(tzinfo=timezone.utc)
        return cls._instance

    async def get_access_token(self) -> str:
        now = datetime.now(timezone.utc)
        if self.access_token and now < self.expires_at:
            return self.access_token

        if not settings.SERVICE_CLIENT_ID or not settings.SERVICE_CLIENT_SECRET:
            raise ValueError("Credenciais do serviço de storage não configuradas.")

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{settings.STORAGE_API_URL}/auth/service-token",
                    data={
                        "grant_type": "password",
                        "username": settings.SERVICE_CLIENT_ID,
                        "password": settings.SERVICE_CLIENT_SECRET,
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                response.raise_for_status()
                data = response.json()
                self.access_token = data["access_token"]
                # Expires in gives seconds. We subtract 5 minutes to be safe.
                expires_in = data.get("expires_in", 3600)
                self.expires_at = now + timedelta(seconds=expires_in - 300)
                return self.access_token
            except httpx.HTTPStatusError as e:
                raise Exception(f"Erro ao autenticar no storage: {e.response.text}")
            except Exception as e:
                raise Exception(f"Falha ao autenticar com o serviço de storage: {str(e)}")

    async def upload_file(self, file: bytes, filename: str, content_type: str, new_name: str) -> str:
        token = await self.get_access_token()
        
        async with httpx.AsyncClient() as client:
            try:
                files = {'file': (filename, file, content_type)}
                response = await client.post(
                    f"{settings.STORAGE_API_URL}/files/upload",
                    params={"newname": new_name},
                    files=files,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/json"
                    }
                )
                response.raise_for_status()
                if response.status_code == 201:
                    data = response.json()
                    if "fullpath" in data:
                        return data["fullpath"]
                raise Exception("Resposta inesperada ao fazer upload.")
            except httpx.HTTPStatusError as e:
                raise Exception(f"Erro no upload: {e.response.text}")
            except Exception as e:
                raise Exception(f"Falha ao upload: {str(e)}")

    async def delete_file(self, file_url: str) -> None:
        token = await self.get_access_token()
        try:
            filename = file_url.split('/')[-1]
            if not filename:
                raise ValueError("URL inválida.")
            
            origin = "storage"
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{settings.STORAGE_API_URL}/files/delete/{origin}/{filename}",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/json"
                    }
                )
                response.raise_for_status()
        except Exception as e:
            raise Exception(f"Não foi possível deletar arquivo: {str(e)}")
