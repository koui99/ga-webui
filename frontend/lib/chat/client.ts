"use client"

/**
 * SSE chat client. We POST the request (body has attachments → can be large)
 * and parse the streaming response manually. EventSource doesn't support POST.
 */

import { toast as sonnerToast } from "sonner"
import type { ChatRequest, SSEEvent } from "./protocol"
import { applyEvent, setStreaming } from "./store"

async function readErrorMessage(response: Response) {
  const text = await response.text().catch(() => response.statusText)
  if (!text) return response.statusText || "请求失败"

  try {
    const payload = JSON.parse(text) as { error?: string; message?: string }
    return payload.error || payload.message || text
  } catch {
    return text
  }
}

function notifyError(message: string) {
  sonnerToast.error("请求失败", { description: message })
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function emitSystemError(message: string) {
  applyEvent({ type: "system", payload: { level: "error", text: message } })
  notifyError(message)
}

function emitSystemInfo(message: string) {
  applyEvent({ type: "system", payload: { level: "info", text: message } })
}

function isAbortError(error: unknown) {
  return (error as { name?: string })?.name === "AbortError"
}

function isAdapterMissingMessage(message: string) {
  return message.includes("GENERIC_AGENT_API_URL is not configured")
}

function toUserMessage(message: string) {
  if (isAdapterMissingMessage(message)) {
    return "后端未配置：请设置 GENERIC_AGENT_API_URL 并确保适配服务已启动"
  }
  return message
}

function clearStreaming() {
  setStreaming(false)
}

function handleRequestFailure(message: string) {
  const userMessage = toUserMessage(message)
  emitSystemError(userMessage)
  clearStreaming()
}

function handleStreamAbort() {
  emitSystemInfo("已停止生成")
}

function handleStreamError(error: unknown) {
  handleRequestFailure(normalizeError(error))
}

function handleBadResponseMessage(message: string) {
  handleRequestFailure(message)
}

function resetActiveAbort(controller: AbortController) {
  if (activeAbort === controller) activeAbort = null
}

function finalizeRequest(controller: AbortController) {
  clearStreaming()
  resetActiveAbort(controller)
}

function notifyAbortRequestFailure() {
  sonnerToast.error("停止失败", { description: "未能通知后端终止当前任务" })
}

function fireAbortRequest() {
  fetch("/api/abort", { method: "POST" }).catch(() => {
    notifyAbortRequestFailure()
  })
}

function beginRequest() {
  abortChat(false)
  const controller = new AbortController()
  activeAbort = controller
  setStreaming(true)
  return controller
}

function parseFailureMessage(message: string) {
  return toUserMessage(message)
}

let activeAbort: AbortController | null = null

export async function sendChat(request: ChatRequest): Promise<void> {
  const controller = beginRequest()
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
    if (!response.ok) {
      handleBadResponseMessage(parseFailureMessage(await readErrorMessage(response)))
      return
    }
    if (!response.body) {
      handleBadResponseMessage("后端没有返回可读取的数据流")
      return
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let frameBoundaryIndex
      while ((frameBoundaryIndex = buffer.indexOf("\n\n")) >= 0) {
        const rawFrame = buffer.slice(0, frameBoundaryIndex)
        buffer = buffer.slice(frameBoundaryIndex + 2)
        const event = parseSSEFrame(rawFrame)
        if (event) applyEvent(event)
      }
    }
    if (buffer.trim()) {
      const event = parseSSEFrame(buffer)
      if (event) applyEvent(event)
    }
  } catch (error: unknown) {
    if (isAbortError(error)) {
      handleStreamAbort()
      return
    }
    handleStreamError(error)
  } finally {
    finalizeRequest(controller)
  }
}

export function abortChat(notifyServer = true) {
  if (activeAbort) {
    activeAbort.abort()
    activeAbort = null
  }
  if (notifyServer) {
    fireAbortRequest()
  }
}

function parseSSEFrame(raw: string): SSEEvent | null {
  // Standard SSE: lines starting with "data: ". We pack one JSON event per frame.
  const lines = raw.split("\n")
  let data = ""
  for (const line of lines) {
    if (line.startsWith("data:")) data += line.slice(5).trimStart() + "\n"
  }
  data = data.trim()
  if (!data) return null
  try {
    return JSON.parse(data) as SSEEvent
  } catch {
    return null
  }
}

