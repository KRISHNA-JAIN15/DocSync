"use client"

import { useEffect } from "react"

interface KeyboardShortcuts {
  onSave?: () => void
  onCopy?: () => void
}

export function useKeyboardShortcuts({ onSave, onCopy }: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S or Cmd+S for save
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault()
        onSave?.()
      }

      // Ctrl+Shift+C or Cmd+Shift+C for copy share link
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "C") {
        event.preventDefault()
        onCopy?.()
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onSave, onCopy])
}
