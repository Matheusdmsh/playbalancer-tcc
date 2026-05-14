import jwt
import requests
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
from jose import jwt as jose_jwt
from typing import Optional, Dict, Any

class AppleAuthService:
    APPLE_PUBLIC_KEY_URL = "https://appleid.apple.com/auth/keys"

    @staticmethod
    async def verify_apple_token(id_token: str, client_id: str = None) -> Optional[Dict[str, Any]]:
        """
        Verifica o id_token enviado pela Apple.
        """
        try:
            from app.core.config import settings
            
            # --- DEBUG: Ver o que tem no token antes de validar ---
            unverified_payload = jose_jwt.get_unverified_claims(id_token)
            print(f"DEBUG APPLE TOKEN - AUD: {unverified_payload.get('aud')}")
            print(f"DEBUG APPLE TOKEN - ISS: {unverified_payload.get('iss')}")
            # ------------------------------------------------------

            # 1. Buscar chaves públicas da Apple
            response = requests.get(AppleAuthService.APPLE_PUBLIC_KEY_URL, timeout=10)
            if response.status_code != 200:
                print("Falha ao obter chaves públicas da Apple")
                return None
            
            apple_keys = response.json().get("keys", [])
            
            # 2. Extrair o header para o 'kid'
            header = jose_jwt.get_unverified_header(id_token)
            kid = header.get("kid")
            
            # Encontrar a chave correspondente
            key = next((k for k in apple_keys if k["kid"] == kid), None)
            if not key:
                print(f"Chave com kid {kid} não encontrada")
                return None

            # 3. Audiências aceitas (Tenta todas as cadastradas)
            allowed_audiences = [
                settings.APPLE_BUNDLE_ID, 
                settings.APPLE_SERVICE_ID,
                "com.rachinha.atena.web",
                "com.rachinha.atena",
                "com.rachinha.app"
            ]
            
            token_aud = unverified_payload.get("aud")
            if token_aud not in allowed_audiences:
                print(f"Audiência {token_aud} não está na lista permitida: {allowed_audiences}")
                return None
            
            # 4. Verificar o token
            # Passamos o token_aud como string única para satisfazer o python-jose
            decoded_token = jose_jwt.decode(
                id_token,
                key,
                algorithms=["RS256"],
                audience=token_aud,
                issuer="https://appleid.apple.com",
                options={
                    "verify_at_hash": False,
                    "verify_aud": True,
                    "verify_iat": False,
                    "verify_exp": True,
                    "verify_nbf": False
                }
            )
            
            return decoded_token
        except Exception as e:
            print(f"Erro na verificação Apple: {type(e).__name__} - {str(e)}")
            return None
