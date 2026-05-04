/**
 * Renderer & Input-Plugin registries.
 *
 * Why a registry instead of a switch statement:
 *   - Adding/removing a feature is a one-file change (register/unregister).
 *   - Plugins can inject UI without touching ChatStream / ChatInput.
 *   - Server can send unknown event types; we fall back gracefully.
 *
 * Conventions:
 *   - Renderer keys are namespaced ("text", "image", "tool", "image_gen", ...).
 *   - Plugins MUST register on module load (top-level call).
 */

import type { ComponentType } from "react"
import type { ChatMessage } from "./protocol"

export interface RendererProps {
  message: ChatMessage
  /** True if this is the last assistant message and still streaming. */
  isStreamingTail?: boolean
}

export type MessageRenderer = ComponentType<RendererProps>

/* ----------------------------- Message renderers ---------------------------- */

const renderers = new Map<string, MessageRenderer>()
let fallback: MessageRenderer | null = null

export function registerRenderer(key: string, component: MessageRenderer) {
  renderers.set(key, component)
}

export function setFallbackRenderer(component: MessageRenderer) {
  fallback = component
}

export function resolveRenderer(message: ChatMessage): MessageRenderer | null {
  // For custom kind, plugins use rendererKey; otherwise route by kind.
  const key = message.kind === "custom" ? (message.rendererKey ?? "text") : message.kind
  return renderers.get(key) ?? renderers.get("text") ?? fallback
}

/* ------------------------------ Input plugins ------------------------------ */

/**
 * An input plugin can:
 *   - intercept paste / drop events to add attachments
 *   - add buttons next to the input
 *   - intercept submit to handle slash commands locally
 */
export interface InputPluginContext {
  /** Add a chip-style attachment to be sent with the next message. */
  addAttachment: (a: { kind: "image" | "file"; dataUrl: string; name?: string; mime?: string }) => void
  /** Replace the textarea value. */
  setText: (v: string) => void
  /** Get the current textarea value. */
  getText: () => string
  /** Trigger a normal submit (forwards to backend). */
  submit: () => void
  /** Push a transient toast. */
  toast: (text: string, level?: "info" | "warning" | "error" | "ok") => void
}

export interface InputPlugin {
  /** Stable id, used for dedupe. */
  id: string
  /**
   * Optional. Return true if the plugin handled this submit (skip backend).
   * Use this for slash commands that have client-side fast paths.
   */
  onSubmit?: (text: string, ctx: InputPluginContext) => boolean | Promise<boolean>
  /**
   * Optional. Called for every paste event in the input area. Return true
   * to mark consumed (the default text-paste will be skipped).
   */
  onPaste?: (e: ClipboardEvent, ctx: InputPluginContext) => boolean | Promise<boolean>
  /**
   * Optional. Buttons rendered inside the input toolbar (e.g., "+ image gen").
   */
  ToolbarButton?: ComponentType<{ ctx: InputPluginContext }>
}

const plugins: InputPlugin[] = []

export function registerInputPlugin(p: InputPlugin) {
  if (plugins.find((x) => x.id === p.id)) return
  plugins.push(p)
}

export function listInputPlugins(): InputPlugin[] {
  return plugins.slice()
}

