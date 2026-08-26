import pytest

from app.services.group_service import GroupService


class FakeGroupRepository:
    def __init__(self):
        self.removals = []
        self.updates = []
        self.deletions = []
        self.admin_additions = []
        self.member_additions = []

    async def get_by_id(self, _group_id):
        return {
            "owner_id": "owner-1",
            "admins": ["admin-1"],
            "members": [
                {"id": "owner-1"},
                {"id": "admin-1"},
                {"id": "member-1"},
                {"id": "member-2"},
            ],
        }

    async def remove_member(self, group_id, member_id):
        self.removals.append((group_id, member_id))
        return False

    async def update_partial(self, group_id, data):
        self.updates.append((group_id, data))
        return True

    async def delete(self, group_id):
        self.deletions.append(group_id)
        return False

    async def add_admin(self, group_id, user_id):
        self.admin_additions.append((group_id, user_id))
        return False

    async def add_member(self, group_id, user_id, skill_level):
        self.member_additions.append((group_id, user_id, skill_level))
        return False


class FakeUserRepository:
    async def get_user_by_id(self, user_id):
        return {"_id": user_id, "is_placeholder": False}


@pytest.mark.asyncio
@pytest.mark.parametrize("actor_id", ["owner-1", "admin-1"])
async def test_owner_and_admin_can_remove_regular_member(actor_id):
    repository = FakeGroupRepository()
    service = GroupService(group_repo=repository)

    await service.remove_member_from_group(actor_id, "group-1", "member-2")

    assert repository.removals == [("group-1", "member-2")]


@pytest.mark.asyncio
async def test_regular_member_cannot_remove_another_member():
    repository = FakeGroupRepository()
    service = GroupService(group_repo=repository)

    with pytest.raises(ValueError, match="Only group admins"):
        await service.remove_member_from_group("member-1", "group-1", "member-2")

    assert repository.removals == []


@pytest.mark.asyncio
@pytest.mark.parametrize("actor_id", ["owner-1", "admin-1"])
async def test_group_owner_cannot_be_removed_directly(actor_id):
    repository = FakeGroupRepository()
    service = GroupService(group_repo=repository)

    with pytest.raises(ValueError, match="Cannot remove group owner"):
        await service.remove_member_from_group(actor_id, "group-1", "owner-1")

    assert repository.removals == []


@pytest.mark.asyncio
@pytest.mark.parametrize("actor_id", ["owner-1", "admin-1"])
async def test_owner_and_admin_can_edit_group(actor_id):
    repository = FakeGroupRepository()
    service = GroupService(group_repo=repository)

    assert await service.update_group(actor_id, "group-1", {"name": "Editado"}) is True
    assert repository.updates[0][0] == "group-1"
    assert repository.updates[0][1]["name"] == "Editado"


@pytest.mark.asyncio
async def test_regular_member_cannot_edit_group():
    repository = FakeGroupRepository()
    service = GroupService(group_repo=repository)

    with pytest.raises(ValueError, match="Only group admins"):
        await service.update_group("member-1", "group-1", {"name": "Bloqueado"})

    assert repository.updates == []


@pytest.mark.asyncio
@pytest.mark.parametrize("actor_id", ["admin-1", "member-1"])
async def test_only_owner_can_delete_group(actor_id):
    repository = FakeGroupRepository()
    service = GroupService(group_repo=repository)

    with pytest.raises(ValueError, match="Only the group owner"):
        await service.delete_group(actor_id, "group-1")

    assert repository.deletions == []


@pytest.mark.asyncio
async def test_owner_reaches_group_deletion_repository():
    repository = FakeGroupRepository()
    service = GroupService(group_repo=repository)

    assert await service.delete_group("owner-1", "group-1") is False
    assert repository.deletions == ["group-1"]


@pytest.mark.asyncio
@pytest.mark.parametrize("actor_id", ["admin-1", "member-1"])
async def test_only_owner_can_promote_admin(actor_id):
    repository = FakeGroupRepository()
    service = GroupService(group_repo=repository, user_repo=FakeUserRepository())

    with pytest.raises(ValueError, match="Only the group owner"):
        await service.add_admin("group-1", "member-1", actor_id)

    assert repository.admin_additions == []


class FakeEmailSender:
    def __init__(self):
        self.calls = []

    async def send_email(self, **kwargs):
        self.calls.append(kwargs)


@pytest.mark.asyncio
async def test_added_member_receives_group_invite_email():
    repository = FakeGroupRepository()
    service = GroupService(
        group_repo=repository,
        user_repo=FakeUserRepository(),
        email_sender=FakeEmailSender(),
    )

    await service.add_member_to_group("owner-1", "group-1", "new-member", 3)

    assert repository.member_additions == [("group-1", "new-member", 3)]


@pytest.mark.asyncio
@pytest.mark.parametrize("actor_id", ["owner-1", "admin-1"])
async def test_owner_and_admin_can_add_member(actor_id):
    repository = FakeGroupRepository()
    service = GroupService(group_repo=repository, user_repo=FakeUserRepository())

    await service.add_member_to_group(actor_id, "group-1", "new-member", 3)

    assert repository.member_additions == [("group-1", "new-member", 3)]


@pytest.mark.asyncio
async def test_regular_member_cannot_add_member():
    repository = FakeGroupRepository()
    service = GroupService(group_repo=repository, user_repo=FakeUserRepository())

    with pytest.raises(ValueError, match="Only group admins"):
        await service.add_member_to_group("member-1", "group-1", "new-member", 3)

    assert repository.member_additions == []
