"""Middleware pipeline.

Each middleware is a class with optional methods:

    on_input(ctx)       -> may mutate ctx.query / ctx.images, may set ctx.short_circuit_events
    on_chunk(ctx, raw)  -> generator yielding SSE event strings; receives raw text chunks
                           from the agent and decides how to translate them
    on_done(ctx, full)  -> generator yielding final SSE events
    on_abort(ctx)       -> cleanup

All methods are optional. Middlewares are run in registered order for input
and chunks; on_done runs in reverse order.
"""
from .base import Middleware, RequestContext
from .image_input import ImageInputMiddleware
from .vision_inject import VisionInjectMiddleware
from .image_command import ImageCommandMiddleware
from .text_passthrough import TextPassthroughMiddleware

# Order matters: image_command must come BEFORE the agent runs.
DEFAULT_MIDDLEWARES = [
    ImageInputMiddleware(),
    VisionInjectMiddleware(),
    ImageCommandMiddleware(),    # short-circuits "/image <prompt>"
    TextPassthroughMiddleware(), # converts agent output chunks to text events
]
