"""Handles `/image <prompt>` — generate an image directly without invoking the agent.

This is one of two ways the user can get images in the conversation:

  1. Explicit:  user types "/image a sunset over Tokyo"  → handled here.
  2. Implicit:  the agent calls a future `image_generate` tool → handled by
                a tool middleware (not implemented yet, see roadmap in README).

Either way, the actual generation goes through the swappable provider.
"""
from __future__ import annotations
import re, traceback
from typing import Iterable
from .base import Middleware, RequestContext
from ..protocol import (
    evt_message_start, evt_text_delta, evt_image,
    evt_message_end, evt_error,
)
from ..providers import get_image_provider

_IMAGE_CMD = re.compile(r"^\s*/image\s+(.+)", re.S)

class ImageCommandMiddleware(Middleware):
    name = "image_command"

    def on_input(self, ctx: RequestContext) -> None:
        m = _IMAGE_CMD.match(ctx.query or "")
        if not m:
            return
        prompt = m.group(1).strip()
        provider = get_image_provider()
        events = [evt_message_start(ctx.message_id)]
        events.append(evt_text_delta(ctx.message_id, f"Generating image: _{prompt}_\n\n"))
        try:
            url = provider.generate(prompt)
            events.append(evt_image(ctx.message_id, url, prompt=prompt, alt=prompt))
            events.append(evt_message_end(ctx.message_id, content=f"Generated image for: {prompt}"))
        except Exception as e:
            traceback.print_exc()
            events.append(evt_error(ctx.message_id, f"Image generation failed: {e}"))
            events.append(evt_message_end(ctx.message_id, content=""))
        ctx.short_circuit_events = events

