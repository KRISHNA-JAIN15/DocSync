export interface Document {
  _id?: string
  name: string
  content: string
  ownerId: string
  accessKey: string
  createdAt: Date
  updatedAt: Date
  language?: string
}

export interface DocumentUser {
  id: string
  name: string
  email: string
  cursor?: {
    line: number
    column: number
  }
}
