import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { content, accessKey } = await request.json()
    const session = await getServerSession(authOptions)

    console.log(`💾 SAVE REQUEST for document: ${params.id}`)
    console.log(`   Content length: ${content?.length || 0} characters`)
    console.log(`   Has access key: ${!!accessKey}`)
    console.log(`   User: ${session?.user?.name || "Anonymous"}`)

    let client
    let db

    try {
      client = await clientPromise
      db = client.db("collaborative-editor")
      console.log(`✅ Database connection established`)
    } catch (dbError) {
      console.error("❌ Database connection error:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed. Please try again.",
        },
        { status: 503 },
      )
    }

    // First, get the document to check permissions
    let document
    try {
      document = await db.collection("documents").findOne({ _id: new ObjectId(params.id) })
      console.log(`📄 Document found: ${document?.name || "Unknown"}`)
    } catch (findError) {
      console.error("❌ Document find error:", findError)
      return NextResponse.json(
        {
          error: "Failed to find document",
        },
        { status: 500 },
      )
    }

    if (!document) {
      console.log(`❌ Document not found: ${params.id}`)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check access permissions
    const isOwner = session?.user?.id === document.ownerId
    const hasAccessKey = accessKey === document.accessKey

    console.log(`🔐 Permission check:`)
    console.log(`   Is owner: ${isOwner}`)
    console.log(`   Has access key: ${hasAccessKey}`)
    console.log(`   Document access key: ${document.accessKey}`)
    console.log(`   Provided access key: ${accessKey}`)

    if (!isOwner && !hasAccessKey) {
      console.log(`❌ Access denied for document: ${params.id}`)
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update the document content
    try {
      const updateResult = await db.collection("documents").updateOne(
        { _id: new ObjectId(params.id) },
        {
          $set: {
            content: content || "",
            updatedAt: new Date(),
          },
        },
      )

      console.log(`💾 Update result:`)
      console.log(`   Matched count: ${updateResult.matchedCount}`)
      console.log(`   Modified count: ${updateResult.modifiedCount}`)

      if (updateResult.matchedCount === 0) {
        console.log(`❌ No document matched for update: ${params.id}`)
        return NextResponse.json({ error: "Document not found" }, { status: 404 })
      }

      console.log(`✅ Document ${params.id} saved successfully`)
      console.log(`   New content length: ${content?.length || 0} characters`)

      return NextResponse.json({
        success: true,
        contentLength: content?.length || 0,
        timestamp: new Date().toISOString(),
      })
    } catch (updateError) {
      console.error("❌ Document update error:", updateError)
      return NextResponse.json(
        {
          error: "Failed to save document. Please try again.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Content save error:", error)
    return NextResponse.json(
      {
        error: "Failed to save document",
      },
      { status: 500 },
    )
  }
}
