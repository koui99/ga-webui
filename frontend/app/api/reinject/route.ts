import { ADAPTER_URL, missingAdapterResponse } from "@/lib/chat/server-config"

export const runtime = "nodejs"

export async function POST() {
  if (!ADAPTER_URL) {
    return missingAdapterResponse()
  }

  const response = await fetch(`${ADAPTER_URL}/reinject`, { method: "POST" })
  return Response.json({ ok: response.ok })
}

