import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { getTeamDetails } from "@/server/actions/teams/getTeamDetails";
import { TeamManagementClient } from "./components/TeamManagementClient";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TeamsPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuth();

  try {
    // Get all teams for the event
    const result = await getTeamDetails({ eventId: id });

    if (!result.ok) {
      throw new Error("Failed to load teams");
    }

    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/admin/events/${id}`} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-spy-gold" />
            <h1 className="text-3xl font-bold text-white">Team Management</h1>
          </div>
        </div>

        <div className="text-gray-400 text-sm mb-6">
          Manage teams, monitor progress, and coordinate team activities
        </div>

        {/* Team Management Interface */}
        <TeamManagementClient
          eventId={id}
          initialTeams={result.teams || []}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading teams:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/admin/events/${id}`} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Team Management</h1>
        </div>
        <div className="text-red-400">Error loading teams. Please try again.</div>
      </div>
    );
  }
}