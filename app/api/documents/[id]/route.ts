import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const accessKey = searchParams.get("accessKey")
    const session = await getServerSession(authOptions)

    const client = await clientPromise
    const db = client.db("collaborative-editor")

    const document = await db.collection("documents").findOne({ _id: new ObjectId(params.id) })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check access permissions
    const isOwner = session?.user?.id === document.ownerId
    const hasAccessKey = accessKey === document.accessKey

    if (!isOwner && !hasAccessKey) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({
      ...document,
      _id: document._id.toString(),
      isOwner,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name } = await request.json()
    const client = await clientPromise
    const db = client.db("collaborative-editor")

    const result = await db.collection("documents").updateOne(
      { _id: new ObjectId(params.id), ownerId: session.user.id },
      {
        $set: {
          name,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db("collaborative-editor")

    const result = await db.collection("documents").deleteOne({
      _id: new ObjectId(params.id),
      ownerId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
