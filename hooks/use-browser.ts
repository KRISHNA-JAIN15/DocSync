"use client"

import { useEffect, useState } from "react"

export function useBrowser() {
  const [isBrowser, setIsBrowser] = useState(false)

  useEffect(() => {
    setIsBrowser(typeof window !== "undefined")
  }, [])

  return {
    isBrowser,
    isServer: !isBrowser,
    window: isBrowser ? window : null,
    document: isBrowser ? document : null,
    navigator: isBrowser ? navigator : null,
  }
}
