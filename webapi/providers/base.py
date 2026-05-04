from __future__ import annotations
from abc import ABC, abstractmethod

class ImageProvider(ABC):
    name: str = "base"

    @abstractmethod
    def generate(self, prompt: str, *, size: str = "1024x1024") -> str:
        """Return an image URL (or data URL) the frontend can render directly."""
        raise NotImplementedError

