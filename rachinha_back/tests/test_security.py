import os

import pytest
from fastapi import HTTPException

os.environ.setdefault("JWT_SECRET", "test-only-secret-with-enough-entropy")

from app.core.permissions import require_arena_manager, require_court_manager, require_creator


def test_creator_permission_rejects_regular_user():
    with pytest.raises(HTTPException) as error:
        require_creator({"role": ["user"]})

    assert error.value.status_code == 403


def test_creator_permission_accepts_creator():
    require_creator({"role": ["rachinha"]})


def test_arena_manager_accepts_owner_admin():
    arena = {"owner_id": "owner-1"}
    user = {"_id": "owner-1", "role": ["admin"]}

    require_arena_manager(arena, user)


def test_arena_manager_rejects_admin_from_another_arena():
    arena = {"owner_id": "owner-1"}
    user = {"_id": "owner-2", "role": ["admin"]}

    with pytest.raises(HTTPException) as error:
        require_arena_manager(arena, user)

    assert error.value.status_code == 403


def test_arena_manager_accepts_system_creator():
    arena = {"owner_id": "owner-1"}
    user = {"_id": "creator-1", "role": ["rachinha"]}

    require_arena_manager(arena, user)


def test_court_manager_accepts_owner_admin():
    court = {"owner_id": "owner-1"}
    user = {"_id": "owner-1", "role": ["admin"]}

    require_court_manager(court, user)


def test_court_manager_rejects_admin_from_another_court():
    court = {"owner_id": "owner-1"}
    user = {"_id": "owner-2", "role": ["admin"]}

    with pytest.raises(HTTPException) as error:
        require_court_manager(court, user)

    assert error.value.status_code == 403
