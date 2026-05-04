"use client"

import { useState } from "react"
import { ChevronRight, CircleCheck, CircleAlert, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToolCallEvent } from "@/lib/chat/protocol"

export function ToolCallList({ calls, className }: { calls: ToolCallEvent[]; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {calls.map((c) => (
        <ToolCallBubble key={c.id} call={c} />
      ))}
    </div>
  )
}

function ToolCallBubble({ call }: { call: ToolCallEvent }) {
  const [open, setOpen] = useState(false)
  const Icon = call.status === "running" ? Loader2 : call.status === "error" ? CircleAlert : CircleCheck
  return (
    <div className="rounded-lg border border-border bg-muted/40 text-[13px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/70"
      >
        <ChevronRight className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
        <Icon
          aria-hidden="true"
          className={cn(
            "size-3.5 shrink-0",
            call.status === "running" && "animate-spin text-[color:var(--brand)]",
            call.status === "done" && "text-[color:var(--brand-hover)]",
            call.status === "error" && "text-destructive",
          )}
        />
        <span className="font-mono text-foreground">{call.name}</span>
        {call.resultPreview && !open && (
          <span className="ml-auto truncate text-muted-foreground">{call.resultPreview}</span>
        )}
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2 font-mono text-xs text-muted-foreground">
          {call.args && (
            <div className="mb-2">
              <div className="mb-1 text-foreground/70">参数</div>
              <pre className="warm-scroll overflow-x-auto whitespace-pre-wrap">{JSON.stringify(call.args, null, 2)}</pre>
            </div>
          )}
          {call.resultPreview && (
            <div>
              <div className="mb-1 text-foreground/70">返回</div>
              <pre className="warm-scroll overflow-x-auto whitespace-pre-wrap">{call.resultPreview}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

