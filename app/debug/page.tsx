"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn, signOut } from "next-auth/react"

export default function DebugPage() {
  const { data: session, status } = useSession()

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Status:</h3>
            <p className="text-sm bg-gray-100 p-2 rounded">{status}</p>
          </div>

          <div>
            <h3 className="font-semibold">Session Data:</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(session, null, 2)}</pre>
          </div>

          <div>
            <h3 className="font-semibold">Environment Check:</h3>
            <ul className="text-sm space-y-1">
              <li>NEXTAUTH_URL: {process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Missing"}</li>
              <li>Google Client ID: {process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing"}</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => signIn("google")}>Sign In</Button>
            <Button onClick={() => signOut()} variant="outline">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
