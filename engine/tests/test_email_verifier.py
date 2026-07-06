from unittest.mock import MagicMock

import pytest

from src.core.base import ConfigurationError
from src.verification.email_verifier import EmailVerifier


def make_response(json_body):
    response = MagicMock()
    response.raise_for_status = MagicMock()
    response.json.return_value = json_body
    return response


def test_requires_api_key(monkeypatch):
    monkeypatch.delenv("ZEROBOUNCE_API_KEY", raising=False)
    with pytest.raises(ConfigurationError):
        EmailVerifier()


@pytest.mark.parametrize(
    "raw_status,expected",
    [
        ("valid", "valid"),
        ("catch-all", "risky"),
        ("unknown", "risky"),
        ("spamtrap", "invalid"),
        ("abuse", "invalid"),
        ("do_not_mail", "invalid"),
        ("invalid", "invalid"),
        ("some-unmapped-status", "risky"),
    ],
)
def test_verify_maps_zerobounce_status(raw_status, expected):
    session = MagicMock()
    session.get.return_value = make_response({"status": raw_status, "sub_status": "test"})
    verifier = EmailVerifier(api_key="fake-key", session=session)

    result = verifier.verify("someone@example.com")

    assert result.status == expected
    assert result.email == "someone@example.com"


def test_verify_records_reason():
    session = MagicMock()
    session.get.return_value = make_response({"status": "invalid", "sub_status": "mailbox_not_found"})
    verifier = EmailVerifier(api_key="fake-key", session=session)

    result = verifier.verify("bad@example.com")

    assert result.reason == "mailbox_not_found"
