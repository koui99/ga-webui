"use client"

/**
 * Image-generation plugin.
 *
 * Provides:
 *  1. A toolbar button that prefills "/image " into the input.
 *  2. Recognition of "/image <prompt>" — the adapter intercepts this slash
 *     command before the agent sees it and routes to a configured ImageProvider.
 *
 * The plugin itself doesn't talk to any image API — that's the adapter's job.
 * Swapping providers (fal/openai/gateway) is purely a server-side change.
 */

import { ImagePlus } from "lucide-react"
import type { InputPlugin } from "@/lib/chat/registry"

export const ImageGenPlugin: InputPlugin = {
  id: "image-gen",
  ToolbarButton: ({ ctx }) => (
    <button
      type="button"
      title="生成图片  ·  /image <描述>"
      onClick={() => {
        const cur = ctx.getText().trim()
        if (cur.startsWith("/image")) return
        ctx.setText(cur ? `/image ${cur}` : "/image ")
      }}
      className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <ImagePlus className="size-[18px]" aria-hidden="true" />
      <span className="sr-only">生成图片</span>
    </button>
  ),
}

