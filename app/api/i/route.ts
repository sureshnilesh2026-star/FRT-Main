import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let agentId = process.env.AGENT_ID
  let apiKey = process.env.XI_API_KEY
  
  console.log('API Route - AGENT_ID:', agentId ? 'Set (' + agentId.substring(0, 10) + '...)' : 'NOT SET')
  console.log('API Route - XI_API_KEY:', apiKey ? 'Set (' + apiKey.substring(0, 10) + '...)' : 'NOT SET')
  
  try {
    const body = await request.json()
    if (body.apiKey) apiKey = body.apiKey
    if (body.agentId) agentId = body.agentId
  } catch (e) {}
  
  if (!agentId) {
    return NextResponse.json({ error: 'AGENT_ID not configured' }, { status: 500 })
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'XI_API_KEY not configured' }, { status: 500 })
  }
  
  try {
    const apiUrl = new URL('https://api.elevenlabs.io/v1/convai/conversation/get-signed-url')
    apiUrl.searchParams.set('agent_id', agentId)
    
    console.log('Calling ElevenLabs API with agent:', agentId)
    console.log('API URL:', apiUrl.toString())
    
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    try {
      const response = await fetch(apiUrl.toString(), {
        headers: { 'xi-api-key': apiKey },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('ElevenLabs API Error:', response.status, errorText)
        return NextResponse.json({ 
          error: `ElevenLabs Error (${response.status}): ${errorText || response.statusText}` 
        }, { status: 500 })
      }
      
      const data = await response.json()
      console.log('ElevenLabs API Success:', data.signed_url ? 'Got signed URL' : 'No signed URL in response')
      return NextResponse.json({ apiKey: data.signed_url })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('ElevenLabs API Timeout after 30 seconds')
        return NextResponse.json({ 
          error: 'Request timeout: ElevenLabs API did not respond within 30 seconds. Please check your network connection and try again.' 
        }, { status: 500 })
      }
      if (fetchError.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
        console.error('ElevenLabs API Connection Timeout')
        return NextResponse.json({ 
          error: 'Connection timeout: Unable to connect to ElevenLabs API. Please check your network connection, firewall settings, and ensure api.elevenlabs.io is accessible.',
          details: process.env.NODE_ENV === 'development' ? {
            url: apiUrl.toString(),
            cause: fetchError.cause?.message
          } : undefined
        }, { status: 500 })
      }
      throw fetchError
    }
  } catch (error: any) {
    const message = error.message || error.toString()
    const errorDetails = {
      message,
      name: error.name,
      cause: error.cause?.message || error.cause,
      stack: error.stack
    }
    console.error('API Route Error:', JSON.stringify(errorDetails, null, 2))
    return NextResponse.json({ 
      error: `Failed to connect to ElevenLabs API: ${message}`,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 })
  }
}
