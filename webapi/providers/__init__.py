"""Image-generation provider registry.

Adding a provider:
  1. Create `providers/myprovider.py` exposing `class MyProvider(ImageProvider)`
  2. Register it below in `_PROVIDERS`.
  3. Set `GA_IMAGE_PROVIDER=myprovider` in the env.

Existing code does not change.
"""
from __future__ import annotations
from .base import ImageProvider
from .mock import MockImageProvider
from .fal import FalImageProvider
from .openai_image import OpenAIImageProvider
from .gateway import GatewayImageProvider
from .gemini import GeminiImageProvider
from ..config import Config

_PROVIDERS = {
    "mock":    MockImageProvider,
    "fal":     FalImageProvider,
    "openai":  OpenAIImageProvider,
    "gateway": GatewayImageProvider,
    "gemini":  GeminiImageProvider,
}

_instance: ImageProvider | None = None

def get_image_provider() -> ImageProvider:
    global _instance
    if _instance is None:
        cls = _PROVIDERS.get(Config.IMAGE_PROVIDER, MockImageProvider)
        _instance = cls()
    return _instance

