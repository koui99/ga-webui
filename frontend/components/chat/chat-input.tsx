"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowUp, Paperclip, X, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { listInputPlugins } from "@/lib/chat/registry"
import type { ClientAttachment } from "@/lib/chat/protocol"
import { sendChat, abortChat } from "@/lib/chat/client"
import { pushUserMessage, useChatState } from "@/lib/chat/store"
import { attachFile } from "./plugins/image-paste-plugin"
import { useToast } from "@/hooks/use-toast"
import { t } from "@/lib/chat/i18n"

export function ChatInput() {
  const [text, setText] = useState("")
  const [attachments, setAttachments] = useState<ClientAttachment[]>([])
  const [dragOver, setDragOver] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { streaming } = useChatState()

  const ctx = {
    addAttachment: (a: ClientAttachment) => setAttachments((cur) => [...cur, a]),
    setText,
    getText: () => text,
    submit: () => doSubmit(),
    toast: (msg: string, level: "info" | "warning" | "error" | "ok" = "info") =>
      toast({ description: msg, variant: level === "error" ? "destructive" : "default" }),
  }

  // Auto-grow textarea.
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 240) + "px"
  }, [text])

  // Wire paste plugins.
  const onPaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const native = e.nativeEvent as ClipboardEvent
      for (const p of listInputPlugins()) {
        if (!p.onPaste) continue
        const handled = await p.onPaste(native, ctx)
        if (handled) return
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text],
  )

  const removeAt = (idx: number) => setAttachments((cur) => cur.filter((_, i) => i !== idx))

  async function doSubmit() {
    if (streaming) return
    const query = text.trim()
    if (!query && attachments.length === 0) return

    // Let plugins intercept (e.g., a future client-side slash command).
    for (const p of listInputPlugins()) {
      if (!p.onSubmit) continue
      const handled = await p.onSubmit(query, ctx)
      if (handled) {
        setText("")
        setAttachments([])
        return
      }
    }

    pushUserMessage(query, attachments)
    const payload = { query, attachments, source: "user" as const }
    setText("")
    setAttachments([])
    await sendChat(payload)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      doSubmit()
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer?.files ?? [])
    for (const f of files) attachFile(f, ctx)
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-5 pt-2">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative rounded-2xl border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors",
          dragOver ? "border-[color:var(--brand)] ring-2 ring-[color:var(--brand)]/20" : "border-border",
        )}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-border px-3 pb-2 pt-3">
            {attachments.map((a, i) => (
              <AttachmentChip key={i} att={a} onRemove={() => removeAt(i)} />
            ))}
          </div>
        )}

        <div className="flex items-end gap-1.5 px-2 py-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={t.attachImage}
          >
            <Paperclip className="size-[18px]" />
            <span className="sr-only">{t.attachImage}</span>
          </button>

          {/* Plugin toolbar buttons */}
          {listInputPlugins().map((p) =>
            p.ToolbarButton ? <p.ToolbarButton key={p.id} ctx={ctx} /> : null,
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              for (const f of files) attachFile(f, ctx)
              e.target.value = ""
            }}
          />

          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            rows={1}
            placeholder={streaming ? "回复中…" : t.inputPlaceholder}
            className="warm-scroll min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/70"
            disabled={streaming}
          />

          {streaming ? (
            <button
              type="button"
              onClick={() => abortChat()}
              className="grid size-9 place-items-center rounded-lg bg-[color:var(--accent-terracotta)] text-white transition-colors hover:opacity-90"
              title={t.stop}
            >
              <Square className="size-[15px] fill-current" />
              <span className="sr-only">{t.stop}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={doSubmit}
              disabled={!text.trim() && attachments.length === 0}
              className="grid size-9 place-items-center rounded-lg bg-[color:var(--brand)] text-white transition-colors hover:bg-[color:var(--brand-hover)] disabled:opacity-40"
              title={t.send}
            >
              <ArrowUp className="size-[18px]" />
              <span className="sr-only">{t.send}</span>
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 px-1 text-center text-[11px] text-muted-foreground/70">
        {"Enter 发送，Shift+Enter 换行 · 支持粘贴或拖拽图片"}
      </p>
    </div>
  )
}

function AttachmentChip({ att, onRemove }: { att: ClientAttachment; onRemove: () => void }) {
  return (
    <div className="group relative size-14 overflow-hidden rounded-lg border border-border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={att.dataUrl || "/placeholder.svg"} alt={att.name ?? "attachment"} className="size-full object-cover" crossOrigin="anonymous" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
        aria-label={t.removeAttachment}
      >
        <X className="size-3" />
      </button>
    </div>
  )
}

