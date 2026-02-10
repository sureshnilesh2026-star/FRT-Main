'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frozenImgRef = useRef<HTMLImageElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [resultMessage, setResultMessage] = useState<{
    type: 'matched' | 'not-matched' | 'error'
    name: string
    status: string
    confidence: string
  } | null>(null)

  const webhookURL = "https://eva-ramanik.app.n8n.cloud/webhook/face-match"
  const AGENT_ID = "agent_3701kh0eb96rf34vc2rgyew10wjk"

  // Auto-start camera on page load
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" }, 
          audio: false 
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err: any) {
        void err
        if (err.name === "NotAllowedError") {
          alert("Camera permission denied. Please allow camera access and reload.")
        } else if (err.name === "NotReadableError") {
          alert("Camera is in use by another app. Please close it and reload.")
        } else {
          alert("Unable to access camera: " + err.message)
        }
      }
    }
    startCamera()

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const [captured, setCaptured] = useState(false)

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const frozenImg = frozenImgRef.current

    if (!video || !canvas || !frozenImg) return

    setCaptured(true)

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0)

    // Freeze: show captured frame, hide live video
    frozenImg.src = canvas.toDataURL("image/jpeg")
    frozenImg.style.display = "block"
    video.style.display = "none"

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    canvas.toBlob((blob) => {
      if (blob) {
        sendToN8N(blob, "photo.jpg")
      }
    }, "image/jpeg")
  }

  const sendToN8N = (blob: Blob, filename: string) => {
    const formData = new FormData()
    formData.append("file", blob, filename)
    
    setIsSending(true)
    setResultMessage(null)

    fetch(webhookURL, {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      const vars = data.conversation_initiation_data?.variables || {}
      const name = vars.name || "Unknown"
      const status = vars.status || "UNKNOWN"
      const confidence = vars.confidence || "N/A"

      // Save variables to localStorage
      localStorage.setItem("name", name)
      localStorage.setItem("status", status)
      localStorage.setItem("confidence", confidence)

      setIsSending(false)

      const isMatched = status === "MATCHED"
      setResultMessage({
        type: isMatched ? "matched" : "not-matched",
        name,
        status,
        confidence
      })

      // After 5 seconds: redirect if MATCHED, otherwise reload
      if (isMatched) {
        // Generate conversation ID and redirect to chat page
        const conversationId = `${performance.now()}_${Math.random()}`
        const params = new URLSearchParams({
          name: name,
          status: status,
          confidence: confidence
        })
        setTimeout(() => {
          router.push(`/c/${conversationId}?${params.toString()}`)
        }, 5000)
      } else {
        setTimeout(() => {
          window.location.reload()
        }, 5000)
      }
    })
    .catch(err => {
      void err
      setIsSending(false)
      setResultMessage({
        type: "error",
        name: "Error",
        status: "Could not process your photo",
        confidence: ""
      })

      // Refresh page after 5 seconds on error
      setTimeout(() => {
        window.location.reload()
      }, 5000)
    })
  }

  return (
    <div style={{
      margin: 0,
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        background: '#ffffff',
        padding: '16px',
        borderRadius: '16px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        width: '320px',
        height: '460px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <h2 style={{ margin: '8px 0 2px' }}>Capture Your Photo</h2>
        <p style={{ color: '#666', fontSize: '13px', margin: '0 0 8px' }}>Look straight to me</p>

        <div style={{
          width: '100%',
          height: '240px',
          border: '2px solid #ccc',
          borderRadius: '10px',
          marginBottom: '20px',
          overflow: 'hidden',
          background: '#f0f0f0'
        }}>
          <video 
            ref={videoRef}
            id="preview" 
            autoPlay 
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: 'block'
            }}
          />
          <img 
            ref={frozenImgRef}
            id="frozenImg" 
            alt="Captured Photo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: 'none'
            }}
          />
        </div>

        {!captured && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <button
              onClick={capturePhoto}
              disabled={isSending || !!resultMessage}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: '4px solid #ccc',
                background: 'white',
                cursor: isSending || resultMessage ? 'not-allowed' : 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.1s',
                opacity: isSending || resultMessage ? 0.5 : 1
              }}
              onMouseDown={(e) => {
                if (!isSending && !resultMessage) {
                  e.currentTarget.style.transform = 'scale(0.9)'
                }
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: (isSending || resultMessage) ? '#ccc' : '#007bff',
                transition: 'background 0.2s'
              }} />
            </button>
          </div>
        )}
        
        {isSending && (
          <p style={{
            display: 'block',
            fontSize: '14px',
            color: '#666',
            marginTop: '8px'
          }}>
            📤 Sending your photo...
          </p>
        )}

        {resultMessage && (
          <div style={{
            display: 'block',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 'bold',
            background: resultMessage.type === 'matched' ? '#d4edda' : '#f8d7da',
            color: resultMessage.type === 'matched' ? '#155724' : '#721c24',
            border: `1px solid ${resultMessage.type === 'matched' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              {resultMessage.type === 'matched' ? '👋' : resultMessage.type === 'error' ? '⚠️' : '❌'} {resultMessage.name}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 'normal'
            }}>
              Status: {resultMessage.status}
            </div>
            {resultMessage.confidence && (
              <div style={{
                fontSize: '14px',
                fontWeight: 'normal',
                marginTop: '2px'
              }}>
                Confidence: {resultMessage.confidence}
              </div>
            )}
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}

