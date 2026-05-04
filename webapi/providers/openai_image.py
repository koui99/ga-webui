from __future__ import annotations
from .base import ImageProvider
from ..config import Config

class OpenAIImageProvider(ImageProvider):
    name = "openai"

    def __init__(self):
        if not Config.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY env var required for openai provider")

    def generate(self, prompt: str, *, size: str = "1024x1024") -> str:
        try:
            from openai import OpenAI  # type: ignore
        except ImportError as e:
            raise RuntimeError("pip install openai") from e
        client = OpenAI(api_key=Config.OPENAI_API_KEY)
        resp = client.images.generate(
            model="gpt-image-1",
            prompt=prompt,
            size=size,
            n=1,
        )
        d = resp.data[0]
        if getattr(d, "url", None):
            return d.url
        if getattr(d, "b64_json", None):
            return f"data:image/png;base64,{d.b64_json}"
        raise RuntimeError("No image data returned")

