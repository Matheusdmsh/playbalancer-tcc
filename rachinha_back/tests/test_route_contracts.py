from io import BytesIO

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from app.interfaces.routes import booking as booking_routes
from app.interfaces.routes import court as court_routes
from app.interfaces.routes import upload as upload_routes


class FakeBookingService:
    async def list_by_user(self, user_id):
        return [{"user_id": user_id}]


@pytest.mark.asyncio
async def test_booking_lookup_rejects_another_regular_user():
    with pytest.raises(HTTPException) as error:
        await booking_routes.list_bookings_by_user(
            "user-2",
            service=FakeBookingService(),
            user={"_id": "user-1", "role": ["user"]},
        )

    assert error.value.status_code == 403


@pytest.mark.asyncio
async def test_booking_lookup_accepts_current_user():
    result = await booking_routes.list_bookings_by_user(
        "user-1",
        service=FakeBookingService(),
        user={"_id": "user-1", "role": ["user"]},
    )

    assert result == [{"user_id": "user-1"}]


@pytest.mark.asyncio
async def test_list_my_courts_supplies_both_service_repositories(monkeypatch):
    received = {}

    class FakeCourtService:
        def __init__(self, court_repo, booking_repo):
            received["court_repo"] = court_repo
            received["booking_repo"] = booking_repo

        async def list_owner_courts(self, owner_id):
            return [{"owner_id": owner_id}]

    monkeypatch.setattr(court_routes, "CourtRepository", lambda _db: "court-repo")
    monkeypatch.setattr(court_routes, "BookingRepository", lambda _db: "booking-repo")
    monkeypatch.setattr(court_routes, "CourtService", FakeCourtService)

    result = await court_routes.list_my_courts(
        db=object(),
        user={"_id": "owner-1", "role": ["admin"]},
    )

    assert received == {
        "court_repo": "court-repo",
        "booking_repo": "booking-repo",
    }
    assert result == [{"owner_id": "owner-1"}]


@pytest.mark.asyncio
async def test_arena_upload_uses_repository_update_contract(monkeypatch):
    updates = []

    class FakeArenaRepository:
        def __init__(self, _db):
            pass

        async def get_arena_by_id(self, arena_id):
            return {"_id": arena_id, "owner_id": "owner-1"}

        async def update_partial(self, arena_id, data):
            updates.append((arena_id, data))
            return True

    class FakeStorageService:
        async def upload_file(self, *_args):
            return "https://storage.test/arena.png"

    monkeypatch.setattr(upload_routes, "ArenaRepository", FakeArenaRepository)
    monkeypatch.setattr(upload_routes, "StorageService", FakeStorageService)

    file = UploadFile(
        BytesIO(b"test-image"),
        filename="arena.png",
        headers=Headers({"content-type": "image/png"}),
    )

    result = await upload_routes.upload_arena_photo(
        "arena-1",
        file=file,
        db=object(),
        current_user={"_id": "owner-1", "role": ["admin"]},
    )

    assert result["url"] == "https://storage.test/arena.png"
    assert updates == [
        ("arena-1", {"photo_url": "https://storage.test/arena.png"}),
    ]
