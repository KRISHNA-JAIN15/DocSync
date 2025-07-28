import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "Socket.IO server should be running",
    message: "If you see this, the API routes are working. Check if you're running the custom server.",
    timestamp: new Date().toISOString(),
    instructions: "Run 'npm run dev' to start the custom server with Socket.IO",
  })
}
