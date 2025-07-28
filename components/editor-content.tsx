"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Users, Copy, Home, CheckCircle, AlertTriangle, RefreshCw, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import type { Document, DocumentUser } from "@/lib/models/document"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ConnectionStatus } from "@/components/connection-status"
import { useBrowser } from "@/hooks/use-browser"
import { copyToClipboard } from "@/lib/clipboard"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

const MonacoEditor = dynamic(() => import("@/components/monaco-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-900">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
        <p>Loading editor...</p>
      </div>
    </div>
  ),
})

interface EditorContentProps {
  documentId: string
  accessKey?: string
}

export function EditorContent({ documentId, accessKey }: EditorContentProps) {
  const { data: session, status: sessionStatus } = useSession()
  const { toast } = useToast()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<DocumentUser[]>([])
  const [content, setContent] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [userCount, setUserCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isReceivingUpdateRef = useRef(false)
  const userIdRef = useRef<string>("")
  const userNameRef = useRef<string>("")
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const { isBrowser } = useBrowser()

  // Initialize user info
  useEffect(() => {
    if (sessionStatus === "loading") return

    if (session?.user?.id) {
      userIdRef.current = session.user.id
      userNameRef.current = session.user.name || session.user.email || "Authenticated User"
    } else if (isBrowser) {
      try {
        let anonymousId = localStorage.getItem("collaborative-editor-user-id")
        if (!anonymousId) {
          anonymousId = `anonymous-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          localStorage.setItem("collaborative-editor-user-id", anonymousId)
        }
        userIdRef.current = anonymousId
        userNameRef.current = "Anonymous User"
      } catch (e) {
        userIdRef.current = `anonymous-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        userNameRef.current = "Anonymous User"
      }
    }

    if (userIdRef.current) {
      fetchDocument()
    }
  }, [session, sessionStatus, isBrowser])

  // Cleanup
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
  }

  const fetchDocument = async () => {
    try {
      console.log("📄 Fetching document:", documentId)
      const url = `/api/documents/${documentId}${accessKey ? `?accessKey=${accessKey}` : ""}`
      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 403) {
          setError("Access denied. You need the correct access key to view this document.")
        } else if (response.status === 404) {
          setError("Document not found.")
        } else {
          setError("Failed to load document.")
        }
        setLoading(false)
        return
      }

      const doc = await response.json()
      console.log("📄 Document loaded:", doc.name, `(${doc.content?.length || 0} chars)`)

      setDocument(doc)
      setContent(doc.content || "")
      setHasUnsavedChanges(false)
      setLoading(false)

      // Start real-time connection
      initializeRealtime()
    } catch (error) {
      console.error("❌ Error fetching document:", error)
      setError("Failed to load document.")
      setLoading(false)
    }
  }

  const initializeRealtime = useCallback(() => {
    if (!userIdRef.current || eventSourceRef.current) return

    console.log("🔌 Initializing real-time connection")
    console.log("👤 User:", userNameRef.current, `(${userIdRef.current})`)

    cleanup()

    const params = new URLSearchParams({
      userId: userIdRef.current,
      userName: userNameRef.current,
      userEmail: session?.user?.email || "",
    })

    const eventSource = new EventSource(`/api/realtime/${documentId}?${params}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log("✅ EventSource opened")
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("📨 Received:", data.type, data)

        switch (data.type) {
          case "connection-success":
            setIsConnected(true)
            setConnectionError(null)
            reconnectAttemptsRef.current = 0
            console.log("🎉 Connected successfully")
            toast({
              title: "Connected",
              description: "Real-time collaboration is active",
            })
            break

          case "document-state":
            console.log("📄 Received document state:", data.content?.length || 0, "chars")
            if (data.content && data.content !== content) {
              isReceivingUpdateRef.current = true
              setContent(data.content)
              setHasUnsavedChanges(false)
              setTimeout(() => {
                isReceivingUpdateRef.current = false
              }, 100)
            }
            break

          case "content-change":
            console.log("📝 Content change from:", data.userName, `(${data.content?.length || 0} chars)`)
            if (!isReceivingUpdateRef.current && data.userId !== userIdRef.current) {
              isReceivingUpdateRef.current = true
              setContent(data.content || "")
              setHasUnsavedChanges(false)
              setTimeout(() => {
                isReceivingUpdateRef.current = false
              }, 100)
            }
            break

          case "user-count-update":
            console.log("👥 User count update:", data.count, "users")
            setUserCount(data.count)
            setOnlineUsers(data.users || [])
            break

          case "heartbeat":
            // Just acknowledge heartbeat
            break
        }
      } catch (error) {
        console.error("❌ Error parsing message:", error)
      }
    }

    eventSource.onerror = (error) => {
      console.error("❌ EventSource error:", error)
      setIsConnected(false)
      setConnectionError("Connection lost")

      // Attempt reconnect
      if (reconnectAttemptsRef.current < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000)
        reconnectAttemptsRef.current++

        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)

        reconnectTimeoutRef.current = setTimeout(() => {
          initializeRealtime()
        }, delay)
      } else {
        setConnectionError("Unable to maintain connection. Please refresh the page.")
      }
    }
  }, [session, documentId, content, toast])

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (isReceivingUpdateRef.current) {
        console.log("⏭️ Skipping content change (receiving update)")
        return
      }

      console.log("📝 Local content change:", newContent.length, "chars")
      setContent(newContent)
      setHasUnsavedChanges(true)

      // Broadcast to other users immediately
      if (isConnected) {
        fetch(`/api/realtime/${documentId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "content-change",
            content: newContent,
            userId: userIdRef.current,
            userName: userNameRef.current,
          }),
        }).catch((error) => {
          console.error("❌ Failed to broadcast content:", error)
        })
      }

      // Auto-save with debouncing
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveDocument(newContent)
      }, 1000) // Save after 1 second of inactivity
    },
    [isConnected, documentId],
  )

  const saveDocument = async (contentToSave?: string) => {
    const saveContent = contentToSave || content

    if (!saveContent && saveContent !== "") {
      console.log("⚠️ No content to save")
      return
    }

    console.log("💾 Saving document:", saveContent.length, "chars")
    setIsSaving(true)

    try {
      const response = await fetch(`/api/documents/${documentId}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: saveContent,
          accessKey: accessKey,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Document saved:", result.contentLength, "chars")
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
      } else {
        throw new Error(`Save failed: ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Save error:", error)
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleManualSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    await saveDocument()
  }, [content])

  const copyShareLink = useCallback(async () => {
    if (!document) return
    const url = `${window.location.origin}/editor/${document._id}?accessKey=${document.accessKey}`
    const success = await copyToClipboard(url)

    toast({
      title: success ? "Success" : "Error",
      description: success ? "Share link copied to clipboard" : "Failed to copy link",
      variant: success ? "default" : "destructive",
    })
  }, [document, toast])

  useKeyboardShortcuts({
    onSave: handleManualSave,
    onCopy: copyShareLink,
  })

  const forceReconnect = () => {
    reconnectAttemptsRef.current = 0
    initializeRealtime()
  }

  // Loading state
  if (sessionStatus === "loading" || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Document Not Found</h2>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {connectionError && (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>Connection Error:</strong> {connectionError}
            </span>
            <Button size="sm" variant="outline" onClick={forceReconnect}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isConnected && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Real-time collaboration active!</strong> Changes sync instantly across all users.
          </AlertDescription>
        </Alert>
      )}

      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">{document.name}</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {userCount} online
              </Badge>
            </div>
            <ConnectionStatus isConnected={isConnected} userCount={userCount} error={connectionError} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={hasUnsavedChanges ? "default" : "outline"}
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving}
            className={hasUnsavedChanges ? "bg-orange-600 hover:bg-orange-700" : ""}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {hasUnsavedChanges ? "Save*" : "Saved"}
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={copyShareLink}>
            <Copy className="h-4 w-4 mr-2" />
            Share
          </Button>

          {session && (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* Save Status */}
      {(lastSaved || hasUnsavedChanges) && (
        <div className="bg-gray-50 border-b px-6 py-2 text-sm text-gray-600">
          {hasUnsavedChanges ? (
            <span className="text-orange-600">● Unsaved changes - auto-saving...</span>
          ) : lastSaved ? (
            <span className="text-green-600">✓ Last saved: {lastSaved.toLocaleTimeString()}</span>
          ) : null}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <MonacoEditor value={content} onChange={handleContentChange} language={document.language || "javascript"} />
      </div>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="bg-gray-50 border-t px-6 py-3">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span className="font-medium">Online:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {onlineUsers.map((user, index) => (
                <div key={user.id} className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{user.name}</span>
                  {index < onlineUsers.length - 1 && <span className="text-gray-400">,</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
