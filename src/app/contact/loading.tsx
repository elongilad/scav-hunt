import { CardSkeleton } from '@/components/CardSkeleton'

export default function ContactLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black">
      {/* Header Skeleton */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-4">
          <div className="w-32 h-10 bg-white/10 rounded animate-pulse" />
          <div className="w-32 h-8 bg-white/10 rounded animate-pulse" />
        </div>
      </header>

      {/* Hero Skeleton */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-64 h-16 bg-white/10 rounded mx-auto mb-6 animate-pulse" />
          <div className="w-96 h-6 bg-white/10 rounded mx-auto mb-8 animate-pulse" />
        </div>
      </section>

      {/* Contact Options Skeleton */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} showHeader={false} lines={2} />
          ))}
        </div>

        {/* Contact Form Skeleton */}
        <div className="max-w-4xl mx-auto">
          <CardSkeleton showHeader={true} lines={8} className="h-96" />
        </div>
      </section>
    </div>
  )
}