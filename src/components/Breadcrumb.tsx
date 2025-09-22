import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const allItems = showHome
    ? [{ label: 'Home', href: '/' }, ...items]
    : items

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isFirst = index === 0
          const isLast = index === allItems.length - 1
          const isCurrent = item.current || isLast

          return (
            <li key={index} className="flex items-center">
              {/* Separator */}
              {!isFirst && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" aria-hidden="true" />
              )}

              {/* Home icon for first item if it's home */}
              {isFirst && showHome && (
                <Home className="w-4 h-4 text-spy-gold mr-1" aria-hidden="true" />
              )}

              {/* Breadcrumb item */}
              {isCurrent ? (
                <span
                  className="text-gray-300 font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href || '#'}
                  className="text-gray-400 hover:text-spy-gold transition-colors duration-200 hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  return (
    <div className={cn('container mx-auto px-4 py-4', className)}>
      <Breadcrumb items={items} />
    </div>
  )
}

// Pre-built breadcrumb configurations for common pages
export const breadcrumbConfigs = {
  demo: [
    { label: 'Demo', current: true }
  ],
  contact: [
    { label: 'Contact', current: true }
  ],
  terms: [
    { label: 'Legal', href: '/legal' },
    { label: 'Terms of Service', current: true }
  ],
  privacy: [
    { label: 'Legal', href: '/legal' },
    { label: 'Privacy Policy', current: true }
  ],
  auth: {
    login: [
      { label: 'Account', href: '/auth' },
      { label: 'Sign In', current: true }
    ],
    register: [
      { label: 'Account', href: '/auth' },
      { label: 'Sign Up', current: true }
    ],
    'auth-code-error': [
      { label: 'Account', href: '/auth' },
      { label: 'Authentication Error', current: true }
    ]
  },
  dashboard: [
    { label: 'Dashboard', current: true }
  ],
  events: {
    list: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Events', current: true }
    ],
    create: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Events', href: '/events' },
      { label: 'Create Event', current: true }
    ],
    edit: (eventName: string) => [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Events', href: '/events' },
      { label: eventName, current: true }
    ]
  }
}