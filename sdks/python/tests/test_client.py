import pytest
import responses

from webpninja import (
    WebPNinja,
    AuthenticationError,
    ValidationError,
    PayloadTooLargeError,
    RateLimitError,
)

COMPRESS_URL = "https://api.webpninja.com/api/v1/compress"


@responses.activate
def test_compress_success(tmp_path):
    responses.add(
        responses.POST,
        COMPRESS_URL,
        body=b"fake-webp-bytes",
        status=200,
        content_type="image/webp",
    )

    photo = tmp_path / "photo.png"
    photo.write_bytes(b"fake-png-bytes")

    client = WebPNinja(api_key="webpninja_live_test")
    result = client.compress(str(photo), format="webp", quality=75)

    assert result == b"fake-webp-bytes"
    sent = responses.calls[0].request
    assert sent.headers["Authorization"] == "Bearer webpninja_live_test"


@responses.activate
def test_compress_accepts_raw_bytes():
    responses.add(responses.POST, COMPRESS_URL, body=b"ok", status=200)

    client = WebPNinja(api_key="webpninja_live_test")
    result = client.compress(b"raw-bytes", format="png")

    assert result == b"ok"


def test_compress_rejects_bad_input_type():
    client = WebPNinja(api_key="webpninja_live_test")
    with pytest.raises(TypeError):
        client.compress(12345, format="webp")


@responses.activate
def test_compress_maps_401_to_authentication_error():
    responses.add(
        responses.POST,
        COMPRESS_URL,
        json={"error": "Invalid or revoked API key"},
        status=401,
    )

    client = WebPNinja(api_key="webpninja_live_bad")
    with pytest.raises(AuthenticationError):
        client.compress(b"bytes", format="webp")


@responses.activate
def test_compress_maps_400_to_validation_error():
    responses.add(
        responses.POST,
        COMPRESS_URL,
        json={"error": "format must be one of: webp, jpeg, png, avif"},
        status=400,
    )

    client = WebPNinja(api_key="webpninja_live_test")
    with pytest.raises(ValidationError):
        client.compress(b"bytes", format="bogus")


@responses.activate
def test_compress_maps_413_with_plan_fields():
    responses.add(
        responses.POST,
        COMPRESS_URL,
        json={
            "error": "File exceeds your plan's upload limit",
            "maxUploadMb": 15,
            "fileSizeMb": 20,
        },
        status=413,
    )

    client = WebPNinja(api_key="webpninja_live_test")
    with pytest.raises(PayloadTooLargeError) as exc_info:
        client.compress(b"bytes", format="webp")

    assert exc_info.value.max_upload_mb == 15
    assert exc_info.value.file_size_mb == 20


@responses.activate
def test_compress_maps_429_with_quota_fields():
    responses.add(
        responses.POST,
        COMPRESS_URL,
        json={"error": "Daily quota exceeded", "quota": 15, "used": 15},
        status=429,
    )

    client = WebPNinja(api_key="webpninja_live_test")
    with pytest.raises(RateLimitError) as exc_info:
        client.compress(b"bytes", format="webp")

    assert exc_info.value.quota == 15
    assert exc_info.value.used == 15


def test_missing_api_key(monkeypatch):
    monkeypatch.delenv("WEBPNINJA_API_KEY", raising=False)
    with pytest.raises(ValueError):
        WebPNinja()
