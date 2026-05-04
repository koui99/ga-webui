"use client"

/**
 * Chat store — minimal hand-rolled state. Avoids pulling in a state lib so the
 * UI stays portable (could be reused in a Vite/static build later).
 *
 * The store consumes SSEEvents and produces ChatMessage[]. Events are reduced
 * by a pure function `applyEvent`, so plugins/tests can replay event sequences
 * deterministically.
 */

import { useSyncExternalStore } from "react"
import type { AttachmentEvent, ChatMessage, ClientAttachment, SSEEvent, ToolCallEvent } from "./protocol"

interface State {
  messages: ChatMessage[]
  streaming: boolean
  llms: { idx: number; name: string; current: boolean; custom?: boolean }[]
  currentLLM: number
  toast: { id: number; text: string; level: "info" | "warning" | "error" | "ok" } | null
}

const state: State = {
  messages: [],
  streaming: false,
  llms: [],
  currentLLM: 0,
  toast: null,
}

const listeners = new Set<() => void>()
let snapshot: State = { ...state }

function emit() {
  snapshot = {
    messages: state.messages,
    streaming: state.streaming,
    llms: state.llms,
    currentLLM: state.currentLLM,
    toast: state.toast,
  }
  listeners.forEach((listener) => listener())
}

function nowTs() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
}

function findOrCreate(id: string, role: ChatMessage["role"], ts: string): ChatMessage {
  const existing = state.messages.find((m) => m.id === id)
  if (existing) return existing
  const msg: ChatMessage = { id, role, ts, content: "", kind: "text", streaming: true }
  state.messages.push(msg)
  return msg
}

export function applyEvent(ev: SSEEvent) {
  switch (ev.type) {
    case "session.start": {
      state.streaming = true
      break
    }
    case "message.start": {
      findOrCreate(ev.payload.id, ev.payload.role, ev.payload.ts)
      break
    }
    case "message.delta": {
      const m = findOrCreate(ev.payload.id, "assistant", nowTs())
      m.content += ev.payload.delta
      m.streaming = true
      break
    }
    case "message.end": {
      const m = findOrCreate(ev.payload.id, "assistant", nowTs())
      m.content = ev.payload.content
      m.streaming = false
      break
    }
    case "attachment": {
      const att = ev.payload as AttachmentEvent
      if (att.messageId) {
        const m = findOrCreate(att.messageId, "assistant", nowTs())
        m.attachments = [...(m.attachments ?? []), att]
        // If a message has only attachments and no text yet, hint the renderer.
        if (!m.content) m.kind = "image"
      } else {
        // Standalone image bubble.
        state.messages.push({
          id: att.id,
          role: "assistant",
          ts: nowTs(),
          content: "",
          kind: "image",
          attachments: [att],
        })
      }
      break
    }
    case "tool.call": {
      const tc = ev.payload as ToolCallEvent
      const targetId = tc.messageId ?? tc.id
      const m = findOrCreate(targetId, "assistant", nowTs())
      const list = m.toolCalls ?? []
      const idx = list.findIndex((t) => t.id === tc.id)
      if (idx >= 0) list[idx] = tc
      else list.push(tc)
      m.toolCalls = list
      break
    }
    case "system": {
      state.toast = { id: Date.now(), text: ev.payload.text, level: ev.payload.level }
      break
    }
    case "session.end": {
      state.streaming = false
      for (const m of state.messages) m.streaming = false
      break
    }
    case "custom": {
      const id = (ev.payload.id as string) ?? `custom-${Date.now()}`
      state.messages.push({
        id,
        role: "assistant",
        ts: nowTs(),
        content: "",
        kind: "custom",
        rendererKey: ev.meta?.renderer,
        payload: ev.payload,
      })
      break
    }
  }
  // Re-clone arrays so React diffs detect changes.
  state.messages = state.messages.slice()
  emit()
}

export function pushUserMessage(query: string, attachments: ClientAttachment[]) {
  state.messages.push({
    id: `u-${Date.now()}`,
    role: "user",
    ts: nowTs(),
    content: query,
    kind: "text",
    attachments: attachments.map((a, i) => ({
      id: `att-${Date.now()}-${i}`,
      kind: a.kind,
      url: a.dataUrl,
      mime: a.mime,
      alt: a.name,
    })),
  })
  state.messages = state.messages.slice()
  emit()
}

export function pushAssistantMessage(msg: ChatMessage) {
  state.messages.push(msg)
  state.messages = state.messages.slice()
  emit()
}

export function setStreaming(v: boolean) {
  state.streaming = v
  emit()
}

export function setLLMs(llms: State["llms"], currentLLM: number) {
  state.llms = llms
  state.currentLLM = currentLLM
  emit()
}

export function showToast(text: string, level: State["toast"] extends infer T ? T extends { level: infer L } ? L : never : never = "info" as never) {
  state.toast = { id: Date.now(), text, level: level as never }
  emit()
}

export function dismissToast() {
  state.toast = null
  emit()
}

export function clearMessages() {
  state.messages = []
  emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useChatState(): State {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot,
  )
}

