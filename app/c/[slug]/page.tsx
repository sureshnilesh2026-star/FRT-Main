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
    console.log('📦 FRT Variables:', { name, status, confidence })
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
  const [fetchedConversationData, setFetchedConversationData] = useState<any[]>([])
  
  // Use ref to track if component is mounted (for cleanup)
  const isMountedRef = useRef(true)

  const loadConversation = useCallback(() => {
    console.log('🔄 Loading conversation with slug:', slug)
    fetch(`/api/c?id=${slug}`)
      .then((res) => res.json())
      .then((res) => {
        console.log('✅ Fetched conversation data:', res)
        console.log('📊 Data details:', {
          recordCount: res.length,
          slug: slug,
          apiEndpoint: `/api/c?id=${slug}`,
          records: res
        })
        if (isMountedRef.current) {
          setFetchedConversationData(res)
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
      .catch(console.error)
  }, [slug])

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onError: (error: string) => { 
      console.error('ElevenLabs Error:', error)
      console.error('Error details:', JSON.stringify(error))
      console.error('Current connection status:', conversation.status)
      
      // Check if it's a WebSocket state error
      if (typeof error === 'string' && error.includes('CLOSING') || error.includes('CLOSED')) {
        console.warn('⚠️ WebSocket state error detected - connection may be closing')
        // Don't set error message for WebSocket state errors as they might be transient
      } else {
        if (isMountedRef.current) {
          setIsConnecting(false)
          setErrorMessage(`Connection error: ${error}`)
        }
      }
    },
    onConnect: () => { 
      console.log('ElevenLabs Connected! Status will change to connected.')
      console.log('Connection status:', conversation.status)
      if (isMountedRef.current) {
        // Small delay to ensure WebSocket is fully ready
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsConnecting(false)
            console.log('✅ Connection ready, isConnecting set to false')
          }
        }, 200)
      }
    },
    onDisconnect: () => {
      console.log('ElevenLabs Disconnected')
      console.log('Disconnect - Current status:', conversation.status)
      if (isMountedRef.current) {
        setIsConnecting(false)
        // Only show error if disconnection was unexpected (not user-initiated)
        if (conversation.status !== 'disconnected' && conversation.status !== 'idle') {
          console.warn('⚠️ Unexpected disconnection detected')
        }
      }
    },
    onMessage: async (props: { message: string; source: 'user' | 'ai' }) => {
      if (!isMountedRef.current) return
      
      // Check connection status before processing message
      if (conversation.status !== 'connected') {
        console.warn('⚠️ Received message but connection status is:', conversation.status)
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
      }).catch(console.error)
    },
  })

  // Connect to ElevenLabs
  const connectConversation = useCallback(async () => {
    if (!isMountedRef.current) {
      console.log('⚠️ Component not mounted, skipping connection')
      return
    }
    if (isConnecting) {
      console.log('⚠️ Connection already in progress, skipping')
      return
    }
    if (conversation.status === 'connected') {
      console.log('⚠️ Already connected, skipping')
      return
    }
    
    // If there's an existing session, clean it up first
    if (conversation.status !== 'idle' && conversation.status !== 'disconnected') {
      console.log('🧹 Cleaning up existing session before reconnecting...')
      try {
        await conversation.endSession()
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (err) {
        console.log('Cleanup error (ignored):', err)
      }
    }
    
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
      
      // Read FRT variables from localStorage for ElevenLabs conversation
      const elName = localStorage.getItem('name') || ''
      const elStatus = localStorage.getItem('status') || ''
      const elConfidence = localStorage.getItem('confidence') || ''
      
      // Ensure variables are ready before starting conversation
      if (!elName || !elStatus || !elConfidence) {
        console.warn('⚠️ FRT variables not ready yet. Waiting...')
        console.warn('📦 Current values:', { name: elName, status: elStatus, confidence: elConfidence })
        if (isMountedRef.current) {
          setIsConnecting(false)
          setErrorMessage('Face recognition variables not received. Please go back and capture your photo first.')
        }
        return
      }
      
      console.log('✅ FRT Variables ready:')
      console.log('   📛 Name:', elName)
      console.log('   📊 Status:', elStatus)
      console.log('   🎯 Confidence:', elConfidence)
      console.log('🚀 Starting ElevenLabs conversation with variables...')
      
      // Start session with signed URL and FRT variables
      const sessionId = await conversation.startSession({ 
        signedUrl: data.apiKey,
        dynamicVariables: {
          name: elName,
          status: elStatus,
          confidence: elConfidence
        }
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
    console.log('🔌 Disconnecting... Current status:', conversation.status)
    if (conversation.status === 'connected' || conversation.status === 'connecting') {
      try {
        await conversation.endSession()
        console.log('✅ Disconnected successfully')
      } catch (error: any) {
        // Log but ignore disconnect errors (WebSocket might already be closed)
        console.log('Disconnect error (ignored):', error?.message || error)
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
      console.log('🚀 [START ORDER] Step 1: Sending n8n webhook (conversation_started event)...')
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
      })
      .then(() => {
        console.log('✅ [START ORDER] Step 2: n8n webhook sent successfully')
      })
      .catch((err) => {
        console.error('❌ [START ORDER] Step 2: n8n webhook failed:', err)
      })
      
      console.log('🔌 [START ORDER] Step 3: Now connecting to ElevenLabs...')
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
    console.log('💬 [MESSAGE ORDER] Step 1: Received message from ElevenLabs')
    console.log('💬 [MESSAGE ORDER] Step 2: Sending message to n8n for processing...')
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
      console.log('✅ [MESSAGE ORDER] Step 3: Received response from n8n')

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

  // Mount effect - load conversation data
  useEffect(() => {
    console.log('📋 [LOAD ORDER] Step 1: Loading conversation history from database...')
    loadConversation()
    console.log('📋 [LOAD ORDER] Step 2: ElevenLabs hook initialized (but NOT connected yet)')
    console.log('📋 [LOAD ORDER] Step 3: Waiting for user to click start button...')
    console.log('📋 [LOAD ORDER] Note: n8n webhook will be called FIRST when user clicks start, THEN ElevenLabs connects')
  }, [loadConversation])
  
  // Mount/unmount effect - setup and cleanup
  useEffect(() => {
    isMountedRef.current = true
    setIsMounted(true)
    
    return () => {
      isMountedRef.current = false
      // Cleanup: disconnect on unmount
      console.log('🧹 Component unmounting, cleaning up...')
      if (conversation.status === 'connected') {
        console.log('🧹 Disconnecting on unmount')
        conversation.endSession().catch((err: any) => {
          console.log('Cleanup disconnect error (ignored):', err)
        })
      }
    }
  }, [])

  // Prevent hydration mismatch
  if (!isMounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <>
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
    </>
  )
}
