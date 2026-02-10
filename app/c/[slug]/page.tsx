'use client'

import TextAnimation from '@/components/TextAnimation'
import { useConversation } from '@elevenlabs/react'
import { useParams, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useRef } from 'react'

export default function ConversationPage() {
  const { slug } = useParams()
  const searchParams = useSearchParams()

  // Read query params from FRT redirect, save to localStorage
  const [frtVariables, setFrtVariables] = useState<{ name: string; status: string; confidence: string }>({ name: '', status: '', confidence: '' })
  
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Read from query params first, fallback to localStorage
    const qName = searchParams.get('name')
    const qStatus = searchParams.get('status')
    const qConfidence = searchParams.get('confidence')

    const name = qName || localStorage.getItem('name') || ''
    const status = qStatus || localStorage.getItem('status') || ''
    const confidence = qConfidence || localStorage.getItem('confidence') || ''

    // Save to localStorage for persistence across refreshes
    if (name) localStorage.setItem('name', name)
    if (status) localStorage.setItem('status', status)
    if (confidence) localStorage.setItem('confidence', confidence)

    setFrtVariables({ name, status, confidence })
  }, [searchParams])

  const [currentText, setCurrentText] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [itemIdCounter, setItemIdCounter] = useState(1)
  const [isMounted, setIsMounted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showPaymentSummary, setShowPaymentSummary] = useState(false)
  const [paymentSummaryData, setPaymentSummaryData] = useState<any[]>([])
  const [showChatInterface, setShowChatInterface] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Use ref to track if component is mounted (for cleanup)
  const isMountedRef = useRef(true)

  const loadConversation = useCallback(() => {
    fetch(`/api/c?id=${slug}`)
      .then((res) => res.json())
      .then((res) => {
        if (isMountedRef.current) {
          if (res.length > 0) {
            setMessages(
              res.map((i: any) => ({
                ...i,
                formatted: {
                  text: i.content_transcript,
                  transcript: i.content_transcript,
                },
              })),
            )
          }
        }
      })
      .catch(() => {})
  }, [slug])

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onError: (error: string) => { 
      // Check if it's a WebSocket state error
      if (typeof error === 'string' && error.includes('CLOSING') || error.includes('CLOSED')) {
        // Don't set error message for WebSocket state errors as they might be transient
      } else {
        if (isMountedRef.current) {
          setIsConnecting(false)
          setErrorMessage(`Connection error: ${error}`)
        }
      }
    },
    onConnect: () => { 
      if (isMountedRef.current) {
        // Small delay to ensure WebSocket is fully ready
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsConnecting(false)
          }
        }, 200)
      }
    },
    onDisconnect: () => {
      if (isMountedRef.current) {
        setIsConnecting(false)
      }
    },
    onMessage: async (props: { message: string; source: 'user' | 'ai' }) => {
      if (!isMountedRef.current) return
      
      // Check connection status before processing message
      if (conversation.status !== 'connected') {
        return
      }
      
      const { message, source } = props
      let finalMessage = message
      
      const currentMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      setShowPaymentSummary(false)
      setPaymentSummaryData([])
      
      const newMessage = {
        id: currentMessageId,
        content_transcript: message,
        text: message,
        source: source,
        timestamp: new Date().toISOString(),
        formatted: { text: message, transcript: message }
      }
      
      setMessages(prev => [...prev, newMessage])
      
      if (source === 'ai') {
        setCurrentText('')
        const n8nProcessedData = await processEvaResponse(message)
        
        if (n8nProcessedData === 'PAYMENT_SUMMARY_COMPONENT') {
          finalMessage = 'PAYMENT_SUMMARY_COMPONENT'
          setCurrentText('')
          setShowPaymentSummary(true)
        } else {
          finalMessage = n8nProcessedData
          setCurrentText(finalMessage)
        }
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === currentMessageId 
              ? { ...msg, content_transcript: finalMessage, text: finalMessage }
              : msg
          )
        )
      } else if (source === 'user') {
        setShowPaymentSummary(false)
        setPaymentSummaryData([])
        setCurrentText('')
        finalMessage = message
      }
      
      // Save to API
      fetch('/api/c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slug,
          item: {
            type: 'message',
            status: 'completed',
            object: 'realtime.item',
            id: 'item_' + itemIdCounter,
            role: source === 'ai' ? 'assistant' : 'user',
            content: [{ type: 'text', transcript: finalMessage }],
          },
        }),
      }).then(() => {
        if (isMountedRef.current) {
          setItemIdCounter(prev => prev + 1)
          loadConversation()
        }
      }).catch(() => {})
    },
  })

  // Connect to ElevenLabs
  const connectConversation = useCallback(async () => {
    if (!isMountedRef.current) return
    if (isConnecting) return
    if (conversation.status === 'connected') return
    
    // If there's an existing session, clean it up first
    if (conversation.status !== 'idle' && conversation.status !== 'disconnected') {
      try {
        await conversation.endSession()
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (err) {
        // Cleanup error ignored
      }
    }
    
    setIsConnecting(true)
    
    try {
      // Request microphone permission
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      }
      
      // Get signed URL
      const response = await fetch('/api/i', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to connect to ElevenLabs API' }))
        const errorMsg = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        if (isMountedRef.current) {
          setIsConnecting(false)
          setErrorMessage(`Unable to connect to ElevenLabs: ${errorMsg}. Please check your network connection and API configuration.`)
        }
        return
      }
      
      const data = await response.json()
      
      if (data.error) {
        if (isMountedRef.current) {
          setIsConnecting(false)
          setErrorMessage(`ElevenLabs API Error: ${data.error}`)
        }
        return
      }
      
      // Clear any previous errors on success
      if (isMountedRef.current) {
        setErrorMessage(null)
      }
      
      // Read FRT variables from localStorage for ElevenLabs conversation
      const elName = localStorage.getItem('name') || ''
      const elStatus = localStorage.getItem('status') || ''
      const elConfidence = localStorage.getItem('confidence') || ''
      
      // Ensure variables are ready before starting conversation
      if (!elName || !elStatus || !elConfidence) {
        if (isMountedRef.current) {
          setIsConnecting(false)
          setErrorMessage('Face recognition variables not received. Please go back and capture your photo first.')
        }
        return
      }
      
      // Start session with signed URL and FRT variables
      await conversation.startSession({ 
        signedUrl: data.apiKey,
        connectionType: 'websocket',
        dynamicVariables: {
          name: elName,
          status: elStatus,
          confidence: elConfidence
        }
      })
      
      // Wait a bit for WebSocket to fully establish before marking as connected
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify connection is still active
      if (isMountedRef.current) {
        setIsConnecting(false)
      }
      
    } catch (error: any) {
      if (isMountedRef.current) {
        setIsConnecting(false)
        setErrorMessage(`Connection failed: ${error.message || 'Unknown error'}. Please check your network connection and try again.`)
      }
    }
  }, [conversation, isConnecting])

  // Disconnect from ElevenLabs
  const disconnectConversation = useCallback(async () => {
    if (conversation.status === 'connected' || conversation.status === 'connecting') {
      try {
        await conversation.endSession()
      } catch (error: any) {
        // Disconnect error ignored (WebSocket might already be closed)
      }
    }
    if (isMountedRef.current) {
      setIsConnecting(false)
      setShowPaymentSummary(false)
      setPaymentSummaryData([])
    }
  }, [conversation])

  // Handle start listening
  const handleStartListening = useCallback(async () => {
    if (conversation.status !== 'connected' && !isConnecting) {
      // Send webhook FIRST
      fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'conversation_started',
          conversationId: slug,
          timestamp: new Date().toISOString(),
          status: 'connecting'
        }),
      }).catch(() => {})
      
      await connectConversation()
    }
  }, [conversation.status, isConnecting, slug, connectConversation])

  // Handle stop listening
  const handleStopListening = useCallback(async () => {
    await disconnectConversation()
    if (isMountedRef.current) {
      setCurrentText('')
      setShowPaymentSummary(false)
      setPaymentSummaryData([])
    }
  }, [disconnectConversation])

  // Process Eva response through n8n
  const processEvaResponse = async (message: string): Promise<string> => {
    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          event: 'eva_response_processing',
          conversationId: slug,
          timestamp: new Date().toISOString(),
          requestType: 'process_eva_response',
          originalMessage: message,
          requestId: `eva_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }),
      })

      if (!response.ok) {
        return processLocalFallback(message)
      }

      const data = await response.json()

      if (data.success && data.n8nResponse) {
        let formattedText = ''
        
        if (data.n8nResponse.type === 'error') {
          formattedText = `⚠️ N8N Error: ${data.n8nResponse.content}\n`
        } else if (data.n8nResponse.content) {
          formattedText = `${data.n8nResponse.content}\n`
        } else {
          try {
            const n8nData = Array.isArray(data.n8nResponse) ? data.n8nResponse[0] : data.n8nResponse
            
            if (n8nData?.Transcript && Array.isArray(n8nData.Transcript)) {
              n8nData.Transcript.forEach((item: any) => {
                if (item.Conversation) {
                  const conv = item.Conversation
                  if (conv.Title) formattedText += `${conv.Title}\n\n`
                  if (conv.Subtitle) formattedText += `${conv.Subtitle}\n\n`
                  if (conv.Text) formattedText += `${conv.Text}\n\n`
                }
                
                if (item.Products) {
                  const products = item.Products
                  const headerLine = products['Header Line']
                  
                  const isLoanData = headerLine && (
                    headerLine.toLowerCase().includes('loan') ||
                    headerLine.toLowerCase().includes('emi') ||
                    headerLine.toLowerCase().includes('interest')
                  )
                  
                  if (isLoanData) {
                    const paymentData = extractMultipleLoanData(products)
                    if (paymentData && paymentData.length > 0) {
                      setPaymentSummaryData(paymentData)
                      setShowPaymentSummary(true)
                      return 'PAYMENT_SUMMARY_COMPONENT'
                    }
                  }
                  
                  if (headerLine) formattedText += `${headerLine}\n\n`
                }
              })
            } else if (n8nData?.Products?.['Header Line']) {
              formattedText = `${n8nData.Products['Header Line']}\n\n`
            } else {
              formattedText = JSON.stringify(data.n8nResponse, null, 2)
            }
          } catch {
            formattedText = JSON.stringify(data.n8nResponse, null, 2)
          }
        }
        
        return formattedText
      }
      
      return processLocalFallback(message)
      
    } catch (error) {
      return processLocalFallback(message)
    }
  }

  const processLocalFallback = (message: string): string => {
    const loanKeywords = ['Home Loan', 'Personal Loan', 'Car Loan', 'EMI', 'interest rate', 'loan details']
    const isLoanMessage = loanKeywords.some(kw => message.toLowerCase().includes(kw.toLowerCase()))
    
    if (isLoanMessage) {
      return '🏠 Loan information detected. N8N unavailable for structured display.\n'
    }
    
    return `📊 Message: ${message.length} chars, ${message.split(' ').length} words\n`
  }

  const extractMultipleLoanData = (products: any): any[] | null => {
    try {
      const headerLine = products['Header Line']
      if (!headerLine?.trim()) return null
      
      const productKeys = Object.keys(products).filter(key => key !== 'Header Line')
      if (productKeys.length === 0) return null
      
      const loanDataArray: any[] = []
      
      productKeys.forEach((productKey, index) => {
        const product = products[productKey]
        if (!product?.['Product Name']?.trim()) return
        
        const productName = product['Product Name']
        const datasets = product.Datasets || []
        const data: any = {}
        
        datasets.forEach((dataset: any) => {
          const datasetKey = Object.keys(dataset)[0]
          const datasetData = dataset[datasetKey]
          
          if (datasetData?.Label?.trim() && datasetData?.Value != null) {
            const label = datasetData.Label.toLowerCase()
            
            if (label.includes('amount')) data.amount = datasetData.Value
            else if (label.includes('start date')) data.startDate = datasetData.Value
            else if (label.includes('interest rate')) data.interestRate = datasetData.Value
            else if (label.includes('balance tenure')) data.balanceTenure = datasetData.Value
            else if (label.includes('emi')) data.emi = datasetData.Value
            else if (label.includes('outstanding principal')) data.outstandingPrincipal = datasetData.Value
            else if (label.includes('principal')) data.principal = datasetData.Value
          }
        })
        
        if (data.amount || data.startDate || data.interestRate) {
          let accountNumber = "*****6789"
          if (productName.includes('****')) {
            const match = productName.match(/\*\*\*\*(\d+)/)
            if (match) accountNumber = `*****${match[1]}`
          }
          
          loanDataArray.push({
            mainHeaderText: "",
            mainHeaderSubText: "",
            header2Text: index === 0 ? headerLine : "",
            loanType: productName.replace(/\s*\*\*\*\*\d+/, ''),
            accountNumber,
            amount: data.amount || "",
            startDate: data.startDate || "",
            interestRate: data.interestRate || "",
            balanceTenure: data.balanceTenure || "",
            emi: data.emi || "",
            outstandingPrincipal: data.outstandingPrincipal || "",
            principal: data.principal || "",
            holdBalance: "",
            holdBalanceText: "",
            documentTitle: "",
            documentSize: "",
            confirmationText: ""
          })
        }
      })
      
      return loanDataArray.length > 0 ? loanDataArray : null
    } catch (error) {
      return null
    }
  }

  // Mount effect - load conversation data
  useEffect(() => {
    loadConversation()
  }, [loadConversation])
  
  // Mount/unmount effect - setup and cleanup
  useEffect(() => {
    isMountedRef.current = true
    setIsMounted(true)
    
    return () => {
      isMountedRef.current = false
      // Cleanup: disconnect on unmount
      if (conversation.status === 'connected') {
        conversation.endSession().catch(() => {})
      }
    }
  }, [])

  // Prevent hydration mismatch
  if (!isMounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <TextAnimation 
      currentText={currentText} 
      isAudioPlaying={conversation.isSpeaking} 
      onStopListening={handleStopListening} 
      onStartListening={handleStartListening}
      setCurrentText={setCurrentText}
      showPaymentSummary={showPaymentSummary}
      paymentSummaryData={paymentSummaryData}
      showChatInterface={showChatInterface}
      setShowChatInterface={setShowChatInterface}
      conversationHistory={messages}
      errorMessage={errorMessage}
      onDismissError={() => setErrorMessage(null)}
    />
  )
}
