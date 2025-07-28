"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export function SignInButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <Button disabled size="lg">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (session) {
    return (
      <Button asChild size="lg">
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    )
  }

  return (
    <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
      <Link href="/auth/signin">Sign In with Google</Link>
    </Button>
  )
}
