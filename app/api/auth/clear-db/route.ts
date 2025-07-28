import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 })
  }

  try {
    const client = await clientPromise
    const db = client.db("collaborative-editor")

    // Clear NextAuth collections
    await db.collection("accounts").deleteMany({})
    await db.collection("sessions").deleteMany({})
    await db.collection("users").deleteMany({})
    await db.collection("verification_tokens").deleteMany({})

    return NextResponse.json({ message: "Database cleared successfully" })
  } catch (error) {
    console.error("Error clearing database:", error)
    return NextResponse.json({ error: "Failed to clear database" }, { status: 500 })
  }
}
