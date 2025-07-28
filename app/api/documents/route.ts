import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { nanoid } from "nanoid"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db("collaborative-editor")

    const documents = await db
      .collection("documents")
      .find({ ownerId: session.user.id })
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json(documents)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, content, language } = await request.json()
    const client = await clientPromise
    const db = client.db("collaborative-editor")

    const document = {
      name,
      content: content || "",
      ownerId: session.user.id,
      accessKey: nanoid(16),
      language: language || "javascript",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("documents").insertOne(document)

    return NextResponse.json({
      ...document,
      _id: result.insertedId.toString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}
