from __future__ import annotations

from .base import Middleware, RequestContext
from .. import vision_client


class VisionInjectMiddleware(Middleware):
    name = "vision_inject"

    def on_input(self, ctx: RequestContext) -> None:
        if not ctx.images:
            return

        descriptions = []
        for index, image in enumerate(ctx.images, start=1):
            description = vision_client.describe_image(
                image.get("data") or "",
                image.get("mime") or "image/png",
                ctx.query,
            )
            descriptions.append(f"图{index}：{description}")

        if not descriptions:
            return

        original_query = ctx.query or ""
        ctx.query = "[用户上传图片描述]\n" + "\n".join(descriptions) + f"\n\n用户原话：{original_query}"
        ctx.images = []
        ctx.metadata["vision_descriptions_injected"] = True
