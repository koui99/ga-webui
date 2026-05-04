/**
 * Default renderers shipped with the app. Plugins can register more by calling
 * registerRenderer() in their module's top-level (loaded once via the
 * `plugins/index.ts` barrel).
 */

import { registerRenderer, setFallbackRenderer } from "@/lib/chat/registry"
import { TextRenderer } from "./text-renderer"
import { ImageRenderer } from "./image-renderer"

let registered = false

export function ensureDefaultRenderers() {
  if (registered) return
  registered = true
  registerRenderer("text", TextRenderer)
  registerRenderer("image", ImageRenderer)
  // System messages reuse text renderer (with markdown).
  registerRenderer("system", TextRenderer)
  // Tool-only bubbles still use text renderer (it knows to show toolCalls).
  registerRenderer("tool", TextRenderer)
  setFallbackRenderer(TextRenderer)
}

