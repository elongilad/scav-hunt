import { requireAuth } from "@/lib/auth/requireAuth"
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess"
import { ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"
import { CommunicationHubClient } from "./components/CommunicationHubClient"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EventCommunicationPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireAuth()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/events/${id}`} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-spy-gold" />
          <h1 className="text-3xl font-bold text-white">Team Communication Hub</h1>
        </div>
      </div>

      <div className="text-gray-400 text-sm mb-6">
        Real-time messaging, announcements, and notifications for event coordination
      </div>

      {/* Communication Interface */}
      <CommunicationHubClient eventId={id} />
    </div>
  )
}