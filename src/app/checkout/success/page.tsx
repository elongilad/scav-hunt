'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams?.get('session_id');
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    // Poll for the created event (webhook may take a moment to process)
    const pollForEvent = async () => {
      try {
        const response = await fetch(`/api/checkout/verify?session_id=${sessionId}`);

        if (response.ok) {
          const data = await response.json();
          if (data.eventId) {
            setEventId(data.eventId);
            setLoading(false);
            return;
          }
        }

        // If no event yet, try again in 2 seconds
        setTimeout(pollForEvent, 2000);
      } catch (err) {
        console.error('Error polling for event:', err);
        setTimeout(pollForEvent, 2000);
      }
    };

    // Start polling after a short delay to allow webhook processing
    setTimeout(pollForEvent, 1000);
  }, [sessionId]);

  if (!sessionId) {
    return (
      <main className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No checkout session found. Please try purchasing again.</p>
            <Link href="/catalog" className="mt-4">
              <Button>Return to Catalog</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Your Purchase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We're setting up your quest adventure. This may take a few moments...
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div>✓ Payment confirmed</div>
              <div>⏳ Creating your event...</div>
              <div>⏳ Setting up quest stations...</div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Setup Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <p className="text-sm text-gray-600 mb-4">
              Don't worry - your payment was processed successfully. Please contact support for assistance.
            </p>
            <Link href="/catalog">
              <Button>Return to Catalog</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            Quest Ready!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your quest adventure has been successfully created and is ready to set up.
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Payment:</span>
              <span className="text-green-600 font-medium">✓ Completed</span>
            </div>
            <div className="flex justify-between">
              <span>Quest Setup:</span>
              <span className="text-green-600 font-medium">✓ Ready</span>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            {eventId ? (
              <Link href={`/dashboard/events/${eventId}/setup`}>
                <Button className="w-full">
                  Configure Your Quest
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => router.push('/dashboard/events')}
                className="w-full"
              >
                View My Events
              </Button>
            )}

            <Link href="/catalog">
              <Button variant="outline" className="w-full">
                Browse More Quests
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}