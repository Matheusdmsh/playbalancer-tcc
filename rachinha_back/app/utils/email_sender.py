# app/utils/email_sender.py
import asyncio
import smtplib
import ssl
from email.message import EmailMessage
from typing import List, Dict, Any
from pathlib import Path

from jinja2 import Template

from app.core.config import settings

class EmailSender:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_from = settings.SMTP_FROM or settings.SMTP_USER
        self.template_dir = Path(__file__).parent.parent / "templates" / "emails"

    def _validate_settings(self) -> None:
        missing = [
            name
            for name, value in {
                "SMTP_HOST": self.smtp_host,
                "SMTP_USER": self.smtp_user,
                "SMTP_PASSWORD": self.smtp_password,
                "SMTP_FROM": self.smtp_from,
            }.items()
            if not value
        ]
        if missing:
            raise ValueError(
                "Configuração SMTP incompleta. Preencha: " + ", ".join(missing)
            )

    def _load_template(self, template_name: str) -> str:
        """Carrega o conteúdo de um template HTML do diretório de templates."""
        template_path = self.template_dir / f"{template_name}.html"
        if not template_path.exists():
            raise FileNotFoundError(f"Template de e-mail não encontrado: {template_path}")
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()

    def _send_message(self, message: EmailMessage) -> None:
        context = ssl.create_default_context()
        with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=30) as smtp:
            smtp.ehlo()
            smtp.starttls(context=context)
            smtp.ehlo()
            smtp.login(self.smtp_user, self.smtp_password)
            smtp.send_message(message)

    async def send_email(self,
                         template_name: str,
                         subject: str,
                         recipients: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Envia e-mails usando SMTP com TLS.
        template_name: Nome do arquivo HTML do template (sem a extensão .html).
        subject: Assunto do e-mail.
        recipients: Lista de dicionários, cada um com 'email' e 'variables'.
                    Ex: [{"email": "user@example.com", "variables": {"name": "João"}}]
        """
        self._validate_settings()
        template = Template(self._load_template(template_name))
        sent_recipients: List[str] = []

        for recipient in recipients:
            email = recipient.get("email")
            if not email:
                raise ValueError("Destinatário sem endereço de e-mail.")

            variables = {
                "app_url": settings.FRONTEND_URL.rstrip("/"),
                **(recipient.get("variables") or {}),
            }
            message = EmailMessage()
            message["From"] = self.smtp_from
            message["To"] = email
            message["Subject"] = Template(subject).render(**variables)
            message.set_content("Este e-mail contém uma versão HTML. Abra-o em um cliente de e-mail compatível.")
            message.add_alternative(template.render(**variables), subtype="html")

            await asyncio.to_thread(self._send_message, message)
            sent_recipients.append(email)

        return {"sent": len(sent_recipients), "recipients": sent_recipients}
