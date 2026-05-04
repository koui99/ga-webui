import { ADAPTER_URL, missingAdapterResponse } from "@/lib/chat/server-config"

export const runtime = "nodejs"

export async function POST() {
  if (!ADAPTER_URL) {
    return missingAdapterResponse()
  }

  try {
    const response = await fetch(`${ADAPTER_URL}/abort`, { method: "POST" })
    return Response.json({ ok: response.ok })
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 })
  }
}

