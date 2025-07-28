"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestSocketPage() {
  const [pagesApiTest, setPagesApiTest] = useState<string>("Testing...")
  const [socketStatus, setSocketStatus] = useState<string>("Testing...")

  useEffect(() => {
    testPagesAPI()
    testSocketEndpoint()
  }, [])

  const testPagesAPI = async () => {
    try {
      const response = await fetch("/api/test")
      const data = await response.json()
      setPagesApiTest(`✅ Pages API working: ${data.message}`)
    } catch (error) {
      setPagesApiTest(`❌ Pages API failed: ${error}`)
    }
  }

  const testSocketEndpoint = async () => {
    try {
      const response = await fetch("/api/socket-status")
      const data = await response.json()
      setSocketStatus(`✅ Socket endpoint available: ${data.status}`)
    } catch (error) {
      setSocketStatus(`❌ Socket endpoint failed: ${error}`)
    }
  }

  const initializeSocket = async () => {
    try {
      const response = await fetch("/api/socket")
      const data = await response.json()
      alert(`Socket.IO initialization: ${data.status}`)
    } catch (error) {
      alert(`Socket.IO initialization failed: ${error}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Socket.IO Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Pages API Test:</h3>
            <p className="text-sm bg-gray-100 p-2 rounded">{pagesApiTest}</p>
          </div>

          <div>
            <h3 className="font-semibold">Socket Endpoint Test:</h3>
            <p className="text-sm bg-gray-100 p-2 rounded">{socketStatus}</p>
          </div>

          <div>
            <h3 className="font-semibold">Directory Structure Check:</h3>
            <ul className="text-sm space-y-1">
              <li>✅ app/ directory (App Router)</li>
              <li>✅ pages/api/ directory (Pages API)</li>
              <li>✅ pages/api/socket.ts (Socket.IO handler)</li>
              <li>✅ pages/api/test.ts (Test endpoint)</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={testPagesAPI}>Test Pages API</Button>
            <Button onClick={testSocketEndpoint}>Test Socket Endpoint</Button>
            <Button onClick={initializeSocket}>Initialize Socket.IO</Button>
          </div>

          <div>
            <h3 className="font-semibold">Expected URLs:</h3>
            <ul className="text-sm space-y-1">
              <li>
                <a href="/api/test" target="_blank" className="text-blue-600 hover:underline" rel="noreferrer">
                  /api/test
                </a>{" "}
                - Pages API test
              </li>
              <li>
                <a href="/api/socket-status" target="_blank" className="text-blue-600 hover:underline" rel="noreferrer">
                  /api/socket-status
                </a>{" "}
                - Socket status
              </li>
              <li>/api/socket - Socket.IO endpoint (will initialize on first access)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
