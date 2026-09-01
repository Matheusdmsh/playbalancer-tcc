from fastapi import HTTPException, status


def user_roles(user: dict) -> set[str]:
    roles = user.get("role", [])
    if isinstance(roles, str):
        roles = [roles]
    return set(roles)


def require_creator(user: dict) -> None:
    if "playbalance_owner" not in user_roles(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito aos responsáveis pelo sistema.",
        )


def require_admin_or_creator(user: dict) -> None:
    if not user_roles(user).intersection({"admin", "playbalance_owner"}):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )
