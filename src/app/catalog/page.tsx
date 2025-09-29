import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Gift } from 'lucide-react';
import Link from 'next/link';

export default async function CatalogPage() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const supabase = createAdminClient();

  // Check if user is authenticated, but don't require it for viewing catalog
  let user = null;
  try {
    const authModule = await import('@/lib/auth');
    user = await authModule.getUser();
    if (user) {
      console.log('✅ User authenticated:', user.email);
    }
  } catch (error) {
    console.log('❌ Auth error in catalog:', error);
  }

  if (!user) {
    console.log('🔑 No user found, showing login buttons');
  }

  const { data: models, error } = await supabase
    .from('hunt_models')
    .select('id, name, description')
    .eq('published', true)
    .order('name');

  if (error) {
    console.error('❌ Error loading models:', error);
  } else {
    console.log('✅ Loaded models:', models?.length || 0, 'models');
  }

  return (
    <main className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quest Catalog</h1>
        <p className="text-gray-600">Choose from our collection of interactive quest adventures</p>
      </div>

      {!models || models.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-600 mb-2">No quests available yet</h2>
          <p className="text-gray-500">Check back soon for new adventures!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <Card key={model.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <Gift className="w-12 h-12 text-white" />
                </div>
                <CardTitle className="text-xl">{model.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {model.description || 'An exciting quest adventure awaits!'}
                </p>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Adventure Quest
                  </Badge>
                </div>

                {/* For MVP, we'll create a simple form that could be enhanced with Stripe */}
                {user ? (
                  <form action="/api/checkout/session" method="post" className="mt-4">
                    <input type="hidden" name="modelId" value={model.id} />
                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      {isDevelopment ? 'Get Quest (Free Test)' : 'Buy & Set Up Quest'}
                    </Button>
                  </form>
                ) : (
                  <Link href="/auth/login" className="block mt-4">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Sign In to Get Quest
                    </Button>
                  </Link>
                )}

                {/* Preview link for development */}
                <Link href={`/catalog/${model.id}/preview`} className="block">
                  <Button variant="outline" className="w-full">
                    Preview Quest
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}