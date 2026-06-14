from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest

from hushh_mcp.services.push_tokens_service import PushTokensService

def test_upsert_user_push_token_returns_inserted_id():
    fake_db = Mock()

    fake_db.execute_raw.return_value = SimpleNamespace(
        data=[{"id": 123}],
        error=None,
    )

    with patch(
        "hushh_mcp.services.push_tokens_service.get_db",
        return_value=fake_db,
    ):
        service = PushTokensService()

        result = service.upsert_user_push_token(
            user_id="user1",
            token="abc",
            platform="web",
        )

    assert result == 123

def test_upsert_user_push_token_returns_none_when_no_row():
    fake_db = Mock()

    fake_db.execute_raw.return_value = SimpleNamespace(
        data=[],
        error=None,
    )

    with patch(
        "hushh_mcp.services.push_tokens_service.get_db",
        return_value=fake_db,
    ):
        service = PushTokensService()

        result = service.upsert_user_push_token(
            user_id="user1",
            token="abc",
            platform="web",
        )

    assert result is None

def test_upsert_user_push_token_raises_on_db_error():
    fake_db = Mock()

    fake_db.execute_raw.return_value = SimpleNamespace(
        data=[],
        error="boom",
    )

    with patch(
        "hushh_mcp.services.push_tokens_service.get_db",
        return_value=fake_db,
    ):
        service = PushTokensService()

        with pytest.raises(RuntimeError):
            service.upsert_user_push_token(
                user_id="user1",
                token="abc",
                platform="web",
            )

def test_delete_user_push_tokens_with_platform():
    fake_db = Mock()

    fake_db.execute_raw.return_value = SimpleNamespace(
        data=[{}, {}],
        error=None,
    )

    with patch(
        "hushh_mcp.services.push_tokens_service.get_db",
        return_value=fake_db,
    ):
        service = PushTokensService()

        deleted = service.delete_user_push_tokens(
            user_id="user1",
            platform="ios",
        )

    assert deleted == 2

    sql, params = fake_db.execute_raw.call_args.args

    assert "platform" in sql
    assert params["platform"] == "ios"

def test_delete_user_push_tokens_without_platform():
    fake_db = Mock()

    fake_db.execute_raw.return_value = SimpleNamespace(
        data=[{}],
        error=None,
    )

    with patch(
        "hushh_mcp.services.push_tokens_service.get_db",
        return_value=fake_db,
    ):
        service = PushTokensService()

        deleted = service.delete_user_push_tokens(
            user_id="user1",
        )

    assert deleted == 1

    sql, params = fake_db.execute_raw.call_args.args

    assert params == {"uid": "user1"}

def test_delete_user_push_tokens_raises_on_db_error():
    fake_db = Mock()

    fake_db.execute_raw.return_value = SimpleNamespace(
        data=[],
        error="boom",
    )

    with patch(
        "hushh_mcp.services.push_tokens_service.get_db",
        return_value=fake_db,
    ):
        service = PushTokensService()

        with pytest.raises(RuntimeError):
            service.delete_user_push_tokens(
                user_id="user1",
            )