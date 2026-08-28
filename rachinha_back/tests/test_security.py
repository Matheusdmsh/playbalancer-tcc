import os

import pytest
from fastapi import HTTPException

os.environ.setdefault("JWT_SECRET", "test-only-secret-with-enough-entropy")

from app.core.permissions import require_creator


def test_creator_permission_rejects_regular_user():
    with pytest.raises(HTTPException) as error:
        require_creator({"role": ["user"]})

    assert error.value.status_code == 403


def test_creator_permission_accepts_creator():
    require_creator({"role": ["rachinha"]})
