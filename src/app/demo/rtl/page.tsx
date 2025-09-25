'use client'

// This page is disabled for static build due to LanguageProvider dependencies
export default function RTLDemoPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">RTL Demo</h1>
      <p>This demo is temporarily disabled for static generation.</p>
      <p className="text-sm text-gray-500 mt-4">
        This page contains components that depend on the LanguageProvider context,
        which is not available during static site generation. It can be re-enabled
        for client-side only rendering when needed.
      </p>
    </div>
  )
}