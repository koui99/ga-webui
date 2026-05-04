"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { cn } from "@/lib/utils"
import type { RendererProps } from "@/lib/chat/registry"
import { AttachmentStrip } from "./attachment-strip"
import { ToolCallList } from "./tool-call-renderer"

export function TextRenderer({ message, isStreamingTail }: RendererProps) {
  const isUser = message.role === "user"
  const showCaret = !!isStreamingTail && !!message.streaming

  return (
    <div className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && <Avatar role="assistant" />}
      <div className={cn("flex max-w-[min(80ch,85%)] flex-col gap-1.5", isUser && "items-end")}>
        {message.ts && (
          <span className="font-mono text-[0.7rem] leading-none tracking-wide text-muted-foreground/70">
            {message.ts}
          </span>
        )}
        <div
          className={cn(
            "prose-chat rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
            isUser
              ? "bg-card border border-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              : "bg-transparent",
          )}
        >
          {message.attachments && message.attachments.length > 0 && (
            <AttachmentStrip attachments={message.attachments} className="mb-2" />
          )}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <ToolCallList calls={message.toolCalls} className="mb-2" />
          )}
          <div className={cn(showCaret && "streaming-caret")}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                a: ({ href, children, ...rest }) => (
                  <a href={href} target="_blank" rel="noreferrer noopener" {...rest}>
                    {children}
                  </a>
                ),
              }}
            >
              {message.content || (isUser ? "" : "")}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      {isUser && <Avatar role="user" />}
    </div>
  )
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "mt-1 size-9 shrink-0 rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.06)]",
        role === "user"
          ? "border-[color:var(--accent-terracotta)]/30 bg-gradient-to-br from-[#D8B08A] to-[#B98259]"
          : "border-border bg-gradient-to-br from-[#F6F1E9] to-[#E5D7C7]",
      )}
    />
  )
}

