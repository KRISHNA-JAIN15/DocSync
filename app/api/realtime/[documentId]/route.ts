import { type NextRequest, NextResponse } from "next/server"

// Simplified and more stable connection management
interface Connection {
  controller: ReadableStreamDefaultController
  userId: string
  userName: string
  userEmail: string
  lastSeen: number
  isActive: boolean
}

interface DocumentState {
  content: string
  lastUpdated: number
  lastUpdatedBy: string
}

// Global state management
const documentConnections = new Map<string, Map<string, Connection>>()
const documentStates = new Map<string, DocumentState>()
const userCounts = new Map<string, number>()

// Cleanup dead connections every 2 minutes
setInterval(() => {
  const now = Date.now()
  const TIMEOUT = 120000 // 2 minutes

  for (const [docId, connections] of documentConnections.entries()) {
    const deadConnections: string[] = []

    for (const [connId, conn] of connections.entries()) {
      if (now - conn.lastSeen > TIMEOUT || !conn.isActive) {
        deadConnections.push(connId)
      }
    }

    // Remove dead connections
    for (const connId of deadConnections) {
      connections.delete(connId)
      console.log(`🧹 Removed dead connection: ${connId}`)
    }

    // Update user count
    const activeUsers = new Set(Array.from(connections.values()).map((c) => c.userId))
    userCounts.set(docId, activeUsers.size)

    // Broadcast updated user count
    if (deadConnections.length > 0 && connections.size > 0) {
      broadcastToDocument(docId, {
        type: "user-count-update",
        count: activeUsers.size,
        users: Array.from(activeUsers).map((userId) => {
          const conn = Array.from(connections.values()).find((c) => c.userId === userId)
          return {
            id: userId,
            name: conn?.userName || "Unknown",
            email: conn?.userEmail || "",
          }
        }),
      })
    }

    // Clean up empty documents
    if (connections.size === 0) {
      documentConnections.delete(docId)
      documentStates.delete(docId)
      userCounts.delete(docId)
      console.log(`🧹 Cleaned up empty document: ${docId}`)
    }
  }
}, 120000)

function broadcastToDocument(documentId: string, data: any, excludeConnectionId?: string) {
  const connections = documentConnections.get(documentId)
  if (!connections) return

  const message = `data: ${JSON.stringify(data)}\n\n`
  let sent = 0
  let failed = 0

  for (const [connId, conn] of connections.entries()) {
    if (connId === excludeConnectionId || !conn.isActive) continue

    try {
      conn.controller.enqueue(message)
      conn.lastSeen = Date.now()
      sent++
    } catch (error) {
      conn.isActive = false
      failed++
      console.log(`❌ Failed to send to ${connId}:`, error.message)
    }
  }

  console.log(`📡 Broadcast ${data.type}: ${sent} sent, ${failed} failed`)
}

export async function GET(request: NextRequest, { params }: { params: { documentId: string } }) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId") || `anon-${Date.now()}`
  const userName = searchParams.get("userName") || "Anonymous"
  const userEmail = searchParams.get("userEmail") || ""

  console.log(`🔌 NEW CONNECTION: ${userName} (${userId}) -> ${params.documentId}`)

  // Initialize document maps
  if (!documentConnections.has(params.documentId)) {
    documentConnections.set(params.documentId, new Map())
    documentStates.set(params.documentId, { content: "", lastUpdated: 0, lastUpdatedBy: "" })
    userCounts.set(params.documentId, 0)
  }

  const connections = documentConnections.get(params.documentId)!
  const connectionId = `${userId}-${Date.now()}`

  const stream = new ReadableStream({
    start(controller) {
      console.log(`🚀 Starting connection: ${connectionId}`)

      // Store connection
      const connection: Connection = {
        controller,
        userId,
        userName,
        userEmail,
        lastSeen: Date.now(),
        isActive: true,
      }

      connections.set(connectionId, connection)

      // Update user count
      const activeUsers = new Set(Array.from(connections.values()).map((c) => c.userId))
      userCounts.set(params.documentId, activeUsers.size)

      // Send connection success
      try {
        const successMessage = {
          type: "connection-success",
          connectionId,
          userId,
          documentId: params.documentId,
          timestamp: new Date().toISOString(),
        }

        controller.enqueue(`data: ${JSON.stringify(successMessage)}\n\n`)
        console.log(`✅ Connection established: ${connectionId}`)

        // Send current document state if it exists
        const docState = documentStates.get(params.documentId)
        if (docState && docState.content) {
          const contentMessage = {
            type: "document-state",
            content: docState.content,
            lastUpdated: docState.lastUpdated,
            lastUpdatedBy: docState.lastUpdatedBy,
          }
          controller.enqueue(`data: ${JSON.stringify(contentMessage)}\n\n`)
          console.log(`📄 Sent current document state to ${connectionId} (${docState.content.length} chars)`)
        }

        // Broadcast user update to all connections
        const userUpdateMessage = {
          type: "user-count-update",
          count: activeUsers.size,
          users: Array.from(activeUsers).map((uid) => {
            const conn = Array.from(connections.values()).find((c) => c.userId === uid)
            return {
              id: uid,
              name: conn?.userName || "Unknown",
              email: conn?.userEmail || "",
            }
          }),
        }

        broadcastToDocument(params.documentId, userUpdateMessage)
      } catch (error) {
        console.error(`❌ Failed to initialize connection ${connectionId}:`, error)
        connection.isActive = false
        connections.delete(connectionId)
        return
      }

      // Heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        if (!connection.isActive) {
          clearInterval(heartbeatInterval)
          return
        }

        try {
          const heartbeat = {
            type: "heartbeat",
            timestamp: new Date().toISOString(),
          }
          controller.enqueue(`data: ${JSON.stringify(heartbeat)}\n\n`)
          connection.lastSeen = Date.now()
        } catch (error) {
          console.log(`💔 Heartbeat failed for ${connectionId}`)
          connection.isActive = false
          clearInterval(heartbeatInterval)
        }
      }, 30000)
    },

    cancel() {
      console.log(`👋 Connection cancelled: ${connectionId}`)

      // Remove connection
      connections.delete(connectionId)

      // Update user count
      const activeUsers = new Set(Array.from(connections.values()).map((c) => c.userId))
      userCounts.set(params.documentId, activeUsers.size)

      // Broadcast updated user count
      if (connections.size > 0) {
        broadcastToDocument(params.documentId, {
          type: "user-count-update",
          count: activeUsers.size,
          users: Array.from(activeUsers).map((uid) => {
            const conn = Array.from(connections.values()).find((c) => c.userId === uid)
            return {
              id: uid,
              name: conn?.userName || "Unknown",
              email: conn?.userEmail || "",
            }
          }),
        })
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  })
}

export async function POST(request: NextRequest, { params }: { params: { documentId: string } }) {
  try {
    const { type, content, userId, userName } = await request.json()

    console.log(`📡 POST ${type} from ${userName} (${userId})`)

    if (type === "content-change") {
      // Update document state
      const docState = documentStates.get(params.documentId)
      if (docState) {
        docState.content = content || ""
        docState.lastUpdated = Date.now()
        docState.lastUpdatedBy = userId
        console.log(`📝 Updated document state: ${content?.length || 0} characters`)
      }

      // Broadcast to other users (exclude sender)
      const connections = documentConnections.get(params.documentId)
      if (connections) {
        const message = {
          type: "content-change",
          content: content || "",
          userId,
          userName,
          timestamp: new Date().toISOString(),
        }

        let broadcastCount = 0
        for (const [connId, conn] of connections.entries()) {
          if (conn.userId === userId || !conn.isActive) continue

          try {
            conn.controller.enqueue(`data: ${JSON.stringify(message)}\n\n`)
            conn.lastSeen = Date.now()
            broadcastCount++
          } catch (error) {
            conn.isActive = false
            console.log(`❌ Failed to broadcast to ${connId}`)
          }
        }

        console.log(`✅ Content broadcasted to ${broadcastCount} users`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ POST error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
