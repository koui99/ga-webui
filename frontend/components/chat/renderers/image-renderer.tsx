"use client"

import { cn } from "@/lib/utils"
import type { RendererProps } from "@/lib/chat/registry"
import { AttachmentStrip } from "./attachment-strip"

export function ImageRenderer({ message }: RendererProps) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[min(80ch,85%)] flex-col gap-1.5", isUser && "items-end")}>
        {message.ts && (
          <span className="font-mono text-[0.7rem] leading-none tracking-wide text-muted-foreground/70">
            {message.ts}
          </span>
        )}
        <AttachmentStrip attachments={message.attachments ?? []} />
      </div>
    </div>
  )
}

