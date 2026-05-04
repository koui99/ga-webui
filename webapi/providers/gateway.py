from __future__ import annotations
import httpx
from .base import ImageProvider
from ..config import Config

class GatewayImageProvider(ImageProvider):
    """Vercel AI Gateway image generation (e.g. google/gemini-3-flash-image)."""
    name = "gateway"

    def __init__(self):
        if not Config.AI_GATEWAY_API_KEY:
            raise RuntimeError("AI_GATEWAY_API_KEY env var required for gateway provider")

    def generate(self, prompt: str, *, size: str = "1024x1024") -> str:
        # Gateway exposes an OpenAI-compatible images endpoint.
        url = "https://ai-gateway.vercel.sh/v1/images/generations"
        r = httpx.post(
            url,
            headers={"Authorization": f"Bearer {Config.AI_GATEWAY_API_KEY}"},
            json={
                "model": "google/gemini-3-flash-image",
                "prompt": prompt,
                "size": size,
                "n": 1,
            },
            timeout=120,
        )
        r.raise_for_status()
        data = r.json()["data"][0]
        return data.get("url") or f"data:image/png;base64,{data['b64_json']}"

