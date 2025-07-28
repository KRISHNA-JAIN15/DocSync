"use client"

import { useEffect, useRef } from "react"
import * as monaco from "monaco-editor"

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
}

export default function MonacoEditor({ value, onChange, language }: MonacoEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize Monaco Editor
    editorRef.current = monaco.editor.create(containerRef.current, {
      value,
      language,
      theme: "vs-dark",
      automaticLayout: true,
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      lineNumbers: "on",
      renderWhitespace: "selection",
      tabSize: 2,
      insertSpaces: true,
    })

    // Listen for content changes
    const disposable = editorRef.current.onDidChangeModelContent(() => {
      const currentValue = editorRef.current?.getValue() || ""
      onChange(currentValue)
    })

    return () => {
      disposable.dispose()
      editorRef.current?.dispose()
    }
  }, [])

  // Update editor value when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value)
    }
  }, [value])

  // Update language when prop changes
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, language)
      }
    }
  }, [language])

  return <div ref={containerRef} className="h-full w-full" />
}
