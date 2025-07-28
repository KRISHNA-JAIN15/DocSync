import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "NEXT.JS SERVER RUNNING",
    socketIO: "ENABLED",
    server: "Next.js with Pages API Socket.IO",
    timestamp: new Date().toISOString(),
    message: "✅ Socket.IO is running on Pages API",
    socketPath: "/api/socket",
  })
}
