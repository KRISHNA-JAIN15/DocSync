import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { DashboardContent } from "@/components/dashboard-content"
import { authOptions } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/")
  }

  return <DashboardContent />
}
