from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional

@dataclass
class RequestContext:
    """Shared state for one chat request, passed through every middleware."""
    message_id: str
    query: str
    images: List[Dict[str, Any]] = field(default_factory=list)  # [{data_url, mime}]
    metadata: Dict[str, Any] = field(default_factory=dict)
    # If a middleware fully handles the request without invoking the agent,
    # it sets this to a list of SSE event strings and the agent step is skipped.
    short_circuit_events: Optional[List[str]] = None

class Middleware:
    """Base class. Override only the hooks you need."""
    name: str = "middleware"

    def on_input(self, ctx: RequestContext) -> None: ...
    def on_chunk(self, ctx: RequestContext, raw: str) -> Iterable[str]:
        if False: yield ""  # generator

    def on_done(self, ctx: RequestContext, full_text: str) -> Iterable[str]:
        if False: yield ""

    def on_abort(self, ctx: RequestContext) -> None: ...

