from fastapi import APIRouter, Depends
from app.core.config import get_db
from app.domain.repositories.beta_tester_repository import BetaTesterRepository
from app.interfaces.schemas.beta_tester import EmailCollectionRequest, EmailOut
from app.services.beta_tester_service import BetaTesterService
from app.utils.email_sender import EmailSender 

router = APIRouter(tags=["Users Beta"])

email_sender = EmailSender()


@router.post("/collect_email", response_model=dict)
async def collect_email(email: EmailCollectionRequest, db=Depends(get_db)):
    repo = BetaTesterRepository(db)
    service = BetaTesterService(repo)


    try:
        await email_sender.send_email(
            template_name="user_beta",
            subject="Você foi convidado para o Beta do Rachinha.com no Android",
            recipients=[{"email": email.email, "variables": {"name": email.email.split("@")[0]}}]

        )
        await email_sender.send_email(
            template_name="user_beta",
            subject="Novo usuario no beta",
            recipients=[{"email": 'labsatena@gmail.com', "variables": {"name": email.email}}]

        )
        await service.collect_email(email.email)
        return {"detail": "E-mail coletado com sucesso!"}
    except Exception as e:
        print(f"Erro ao coletar e-mail: {e}")
        return {"detail": "Ocorreu um erro ao coletar o e-mail."}

@router.get("/collected_emails", response_model=list[EmailOut])
async def get_all_emails(db=Depends(get_db)):
    repo = BetaTesterRepository(db)
    service = BetaTesterService(repo)

    emails = await service.get_all_emails()
    return emails