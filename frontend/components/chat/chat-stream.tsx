"use client"

import { useEffect, useRef } from "react"
import { useChatState } from "@/lib/chat/store"
import { resolveRenderer } from "@/lib/chat/registry"
import { TextRenderer } from "./renderers/text-renderer"
import { t } from "@/lib/chat/i18n"

export function ChatStream() {
  const { messages, streaming } = useChatState()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, streaming])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <Welcome />
      </div>
    )
  }

  const lastIdx = messages.length - 1

  return (
    <div className="warm-scroll flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        {messages.map((m, i) => {
          const Renderer = resolveRenderer(m) ?? TextRenderer
          return <Renderer key={m.id} message={m} isStreamingTail={i === lastIdx && streaming} />
        })}
        <div ref={endRef} aria-hidden="true" />
      </div>
    </div>
  )
}

function Welcome() {
  return (
    <div className="text-center">
      <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">{t.emptyTitle}</h2>
      <p className="mx-auto mt-3 max-w-md text-pretty text-[15px] leading-relaxed text-muted-foreground">
        {t.emptySubtitle}
      </p>
      <div className="mx-auto mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        {SAMPLES.map((s) => (
          <SampleCard key={s.title} {...s} />
        ))}
      </div>
    </div>
  )
}

const SAMPLES: { title: string; hint: string; example: string }[] = [
  {
    title: t.capAsk,
    hint: t.capAskDesc,
    example: "总结一下 C:\\notes\\plan.md 这个文件，并给出三个下一步建议。",
  },
  {
    title: t.capVision,
    hint: t.capVisionDesc,
    example: "这张截图里的 UI 有什么可以改进的地方？",
  },
  {
    title: t.capImageGen,
    hint: t.capImageGenDesc,
    example: "/image 一只穿宇航服的橘猫，电影感打光",
  },
  {
    title: t.capSlash,
    hint: t.capSlashDesc,
    example: "/resume",
  },
]

function SampleCard({ title, hint, example }: { title: string; hint: string; example: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const ta = document.querySelector<HTMLTextAreaElement>("textarea")
        if (ta) {
          ta.focus()
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set
          setter?.call(ta, example)
          ta.dispatchEvent(new Event("input", { bubbles: true }))
        }
      }}
      className="group rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-[color:var(--brand)]/40 hover:bg-card/80"
    >
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
      <div className="mt-2 line-clamp-2 font-mono text-[12px] text-muted-foreground/80 group-hover:text-foreground/80">
        {example}
      </div>
    </button>
  )
}

