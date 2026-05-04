from __future__ import annotations
import os
from .base import ImageProvider
from ..config import Config

class FalImageProvider(ImageProvider):
    name = "fal"

    def __init__(self):
        if not Config.FAL_KEY:
            raise RuntimeError("FAL_KEY env var required for fal provider")
        os.environ["FAL_KEY"] = Config.FAL_KEY

    def generate(self, prompt: str, *, size: str = "1024x1024") -> str:
        try:
            import fal_client  # type: ignore
        except ImportError as e:
            raise RuntimeError("pip install fal-client") from e
        result = fal_client.subscribe(
            "fal-ai/flux/schnell",
            arguments={"prompt": prompt, "image_size": "landscape_4_3"},
            with_logs=False,
        )
        return result["images"][0]["url"]

