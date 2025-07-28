import { MongoClient, type MongoClientOptions } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options: MongoClientOptions = {
  // Connection timeout settings
  connectTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000, // 45 seconds
  serverSelectionTimeoutMS: 10000, // 10 seconds

  // Retry settings
  retryWrites: true,
  retryReads: true,
  maxPoolSize: 10,
  minPoolSize: 2,

  // DNS resolution settings
  family: 4, // Use IPv4 only to avoid DNS issues
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect().catch((error) => {
      console.error("MongoDB connection error:", error)
      // Retry connection after 5 seconds
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const newClient = new MongoClient(uri, options)
          newClient.connect().then(resolve).catch(reject)
        }, 5000)
      })
    })
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect().catch((error) => {
    console.error("MongoDB connection error:", error)
    throw error
  })
}

// Test the connection
clientPromise
  .then(() => {
    console.log("✅ MongoDB connected successfully")
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message)
  })

export default clientPromise
