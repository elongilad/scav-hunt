import { HeroSkeleton, GridSkeleton } from '@/components/CardSkeleton'

export default function DemoLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black">
      {/* Header Skeleton */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-4">
          <div className="w-32 h-10 bg-white/10 rounded animate-pulse" />
          <div className="w-48 h-8 bg-white/10 rounded animate-pulse" />
        </div>
      </header>

      {/* Hero Skeleton */}
      <section className="container mx-auto px-4 py-12 text-center">
        <HeroSkeleton />
      </section>

      {/* Demo Features Skeleton */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="w-96 h-12 bg-white/10 rounded mx-auto mb-6 animate-pulse" />
          <div className="w-128 h-6 bg-white/10 rounded mx-auto animate-pulse" />
        </div>
        <GridSkeleton count={3} />
      </section>
    </div>
  )
}