export interface UserInfo {
  id: string
  name: string
  email?: string
  isAuthenticated: boolean
}

export function getUserInfo(session: any): UserInfo {
  if (session?.user?.id) {
    return {
      id: session.user.id,
      name: session.user.name || session.user.email || "Authenticated User",
      email: session.user.email,
      isAuthenticated: true,
    }
  }

  // For anonymous users, try to get persistent info from localStorage
  if (typeof window !== "undefined") {
    try {
      let anonymousId = localStorage.getItem("collaborative-editor-user-id")
      let anonymousName = localStorage.getItem("collaborative-editor-user-name")

      if (!anonymousId) {
        // Create a stable anonymous ID based on browser fingerprint
        const browserFingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}-${Intl.DateTimeFormat().resolvedOptions().timeZone}`
        const hash = browserFingerprint.split("").reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0)
          return a & a
        }, 0)
        anonymousId = `anonymous-${Math.abs(hash)}`
        localStorage.setItem("collaborative-editor-user-id", anonymousId)
      }

      if (!anonymousName) {
        anonymousName = "Anonymous User"
        localStorage.setItem("collaborative-editor-user-name", anonymousName)
      }

      return {
        id: anonymousId,
        name: anonymousName,
        isAuthenticated: false,
      }
    } catch (e) {
      console.warn("Failed to access localStorage:", e)
    }
  }

  // Fallback for server-side or when localStorage fails
  return {
    id: `anonymous-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: "Anonymous User",
    isAuthenticated: false,
  }
}

export function updateAnonymousUserName(newName: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("collaborative-editor-user-name", newName)
    } catch (e) {
      console.warn("Failed to save user name to localStorage:", e)
    }
  }
}
