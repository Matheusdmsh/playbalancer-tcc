import os

from fastapi.testclient import TestClient

os.environ.setdefault("JWT_SECRET", "test-only-secret-with-enough-entropy")

import main


class FakeCollection:
    async def insert_one(self, _document):
        return None


class FakeDatabase:
    def __getitem__(self, _name):
        return FakeCollection()


def test_invalid_token_does_not_turn_public_response_into_500(monkeypatch):
    monkeypatch.setattr(main, "get_db", lambda: FakeDatabase())

    with TestClient(main.app) as client:
        response = client.get(
            "/",
            headers={"Authorization": "Bearer invalid-test-token"},
        )

    assert response.status_code == 200
    assert response.json()["detail"].startswith("Rachinha está rodando!")
    assert "Authorization" not in response.headers
