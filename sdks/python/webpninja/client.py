import os
from pathlib import Path

import requests

from .errors import error_from_response

DEFAULT_BASE_URL = "https://api.webpninja.com"


class WebPNinja:
    def __init__(self, api_key=None, base_url=DEFAULT_BASE_URL):
        self.api_key = api_key or os.environ.get("WEBPNINJA_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Missing API key: pass one to WebPNinja(api_key) or set WEBPNINJA_API_KEY"
            )
        self.base_url = base_url

    def compress(self, input, format, quality=80, filename="image"):
        data, name = self._resolve_input(input, filename)

        response = requests.post(
            f"{self.base_url}/api/v1/compress",
            headers={"Authorization": f"Bearer {self.api_key}"},
            files={"file": (name, data)},
            data={"format": format, "quality": str(quality)},
        )

        if not response.ok:
            try:
                body = response.json()
            except ValueError:
                body = None
            raise error_from_response(response.status_code, body)

        return response.content

    def compress_to_file(self, input, output_path, format, quality=80):
        result = self.compress(input, format=format, quality=quality)
        Path(output_path).write_bytes(result)
        return result

    @staticmethod
    def _resolve_input(input, default_filename):
        if isinstance(input, (str, os.PathLike)):
            path = Path(input)
            return path.read_bytes(), path.name
        if isinstance(input, (bytes, bytearray)):
            return bytes(input), default_filename
        raise TypeError("input must be a file path or bytes")
