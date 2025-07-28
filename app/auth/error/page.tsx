"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Home, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "OAuthAccountNotLinked":
        return {
          title: "Account Linking Issue",
          message:
            "This email is already associated with another account. Please try signing in with a different Google account or contact support if you believe this is an error.",
          suggestion: "Try using a different Google account or clear your browser data and try again.",
        }
      case "OAuthSignin":
        return {
          title: "OAuth Sign In Error",
          message: "There was an error during the Google sign-in process.",
          suggestion: "Please try again or check your internet connection.",
        }
      case "OAuthCallback":
        return {
          title: "OAuth Callback Error",
          message: "There was an error processing the sign-in callback from Google.",
          suggestion: "This might be a temporary issue. Please try signing in again.",
        }
      case "OAuthCreateAccount":
        return {
          title: "Account Creation Error",
          message: "We couldn't create your account with Google.",
          suggestion: "Please try again or contact support if the problem persists.",
        }
      default:
        return {
          title: "Authentication Error",
          message: "An unexpected error occurred during authentication.",
          suggestion: "Please try signing in again.",
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">{errorInfo.title}</CardTitle>
            <CardDescription>{errorInfo.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Suggestion:</strong> {errorInfo.suggestion}
              </p>
            </div>

            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link href="/auth/signin">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <strong>Debug Info:</strong> Error code: {error || "unknown"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
