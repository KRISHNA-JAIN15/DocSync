"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Upload,
  LogOut,
  Search,
  Calendar,
  Clock,
  Code,
  FolderOpen,
} from "lucide-react"
import Link from "next/link"
import type { Document } from "@/lib/models/document"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function DashboardContent() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [newDocName, setNewDocName] = useState("")
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [editName, setEditName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"name" | "date" | "modified">("modified")

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents")
      if (response.ok) {
        const docs = await response.json()
        setDocuments(docs)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createDocument = async () => {
    if (!newDocName.trim()) return

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDocName }),
      })

      if (response.ok) {
        const doc = await response.json()
        setDocuments([doc, ...documents])
        setNewDocName("")
        toast({
          title: "Success",
          description: "Document created successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive",
      })
    }
  }

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const doc = await response.json()
        setDocuments([doc, ...documents])
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })
    }

    event.target.value = ""
  }

  const updateDocument = async () => {
    if (!editingDoc || !editName.trim()) return

    try {
      const response = await fetch(`/api/documents/${editingDoc._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      })

      if (response.ok) {
        setDocuments(documents.map((doc) => (doc._id === editingDoc._id ? { ...doc, name: editName } : doc)))
        setEditingDoc(null)
        setEditName("")
        toast({
          title: "Success",
          description: "Document renamed successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename document",
        variant: "destructive",
      })
    }
  }

  const deleteDocument = async (doc: Document) => {
    try {
      const response = await fetch(`/api/documents/${doc._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDocuments(documents.filter((d) => d._id !== doc._id))
        toast({
          title: "Success",
          description: "Document deleted successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const copyShareLink = (doc: Document) => {
    const url = `${window.location.origin}/editor/${doc._id}?accessKey=${doc.accessKey}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Success",
      description: "Share link copied to clipboard",
    })
  }

  // Filter and sort documents
  const filteredDocuments = documents
    .filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "modified":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        default:
          return 0
      }
    })

  const recentDocuments = documents
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)

  const getLanguageColor = (language?: string) => {
    const colors: Record<string, string> = {
      javascript: "bg-yellow-100 text-yellow-800",
      typescript: "bg-blue-100 text-blue-800",
      python: "bg-green-100 text-green-800",
      java: "bg-red-100 text-red-800",
      cpp: "bg-purple-100 text-purple-800",
      html: "bg-orange-100 text-orange-800",
      css: "bg-pink-100 text-pink-800",
      json: "bg-gray-100 text-gray-800",
    }
    return colors[language || "plaintext"] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Code className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">CodeSpace</h1>
              </div>
              <Badge variant="secondary" className="hidden sm:flex">
                {documents.length} documents
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {session?.user?.name?.charAt(0) || "U"}
                    </div>
                    <span className="hidden sm:block">{session?.user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name?.split(" ")[0]}! 👋
          </h2>
          <p className="text-gray-600">Ready to code something amazing today?</p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                All Documents
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4" />
                      New Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Document</DialogTitle>
                      <DialogDescription>Create a new blank document to start coding.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Document Name</Label>
                        <Input
                          id="name"
                          value={newDocName}
                          onChange={(e) => setNewDocName(e.target.value)}
                          placeholder="Enter document name"
                          onKeyDown={(e) => e.key === "Enter" && createDocument()}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={createDocument} disabled={!newDocName.trim()}>
                        Create Document
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".js,.ts,.py,.java,.cpp,.c,.html,.css,.json,.xml,.sql,.txt"
                    onChange={uploadFile}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <TabsContent value="all" className="space-y-6">
            {filteredDocuments.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {searchQuery ? "No documents found" : "No documents yet"}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery
                      ? `No documents match "${searchQuery}"`
                      : "Create your first document or upload a code file to get started."}
                  </p>
                  {!searchQuery && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Document
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Document</DialogTitle>
                          <DialogDescription>Create a new blank document to start coding.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Document Name</Label>
                            <Input
                              id="name"
                              value={newDocName}
                              onChange={(e) => setNewDocName(e.target.value)}
                              placeholder="Enter document name"
                              onKeyDown={(e) => e.key === "Enter" && createDocument()}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={createDocument} disabled={!newDocName.trim()}>
                            Create Document
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map((doc) => (
                  <Card
                    key={doc._id}
                    className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-white/80 backdrop-blur-sm"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg truncate">{doc.name}</CardTitle>
                            <Badge className={`text-xs ${getLanguageColor(doc.language)}`}>
                              {doc.language || "text"}
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(doc.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingDoc(doc)
                                setEditName(doc.name)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyShareLink(doc)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Share Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteDocument(doc)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                        <Link href={`/editor/${doc._id}?accessKey=${doc.accessKey}`}>
                          <Code className="h-4 w-4 mr-2" />
                          Open Editor
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            {recentDocuments.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="text-center py-12">
                  <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No recent activity</h3>
                  <p className="text-gray-500">Start coding to see your recent documents here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {recentDocuments.map((doc) => (
                  <Card
                    key={doc._id}
                    className="group hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{doc.name}</h3>
                            <p className="text-sm text-gray-500">Modified {new Date(doc.updatedAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getLanguageColor(doc.language)}`}>
                            {doc.language || "text"}
                          </Badge>
                          <Button asChild size="sm">
                            <Link href={`/editor/${doc._id}?accessKey=${doc.accessKey}`}>Open</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>Enter a new name for your document.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Document Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter document name"
                onKeyDown={(e) => e.key === "Enter" && updateDocument()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDoc(null)}>
              Cancel
            </Button>
            <Button onClick={updateDocument} disabled={!editName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
