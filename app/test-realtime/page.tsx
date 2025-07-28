"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function TestRealtimePage() {
  const [status, setStatus] = useState<string>("Testing...")
  const [testDocId, setTestDocId] = useState("test-doc-123")
  const [connectionStatus, setConnectionStatus] = useState<string>("Not connected")
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    testRealtimeStatus()
  }, [])

  const testRealtimeStatus = async () => {
    try {
      const response = await fetch("/api/realtime-status")
      const data = await response.json()
      setStatus(`✅ ${data.status} - ${data.type}`)
    } catch (error) {
      setStatus(`❌ Real-time server failed: ${error}`)
    }
  }

  const testConnection = () => {
    const params = new URLSearchParams({
      userId: "test-user",
      userName: "Test User",
      userEmail: "test@example.com",
    })

    const eventSource = new EventSource(`/api/realtime/${testDocId}?${params}`)

    eventSource.onopen = () => {
      setConnectionStatus("✅ Connected to SSE")
      addMessage("Connection opened")
    }

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      addMessage(`Received: ${data.type} - ${JSON.stringify(data)}`)
    }

    eventSource.onerror = (error) => {
      setConnectionStatus("❌ Connection error")
      addMessage(`Error: ${error}`)
    }

    // Clean up after 10 seconds
    setTimeout(() => {
      eventSource.close()
      setConnectionStatus("Connection closed")
      addMessage("Connection closed after 10 seconds")
    }, 10000)
  }

  const addMessage = (message: string) => {
    setMessages((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Real-time System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Server Status:</h3>
            <p className="text-sm bg-gray-100 p-2 rounded">{status}</p>
          </div>

          <div>
            <h3 className="font-semibold">Connection Status:</h3>
            <p className="text-sm bg-gray-100 p-2 rounded">{connectionStatus}</p>
          </div>

          <div>
            <h3 className="font-semibold">Test Document ID:</h3>
            <Input
              value={testDocId}
              onChange={(e) => setTestDocId(e.target.value)}
              placeholder="Enter test document ID"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={testRealtimeStatus}>Test Server Status</Button>
            <Button onClick={testConnection}>Test SSE Connection</Button>
          </div>

          <div>
            <h3 className="font-semibold">Messages:</h3>
            <div className="text-sm bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500">No messages yet</p>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="mb-1">
                    {msg}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold">How it works:</h3>
            <ul className="text-sm space-y-1">
              <li>✅ Uses Server-Sent Events (SSE) instead of Socket.IO</li>
              <li>✅ Works with Next.js App Router</li>
              <li>✅ No custom server required</li>
              <li>✅ Real-time user tracking</li>
              <li>✅ Content synchronization</li>
              <li>✅ Auto-reconnection on errors</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
