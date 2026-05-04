/**
 * Plugin barrel — registers all default plugins exactly once.
 * To disable a plugin, comment its line; to add one, drop a file in this
 * directory, export an `InputPlugin`, and register it here.
 */

import { registerInputPlugin } from "@/lib/chat/registry"
import { ImagePastePlugin } from "./image-paste-plugin"
import { ImageGenPlugin } from "./image-gen-plugin"

let registered = false

export function ensureDefaultPlugins() {
  if (registered) return
  registered = true
  registerInputPlugin(ImagePastePlugin)
  registerInputPlugin(ImageGenPlugin)
}

