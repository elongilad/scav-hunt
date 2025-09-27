import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buildaquest.com'

  const staticPages = [
    {
      url: '',
      changefreq: 'weekly',
      priority: '1.0',
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      url: '/demo',
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      url: '/pricing',
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      url: '/contact',
      changefreq: 'monthly',
      priority: '0.6',
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      url: '/privacy',
      changefreq: 'yearly',
      priority: '0.3',
      lastmod: '2025-09-26'
    },
    {
      url: '/terms',
      changefreq: 'yearly',
      priority: '0.3',
      lastmod: '2025-09-26'
    }
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=86400, stale-while-revalidate'
    }
  })
}