import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const content = await file.text()
    const extension = file.name.split(".").pop()?.toLowerCase()

    // Map file extensions to Monaco languages
    const languageMap: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      html: "html",
      css: "css",
      json: "json",
      xml: "xml",
      sql: "sql",
      txt: "plaintext",
    }

    const language = languageMap[extension || "txt"] || "plaintext"

    const client = await clientPromise
    const db = client.db("collaborative-editor")

    const document = {
      name: file.name,
      content,
      language,
      ownerId: session.user.id,
      accessKey: nanoid(16),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("documents").insertOne(document)

    return NextResponse.json({
      ...document,
      _id: result.insertedId.toString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
