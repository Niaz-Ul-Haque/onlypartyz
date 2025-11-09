import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')
    const date = searchParams.get('date')

    console.log('Weather API called with:')
    console.log('  Address:', address)
    console.log('  Address length:', address?.length)
    console.log('  Date:', date)

    if (!address || !date) {
      return NextResponse.json(
        { error: 'Address and date are required' },
        { status: 400 }
      )
    }

    // Step 1: Geocode the address using OpenStreetMap Nominatim
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    console.log('Geocoding URL:', geocodeUrl)

    const geocodeResponse = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': 'OnlyPartyz Party Planning App'
      }
    })

    if (!geocodeResponse.ok) {
      console.error('Geocoding failed:', geocodeResponse.status, geocodeResponse.statusText)
      return NextResponse.json(
        { error: `Geocoding failed: ${geocodeResponse.statusText}` },
        { status: 502 }
      )
    }

    const geocodeData = await geocodeResponse.json()
    console.log('Geocoding result:', geocodeData)

    if (!geocodeData || geocodeData.length === 0) {
      return NextResponse.json(
        { error: 'Location not found. Please use a more specific address.' },
        { status: 404 }
      )
    }

    const { lat, lon } = geocodeData[0]
    console.log('Coordinates:', { lat, lon })

    // Step 2: Get weather forecast from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=16`
    console.log('Weather URL:', weatherUrl)

    const weatherResponse = await fetch(weatherUrl)

    if (!weatherResponse.ok) {
      console.error('Weather fetch failed:', weatherResponse.status, weatherResponse.statusText)
      return NextResponse.json(
        { error: `Weather service unavailable: ${weatherResponse.statusText}` },
        { status: 502 }
      )
    }

    const weatherData = await weatherResponse.json()
    console.log('Weather data received:', weatherData)

    // Find the weather for the specific date
    // Parse the date and convert to YYYY-MM-DD format
    const dateObj = new Date(date)
    const partyDate = dateObj.toISOString().split('T')[0]
    console.log('Looking for date:', partyDate, 'in dates:', weatherData.daily?.time)

    const dateIndex = weatherData.daily?.time?.indexOf(partyDate)

    if (dateIndex === undefined || dateIndex === -1) {
      const availableDates = weatherData.daily?.time || []
      console.log('Date not found. Available dates:', availableDates)

      return NextResponse.json(
        {
          error: `Weather data not available for ${partyDate}. Data available from ${availableDates[0]} to ${availableDates[availableDates.length - 1]}. Party might be too far in the future.`
        },
        { status: 404 }
      )
    }

    // Weather code interpretation
    const getWeatherDescription = (code: number): string => {
      if (code === 0) return 'Clear sky'
      if (code <= 3) return 'Partly cloudy'
      if (code <= 48) return 'Foggy'
      if (code <= 67) return 'Rainy'
      if (code <= 77) return 'Snowy'
      if (code <= 82) return 'Rain showers'
      if (code <= 86) return 'Snow showers'
      if (code <= 99) return 'Thunderstorm'
      return 'Unknown'
    }

    const getWeatherEmoji = (code: number): string => {
      if (code === 0) return '☀️'
      if (code <= 3) return '⛅'
      if (code <= 48) return '🌫️'
      if (code <= 67) return '🌧️'
      if (code <= 77) return '❄️'
      if (code <= 82) return '🌦️'
      if (code <= 86) return '🌨️'
      if (code <= 99) return '⛈️'
      return '🌡️'
    }

    const weatherCode = weatherData.daily.weathercode[dateIndex]
    const tempMax = weatherData.daily.temperature_2m_max[dateIndex]
    const tempMin = weatherData.daily.temperature_2m_min[dateIndex]
    const precipProb = weatherData.daily.precipitation_probability_max[dateIndex]

    // Check if we have valid data
    if (tempMax === null || tempMax === undefined) {
      return NextResponse.json(
        { error: 'Weather data incomplete for this date' },
        { status: 404 }
      )
    }

    const forecast = {
      date: partyDate,
      temperature_max: tempMax,
      temperature_min: tempMin,
      precipitation_probability: precipProb || 0,
      weather_code: weatherCode,
      description: getWeatherDescription(weatherCode),
      emoji: getWeatherEmoji(weatherCode),
      location: geocodeData[0].display_name,
    }

    return NextResponse.json({ forecast })
  } catch (error) {
    console.error('Error fetching weather:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
