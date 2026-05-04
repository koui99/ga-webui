from __future__ import annotations
import urllib.parse
from .base import ImageProvider

class MockImageProvider(ImageProvider):
    """Default — returns a placeholder image. No API key required."""
    name = "mock"

    def generate(self, prompt: str, *, size: str = "1024x1024") -> str:
        q = urllib.parse.quote(prompt[:80])
        # placehold.co accepts plain query text; readable in dev.
        return f"https://placehold.co/{size.replace('x', 'x')}/1a1714/faf9f6/png?text={q}"

