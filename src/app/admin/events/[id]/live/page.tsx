import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, AlertCircle, RotateCcw, Eye } from "lucide-react";
import { getEventProgress } from "@/server/actions/tracking/getEventProgress";
import { LiveProgressTracker } from "./components/LiveProgressTracker";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LiveEventPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuth();

  try {
    // Get initial progress data
    const initialData = await getEventProgress({ eventId: id });

    if (!initialData.ok) {
      notFound();
    }

    // Verify org access
    await requireOrgAccess({
      userId: user.id,
      orgId: (initialData.event as any).orgId || (initialData.event as any).org_id,
      minRole: "viewer"
    });

    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/admin/events/${id}`} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {(initialData.event as any).name || (initialData.event as any).child_name || 'Event'} - Live Tracking
              </h1>
              <p className="text-gray-400">Real-time team progress monitoring</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Eye className="w-4 h-4 mr-2" />
              Full Screen
            </Button>
          </div>
        </div>

        {/* Live Progress Tracker */}
        <LiveProgressTracker
          eventId={id}
          initialData={initialData}
        />

        {/* Event Controls */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>Event Controls</CardTitle>
            <CardDescription className="text-gray-400">
              Management actions for the active event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                <Play className="w-4 h-4 mr-2" />
                Start Event
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <AlertCircle className="w-4 h-4 mr-2" />
                Send Message to All Teams
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error loading live event data:', error);
    notFound();
  }
}
