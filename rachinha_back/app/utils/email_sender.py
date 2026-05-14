# app/utils/email_sender.py
import httpx
import json
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from pathlib import Path

from app.core.config import settings

class EmailSender:
    def __init__(self):
        self.bmail_api_url = settings.BMAIL_API_URL
        self.client_id = settings.BMAIL_CLIENT_ID
        self.client_secret = settings.BMAIL_CLIENT_SECRET
        self.access_token = None
        self.token_expires_at = None
        self.template_dir = Path(__file__).parent.parent / "templates" / "emails"

    async def _get_access_token(self) -> str:
        """Obtém ou renova o token de acesso do serviço bmail."""
        now = datetime.now(timezone.utc)
        if self.access_token and self.token_expires_at and self.token_expires_at > now + timedelta(minutes=5):
            return self.access_token

        token_url = f"{self.bmail_api_url}/auth/service-token"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    token_url,
                    data={
                        # Alterado de "client_credentials" para "password" conforme erro 422
                        "grant_type": "password",
                        "username": self.client_id,
                        "password": self.client_secret,
                        "scope": "email:send"
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                response.raise_for_status()
                token_data = response.json()
                self.access_token = token_data["access_token"]
                expires_in = token_data["expires_in"]
                self.token_expires_at = now + timedelta(seconds=expires_in)
                return self.access_token
            except httpx.HTTPStatusError as e:
                print(f"Erro HTTP ao obter token: {e.response.status_code} - {e.response.text}")
                raise ValueError("Falha ao obter token de autenticação para o serviço de e-mail.") from e
            except Exception as e:
                print(f"Erro inesperado ao obter token: {e}")
                raise

    def _load_template(self, template_name: str) -> str:
        """Carrega o conteúdo de um template HTML do diretório de templates."""
        template_path = self.template_dir / f"{template_name}.html"
        if not template_path.exists():
            raise FileNotFoundError(f"Template de e-mail não encontrado: {template_path}")
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()

    async def send_email(self,
                         template_name: str,
                         subject: str,
                         recipients: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Envia um e-mail usando o serviço bmail.
        template_name: Nome do arquivo HTML do template (sem a extensão .html).
        subject: Assunto do e-mail.
        recipients: Lista de dicionários, cada um com 'email' e 'variables'.
                    Ex: [{"email": "user@example.com", "variables": {"name": "João"}}]
        """
        access_token = await self._get_access_token()
        email_send_url = f"{self.bmail_api_url}/email/send"

        html_content = self._load_template(template_name)

        payload = {
            "subject": subject,
            "html": html_content,
            "recipients": recipients
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(email_send_url, json=payload, headers=headers, timeout=30.0)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                print(f"Erro HTTP ao enviar e-mail: {e.response.status_code} - {e.response.text}")
                raise ValueError(f"Falha ao enviar e-mail: {e.response.text}") from e
            except Exception as e:
                print(f"Erro inesperado ao enviar e-mail: {e}")
                raise