import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    console.log('Resolving URL:', url)

    // Follow redirects to get the final URL
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    })

    const finalUrl = response.url
    console.log('Final URL:', finalUrl)

    // Extract coordinates from the resolved URL
    let embedUrl = finalUrl
    
    if (finalUrl.includes('google.com/maps') && !finalUrl.includes('/embed')) {
      // Try to extract coordinates
      const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (coordMatch) {
        const lat = coordMatch[1]
        const lng = coordMatch[2]
        // Use the standard query parameter format (works without API key)
        embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
      } else {
        // Try to extract place name/ID if available
        const placeMatch = finalUrl.match(/place\/([^\/]+)/)
        if (placeMatch) {
          const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
          embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&output=embed`
        }
      }
    }

    return NextResponse.json({ 
      originalUrl: url,
      resolvedUrl: finalUrl,
      embedUrl: embedUrl 
    })
  } catch (error) {
    console.error('Error resolving URL:', error)
    return NextResponse.json(
      { error: 'Failed to resolve URL' },
      { status: 500 }
    )
  }
}
