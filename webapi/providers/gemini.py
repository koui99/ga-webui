from __future__ import annotations
import base64, re
import httpx
from .base import ImageProvider
from ..config import Config

_BASE64_RE = re.compile(r"!\[.*?\]\(data:image/\w+;base64,([A-Za-z0-9+/=\s]+)\)")


class GeminiImageProvider(ImageProvider):
    """Gemini-native image generation via chat completions.

    Works with any endpoint that exposes Gemini-compatible
    ``/v1/chat/completions`` and returns inline base64 images in
    markdown format::

        ![Generated Image](data:image/png;base64,...)

    Supports: Google AI Studio, Vertex AI proxies, third-party
    Gemini-compatible gateways, etc.
    """

    name = "gemini"

    def __init__(self):
        if not Config.GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY env var required for gemini provider"
            )
        self._base_url = Config.GEMINI_BASE_URL.rstrip("/")
        self._api_key = Config.GEMINI_API_KEY
        self._model = Config.GEMINI_MODEL

    def generate(self, prompt: str, *, size: str = "1024x1024") -> str:
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self._model,
            "messages": [{"role": "user", "content": prompt}],
        }

        r = httpx.post(
            f"{self._base_url}/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=180,
        )
        r.raise_for_status()

        content = r.json()["choices"][0]["message"]["content"]

        # Try extracting base64 from markdown image syntax
        m = _BASE64_RE.search(content)
        if m:
            b64 = m.group(1).replace("\n", "").replace(" ", "")
            return f"data:image/png;base64,{b64}"

        # Fallback: maybe it's a plain URL
        if content.strip().startswith("http"):
            return content.strip()

        raise RuntimeError(
            "Gemini provider: could not extract image from response"
        )