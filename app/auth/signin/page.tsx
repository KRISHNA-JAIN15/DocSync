"use client"

import { signIn, getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome, Loader2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      switch (errorParam) {
        case "OAuthAccountNotLinked":
          setError(
            "This email is already associated with another account. Please try a different email or contact support.",
          )
          break
        case "OAuthSignin":
          setError("Error occurred during sign in. Please try again.")
          break
        case "OAuthCallback":
          setError("Error in OAuth callback. Please try again.")
          break
        case "OAuthCreateAccount":
          setError("Could not create account. Please try again.")
          break
        case "EmailCreateAccount":
          setError("Could not create account with this email.")
          break
        case "Callback":
          setError("Error in callback. Please try again.")
          break
        case "OAuthCallbackError":
          setError("OAuth callback error. Please try again.")
          break
        case "SessionRequired":
          setError("Please sign in to access this page.")
          break
        default:
          setError("An error occurred during sign in. Please try again.")
      }
    }
  }, [searchParams])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/dashboard",
      })

      if (result?.error) {
        console.error("Sign in error:", result.error)
        setError("Failed to sign in. Please try again.")
      } else if (result?.ok) {
        // Check if session was created successfully
        const session = await getSession()
        if (session) {
          router.push("/dashboard")
        } else {
          setError("Sign in succeeded but session was not created. Please try again.")
        }
      }
    } catch (error) {
      console.error("Sign in error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const clearDatabase = async () => {
    if (confirm("This will clear all authentication data. Are you sure?")) {
      try {
        const response = await fetch("/api/auth/clear-db", { method: "POST" })
        if (response.ok) {
          setError(null)
          alert("Database cleared. You can now try signing in again.")
        }
      } catch (error) {
        console.error("Error clearing database:", error)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use your Google account to access the collaborative code editor
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in with your Google account to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Chrome className="mr-2 h-5 w-5" />
                  Sign in with Google
                </>
              )}
            </Button>

            {error && (
              <div className="text-center">
                <Button variant="outline" size="sm" onClick={clearDatabase} className="text-xs bg-transparent">
                  Clear Auth Data (Debug)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
