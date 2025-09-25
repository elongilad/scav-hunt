import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";
import { ArrowLeft, Route } from "lucide-react";
import Link from "next/link";
import { RouteVisualizationClient } from "./components/RouteVisualizationClient";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EventRoutingPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuth();

  try {
    // For now, we'll pass empty initial routes - the component will handle loading
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/admin/events/${id}`} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-2">
            <Route className="w-6 h-6 text-spy-gold" />
            <h1 className="text-3xl font-bold text-white">Team Routing System</h1>
          </div>
        </div>

        <div className="text-gray-400 text-sm mb-6">
          Generate and manage optimized routes for all teams using advanced pathfinding algorithms
        </div>

        {/* Route Visualization Interface */}
        <RouteVisualizationClient
          eventId={id}
          initialRoutes={[]}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading routing page:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/admin/events/${id}`} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Team Routing System</h1>
        </div>
        <div className="text-red-400">Error loading routing system. Please try again.</div>
      </div>
    );
  }
}