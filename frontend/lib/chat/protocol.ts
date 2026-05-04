/**
 * Chat Protocol - The contract between frontend and adapter.
 *
 * Extensibility rules:
 *  1. New event types are ADDITIVE. Old clients must safely ignore unknown types.
 *  2. Every event carries `type` and `payload`. Optional `meta` for routing hints.
 *  3. Each event has a stable `id`; deltas reference the message id they belong to.
 *
 * Adding a new feature usually means:
 *   - emit a new event type from a Python middleware
 *   - register a renderer for that type on the frontend
 * No existing code needs to change.
 */

export type Role = "user" | "assistant" | "system"

/* ------------------------------ Server → Client ------------------------------ */

export type SSEEvent =
  | { type: "session.start"; payload: { sessionId: string; ts: string } }
  | { type: "message.start"; payload: MessageStart }
  | { type: "message.delta"; payload: MessageDelta }
  | { type: "message.end"; payload: MessageEnd }
  | { type: "attachment"; payload: AttachmentEvent }
  | { type: "tool.call"; payload: ToolCallEvent }
  | { type: "system"; payload: SystemEvent }
  | { type: "session.end"; payload: { sessionId: string } }
  // Reserved escape hatch for plugin-defined events. Renderers are looked up by
  // `meta.renderer` so plugins can ship UI without expanding this union.
  | { type: "custom"; payload: Record<string, unknown>; meta?: { renderer: string } }

export interface MessageStart {
  id: string
  role: Role
  ts: string
  /** Optional grouping key — segments with same groupId render as one bubble cluster. */
  groupId?: string
}

export interface MessageDelta {
  id: string
  /** Incremental chunk to append. */
  delta: string
}

export interface MessageEnd {
  id: string
  /** Final, complete content (used to reconcile after streaming). */
  content: string
}

export interface AttachmentEvent {
  /** Attaches to a message id (or stands alone if omitted). */
  messageId?: string
  id: string
  kind: "image" | "file"
  url: string
  mime?: string
  alt?: string
  /** For generated images: the prompt used. */
  prompt?: string
  /** Provider that produced it, for badges. */
  source?: string
}

export interface ToolCallEvent {
  id: string
  messageId?: string
  name: string
  args?: Record<string, unknown>
  status: "running" | "done" | "error"
  resultPreview?: string
}

export interface SystemEvent {
  level: "info" | "warning" | "error" | "ok"
  text: string
}

/* ------------------------------ Client → Server ------------------------------ */

export interface ChatRequest {
  query: string
  attachments?: ClientAttachment[]
  /** Equivalent to original `source` field — defaults to "user". */
  source?: "user" | "auto"
}

export interface ClientAttachment {
  kind: "image" | "file"
  /** data: URL with base64 payload. The adapter strips & forwards bytes. */
  dataUrl: string
  name?: string
  mime?: string
}

/* ------------------------------ Internal model ------------------------------ */

/**
 * Normalized message used by the UI store. Bubbles are rendered by looking
 * up a renderer for `kind` in the renderer registry.
 */
export interface ChatMessage {
  id: string
  role: Role
  ts: string
  /** Streaming text content; may be empty for non-text bubbles. */
  content: string
  /** Bubble kind — drives renderer selection. */
  kind: "text" | "image" | "tool" | "system" | "custom"
  /** True while the server is still streaming this message. */
  streaming?: boolean
  /** Attached images / files (in render order). */
  attachments?: AttachmentEvent[]
  /** Tool calls referenced by this message. */
  toolCalls?: ToolCallEvent[]
  /** For `kind: "custom"`, the renderer key registered by a plugin. */
  rendererKey?: string
  /** Free-form payload passed to custom renderers. */
  payload?: Record<string, unknown>
}

