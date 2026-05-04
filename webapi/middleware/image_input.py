"""Converts pasted/uploaded images into the format the agent expects.

The original `GeneraticAgent.put_task(query, source, images=[...])` already
accepts an `images` kwarg — we just need to massage data URLs into the shape
our adapter middlewares expect (currently a list of dicts with `data` and `mime`).
"""
from __future__ import annotations
import base64, re
from .base import Middleware, RequestContext

_DATA_URL_RE = re.compile(r"^data:(?P<mime>[^;,]+)(?:;charset=[^;,]+)?(?:;base64)?,(?P<data>.*)$", re.S)

class ImageInputMiddleware(Middleware):
    name = "image_input"

    def on_input(self, ctx: RequestContext) -> None:
        if not ctx.images:
            return
        normalized = []
        for img in ctx.images:
            data_url = img.get("dataUrl") or img.get("data_url") or ""
            m = _DATA_URL_RE.match(data_url)
            if not m:
                continue
            mime = m.group("mime") or "image/png"
            b64 = m.group("data")
            try:
                base64.b64decode(b64, validate=True)
            except Exception:
                continue
            normalized.append({"mime": mime, "data": b64})
        ctx.images = normalized
        if normalized:
            ctx.metadata["has_vision_input"] = True
