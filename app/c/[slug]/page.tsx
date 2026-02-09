'use client'

import TextAnimation from '@/components/TextAnimation'
import { useConversation } from '@elevenlabs/react'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState, useRef } from 'react'

export default function ConversationPage() {
  const { slug } = useParams()
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
        if (res.length > 0 && isMountedRef.current) {
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
      })
      .catch(console.error)
  }, [slug])

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onError: (error: string) => { 
      console.error('ElevenLabs Error:', error)
      console.error('Error details:', JSON.stringify(error))
      if (isMountedRef.current) {
        setIsConnecting(false)
      }
    },
    onConnect: () => { 
      console.log('ElevenLabs Connected! Status will change to connected.')
      if (isMountedRef.current) {
        setIsConnecting(false)
      }
    },
    onDisconnect: () => {
      console.log('ElevenLabs Disconnected')
      if (isMountedRef.current) {
        setIsConnecting(false)
      }
    },
    onMessage: async (props: { message: string; source: 'user' | 'ai' }) => {
      if (!isMountedRef.current) return
      
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
      }).catch(console.error)
    },
  })

  // Connect to ElevenLabs
  const connectConversation = useCallback(async () => {
    if (!isMountedRef.current || isConnecting) return
    if (conversation.status === 'connected') return
    
    setIsConnecting(true)
    console.log('Starting ElevenLabs connection...')
    
    try {
      // Request microphone permission
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        console.log('Requesting microphone permission...')
        await navigator.mediaDevices.getUserMedia({ audio: true })
        console.log('Microphone permission granted')
      }
      
      // Get signed URL
      console.log('Fetching signed URL...')
      const response = await fetch('/api/i', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to connect to ElevenLabs API' }))
        const errorMsg = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        console.error('API Error:', errorMsg)
        if (isMountedRef.current) {
          setIsConnecting(false)
          setErrorMessage(`Unable to connect to ElevenLabs: ${errorMsg}. Please check your network connection and API configuration.`)
        }
        return
      }
      
      const data = await response.json()
      
      if (data.error) {
        console.error('API Error:', data.error)
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
      
      console.log('Got signed URL, starting session...')
      
      // Start session with signed URL - must specify websocket connection type
      const sessionId = await conversation.startSession({ 
        signedUrl: data.apiKey,
        connectionType: 'websocket'
      })
      
      console.log('Session started! ID:', sessionId)
      
    } catch (error: any) {
      console.error('Connection error:', error)
      console.error('Error stack:', error?.stack)
      if (isMountedRef.current) {
        setIsConnecting(false)
        setErrorMessage(`Connection failed: ${error.message || 'Unknown error'}. Please check your network connection and try again.`)
      }
    }
  }, [conversation, isConnecting])

  // Disconnect from ElevenLabs
  const disconnectConversation = useCallback(async () => {
    if (conversation.status === 'connected') {
      try {
        await conversation.endSession()
      } catch (error) {
        // Ignore disconnect errors
      }
    }
    if (isMountedRef.current) {
      setShowPaymentSummary(false)
      setPaymentSummaryData([])
    }
  }, [conversation])

  // Handle start listening
  const handleStartListening = useCallback(async () => {
    if (conversation.status !== 'connected' && !isConnecting) {
      // Send webhook
      fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'conversation_started',
          conversationId: slug,
          timestamp: new Date().toISOString(),
          status: 'connecting'
        }),
      }).catch(console.error)
      
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
        const errorData = await response.json().catch(() => ({ error: 'Failed to connect to webhook service' }))
        const errorMsg = errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`
        console.error('Webhook API Error:', errorMsg)
        // Don't set error message for webhook failures as they're not critical
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
      console.error('N8N webhook error:', error)
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
      console.error('Error extracting loan data:', error)
      return null
    }
  }

  // Mount effect
  useEffect(() => {
    isMountedRef.current = true
    setIsMounted(true)
    
    return () => {
      isMountedRef.current = false
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
