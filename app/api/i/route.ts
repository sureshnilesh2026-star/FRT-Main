import { NextResponse } from 'next/server'
import https from 'https'
import dns from 'dns'

// Force IPv4-first DNS resolution to avoid IPv6 timeout on Windows
dns.setDefaultResultOrder('ipv4first')

function httpsGet(url: string, apiKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: { 'xi-api-key': apiKey },
      timeout: 15000,
      family: 4, // Force IPv4
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data)
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.on('error', (err) => {
      reject(err)
    })

    req.end()
  })
}

export async function POST(request: Request) {
  let agentId = process.env.AGENT_ID
  let apiKey = process.env.XI_API_KEY

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
    const apiUrl = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`
    console.log('Calling ElevenLabs API with agent:', agentId)

    const responseBody = await httpsGet(apiUrl, apiKey)
    const data = JSON.parse(responseBody)

    console.log('ElevenLabs API Success:', data.signed_url ? 'Got signed URL' : 'No signed URL')
    return NextResponse.json({ apiKey: data.signed_url })
  } catch (error: any) {
    const message = error.message || error.toString()
    console.error('ElevenLabs API Error:', message)
    return NextResponse.json({
      error: `Failed to connect to ElevenLabs API: ${message}`
    }, { status: 500 })
  }
}
