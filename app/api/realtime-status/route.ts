import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "✅ REAL-TIME SERVER RUNNING",
    type: "Server-Sent Events (SSE)",
    server: "Next.js App Router",
    timestamp: new Date().toISOString(),
    message: "Real-time collaboration is active",
    endpoint: "/api/realtime/[documentId]",
  })
}
