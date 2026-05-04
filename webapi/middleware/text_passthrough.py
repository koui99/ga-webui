"""Default chunk handler — emits raw agent output as text deltas.

If you later add a structured-event middleware (e.g. parsing tool-call markdown
into typed `tool.call` events), put it BEFORE this one; this middleware then
acts as the catch-all for any chunks the structured middleware didn't consume.

Right now it does nothing fancy — the agent's own markdown is rich enough
that the frontend's markdown renderer handles tool blocks, code, etc.
"""
from __future__ import annotations
from typing import Iterable
from .base import Middleware, RequestContext
from ..protocol import evt_text_delta

class TextPassthroughMiddleware(Middleware):
    name = "text_passthrough"

    def on_chunk(self, ctx: RequestContext, raw: str) -> Iterable[str]:
        if raw:
            yield evt_text_delta(ctx.message_id, raw)

