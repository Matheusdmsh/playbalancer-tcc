from fastapi import HTTPException, status


def user_roles(user: dict) -> set[str]:
    roles = user.get("role", [])
    if isinstance(roles, str):
        roles = [roles]
    return set(roles)


def require_creator(user: dict) -> None:
    if "rachinha" not in user_roles(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito aos responsáveis pelo sistema.",
        )


def require_admin_or_creator(user: dict) -> None:
    if not user_roles(user).intersection({"admin", "rachinha"}):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )


def require_arena_manager(arena: dict, user: dict) -> None:
    roles = user_roles(user)
    is_owner = str(arena.get("owner_id")) == str(user.get("_id"))
    if "rachinha" not in roles and not ("admin" in roles and is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para gerenciar esta arena.",
        )


def require_court_manager(court: dict, user: dict) -> None:
    roles = user_roles(user)
    is_owner = str(court.get("owner_id")) == str(user.get("_id"))
    if "rachinha" not in roles and not ("admin" in roles and is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para gerenciar esta quadra.",
        )
