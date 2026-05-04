import type { NextRequest } from "next/server"
import { ADAPTER_URL, missingAdapterResponse } from "@/lib/chat/server-config"
import type { ChatRequest } from "@/lib/chat/protocol"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatRequest

  if (!ADAPTER_URL) {
    return missingAdapterResponse()
  }

  const upstream = await fetch(`${ADAPTER_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}

