'use client'

import { useTypingEffect } from '@/components/useTypingEffect'
import { convertSpelledNumbersToDigits } from '@/utils/numberConverter'
import PaymentSummaryResponsive from '@/components/PaymentSummaryResponsive'
import ChatInterface from '@/components/ChatInterface'
import { useEffect, useState, useRef } from 'react'

type AIState = 'idle' | 'listening' | 'speaking'

interface Props {
  onStartListening?: () => void
  onStopListening?: () => void
  isAudioPlaying?: boolean
  currentText: string
  setCurrentText: (text: string) => void
  showPaymentSummary?: boolean
  paymentSummaryData?: any[] // Changed to array for multiple loans
  showChatInterface?: boolean
  setShowChatInterface?: (show: boolean) => void
  conversationHistory?: any[] // Add conversation history prop
  errorMessage?: string | null
  onDismissError?: () => void
}

export default function AiTalkingAnimation({ onStartListening, onStopListening, isAudioPlaying, currentText, setCurrentText, showPaymentSummary, paymentSummaryData, showChatInterface, setShowChatInterface, conversationHistory, errorMessage, onDismissError }: Props) {
  const [aiState, setAiState] = useState<AIState>('idle')
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomePhase, setWelcomePhase] = useState<'initial' | 'welcome' | 'hidden'>('initial')
  
  // Convert spelled-out numbers to digits in the currentText
  const processedText = convertSpelledNumbersToDigits(currentText)
  
  const animatedCurrentText = useTypingEffect(processedText && processedText.trim().length > 0 ? processedText : '', 20)

  const handleCircleClick = () => {
    if (aiState === 'listening' || aiState === 'speaking') {
      onStopListening?.()
    } else if (!isAudioPlaying) {
      onStartListening?.()
    }
  }

  useEffect(() => {
    if (isAudioPlaying) setAiState('speaking')
    else if (aiState === 'speaking' && currentText) setAiState('listening')
    else if (currentText && currentText.trim() !== '') {
      // If there's current text, stay in listening state instead of going to idle
      setAiState('listening')
    } else if (!currentText || currentText.trim() === '') {
      // Only go to idle if there's truly no text and no conversation happening
      setAiState('idle')
    }
  }, [isAudioPlaying, currentText])

  // Handle welcome message flow: initial -> welcome (after 2s) -> hidden (after Eva starts talking)
  useEffect(() => {
    if (welcomePhase === 'initial') {
      // After 2 seconds, show welcome message
      const timer = setTimeout(() => {
        setWelcomePhase('welcome')
        setShowWelcome(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [welcomePhase])

  // Handle hiding welcome message after Eva starts talking
  useEffect(() => {
    if (aiState === 'speaking' || (aiState === 'listening' && currentText && currentText.trim() !== '')) {
      // Eva has started talking, hide welcome message and change position
      const timer = setTimeout(() => {
        setShowWelcome(false)
        setWelcomePhase('hidden')
      }, 2000)
      
      return () => clearTimeout(timer)
    } else if (aiState === 'idle' && (!currentText || currentText.trim() === '')) {
      // Eva is idle and no conversation, reset to initial phase
      setWelcomePhase('initial')
      setShowWelcome(false)
    }
  }, [aiState, currentText])

  // Clear PaymentSummaryResponsive component when currentText changes (new conversation)
  useEffect(() => {
    if (currentText && currentText.trim() !== '' && currentText !== 'PAYMENT_SUMMARY_COMPONENT') {
      // Force clear the component when new conversation text arrives
      if (showPaymentSummary) {
        // This will trigger a re-render and hide the component
      }
    }
  }, [currentText, showPaymentSummary])

  // Auto-scroll transcript to bottom when new messages arrive
  const transcriptRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [conversationHistory])

  // Add effect to handle auto-stop after "Have a wonderful day!"
  useEffect(() => {
    if (processedText.toLowerCase().includes('have a wonderful day!')) {
      // Wait for 5 second after the message is complete
      const timer = setTimeout(() => {
        if (aiState === 'speaking' || aiState === 'listening') {
          // First stop
          onStopListening?.()
          setAiState('idle')
          
          // Second stop after a small delay
          setTimeout(() => {
            onStopListening?.()
            setAiState('idle')
          }, 200)
        }
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [processedText, onStopListening, aiState])

  // Add effect to handle auto-stop after "Thank you for chatting! Take care!"
  useEffect(() => {
    if (processedText.toLowerCase().includes('thank you for chatting! take care!')) {
      // Wait for 5 seconds after the message is complete
      const timer = setTimeout(() => {
        if (aiState === 'speaking' || aiState === 'listening') {
          // First stop
          onStopListening?.()
          setAiState('idle')
          
          // Second stop after a small delay
          setTimeout(() => {
            onStopListening?.()
            setAiState('idle')
          }, 200)
        }
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [processedText, onStopListening, aiState])

  useEffect(() => {
    const timer = setTimeout(() => {
      onStartListening?.()
      setAiState('listening')
    }, 1000)

    return () => clearTimeout(timer)
  }, [])


  return (
    <div className="relative flex flex-col items-center justify-between shadow-xl h-[100vh] overflow-hidden" style={{ minHeight: '100vh' }}>
      <div className='cont' style={{ display: 'flex', flexDirection: 'column', justifyContent: showChatInterface ? 'center' : (aiState === 'idle' ? 'space-between' : 'flex-end'), height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
        {/* Background Image */}
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: 'url("/bg.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: -1
          }}
        />
        <div className="absolute top-5 z-10" style={{ right: '1.225rem' }}>
          <img src="/close.svg" alt="Close" className="h-8" />
        </div>
        {/* Error Message Display */}
        {errorMessage && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-11/12">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-800 font-medium">Connection Error</p>
                  <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={onDismissError}
                    className="inline-flex text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Top Section */}
        <div 
          className={`${!showChatInterface ? 'focus-main-box' : ''} flex flex-col items-center w-full z-10 conversation-scrollbar`}
          style={{
            height: '100%',
            padding: '3.2rem 0 1rem 0',
            flexDirection: 'column',
            justifyContent: conversationHistory && conversationHistory.length > 0 ? 'flex-end' : 'center',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {/* Chat Interface - Show when triggered */}
          {showChatInterface && (
            <div 
              className="w-full flex items-center justify-center"
              style={{ zIndex: 10, minHeight: '500px', flex: 1 }}
            >
              <div className="origin-center popup-full">
                <ChatInterface onClose={() => setShowChatInterface?.(false)} conversationHistory={conversationHistory} paymentSummaryData={paymentSummaryData} />
              </div>
            </div>
          )}

          {/* Show welcome message and logo based on phase */}
          {!showChatInterface && welcomePhase === 'welcome' && showWelcome && (
            <>
              <div className="flex flex-col items-center w-4/5 mx-auto text-center">
                <span className="text-base font-medium" style={{color: '#1659BD'}}>Welcome to HDFC Bank!</span>
                <span className="text-[52px] font-extrabold leading-none" style={{color: '#1659BD'}}>
                  <span>I'm EVA</span>
                </span>
                <span className="text-xl font-medium" style={{color: '#1659BD'}}>Your all new AI Assistant</span>
              </div>
              <div className="relative flex items-center justify-center mb-0 md:mb-[30px]">
                <div
                  className="rounded-full p-2"
                  onClick={handleCircleClick}
                  style={{ width: 300, height: 250 }}
                >
                  <img
                    src="/hdfc-logo.png"
                    alt="HDFC Bank Logo"
                    style={{ width: 500, height: 300, marginTop: '-25px' }}
                    className="rounded-full object-cover"
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Live Transcription Panel - direct child of scrollable area */}
          {!showChatInterface && conversationHistory && conversationHistory.length > 0 && (
            <div 
              ref={transcriptRef}
              className="w-full mb-3"
              style={{
                maxHeight: '40vh',
                overflowY: 'auto',
                padding: '8px 16px',
                flex: '0 0 auto',
              }}
            >
              {conversationHistory
                .sort((a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
                .slice(-10)
                .map((msg: any, idx: number) => {
                  const isUser = msg.source === 'user'
                  const text = msg.content_transcript || msg.text || ''
                  if (!text || text === 'PAYMENT_SUMMARY_COMPONENT') return null
                  return (
                    <div
                      key={msg.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: isUser ? 'flex-end' : 'flex-start',
                        marginBottom: '6px',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '85%',
                          padding: '8px 12px',
                          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          backgroundColor: isUser ? 'rgba(22, 89, 189, 0.15)' : 'rgba(255,255,255,0.65)',
                          backdropFilter: 'blur(4px)',
                          textAlign: 'left',
                          fontSize: '12px',
                          lineHeight: '17px',
                          color: '#1659BD',
                          fontWeight: isUser ? 400 : 500,
                          wordBreak: 'break-word' as const,
                        }}
                      >
                        <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.6, display: 'block', marginBottom: '2px' }}>
                          {isUser ? 'You' : 'Eva'}
                        </span>
                        {text}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          {/* Animated Eva's voice text - positioned based on phase */}
          {!showChatInterface && (
            <div className={`flex flex-col items-center w-4/5 mx-auto text-center ${welcomePhase === 'hidden' && aiState !== 'idle' ? 'justify-center' : ''}`} style={welcomePhase === 'hidden' && aiState !== 'idle' ? { position: 'relative', width: '90%', top: '0', padding: '10px 0' } : {}}>

            {/* Show PaymentSummaryResponsive components if available */}
            {showPaymentSummary && paymentSummaryData && paymentSummaryData.length > 0 && (
              <div className="w-full mb-4 space-y-4">
                {paymentSummaryData.map((loanData, index) => (
                  <div key={index} className="w-full">
                    <PaymentSummaryResponsive {...loanData} />
                  </div>
                ))}
              </div>
            )}
            
            {/* Check if content contains HTML (styled header) */}
            {animatedCurrentText.includes('<div style=') ? (
              <div dangerouslySetInnerHTML={{ __html: animatedCurrentText }} />
            ) : (
              animatedCurrentText.split(/(?<=[.?!])\s+/).map((sentence, idx) => {
                const trimmedSentence = sentence.trim();
                const lowerSentence = trimmedSentence.toLowerCase();
                
                // Check for specific phrases
                const isQuestion = trimmedSentence.endsWith('?');
                const isPrompt = lowerSentence.includes('please enter') || lowerSentence.includes('kindly provide');
                const startsWithPleaseTellMe = lowerSentence.startsWith('please tell me');
                const startsWithPleaseSayYour = lowerSentence.startsWith('please say your');
                const startsWithPleaseConfirm = lowerSentence.startsWith('please confirm');
                const isHaveWonderfulDay = lowerSentence === 'have a wonderful day!';

                // Combine all conditions
                const shouldBeBold = isQuestion || isPrompt || startsWithPleaseTellMe || 
                                   startsWithPleaseSayYour || startsWithPleaseConfirm || 
                                   isHaveWonderfulDay;

                return shouldBeBold ? (
                  <span key={idx} className="block text-2xl font-bold" style={{color: '#1659BD'}}>{trimmedSentence}</span>
                ) : (
                  <span key={idx} className="block text-base font-normal" style={{color: '#1659BD'}}>{trimmedSentence}</span>
                );
              })
            )}
          </div>
          )}
        </div>
        {/* Bottom Listening Box */}
        {/* Gradient border wrapper */}
        <div 
          className="w-full pb-2 pt-2"
          style={{
            borderRadius: '40px 40px 0 0',
            background: 'linear-gradient(90deg,rgba(255, 255, 255, 1) 0%, rgba(160, 87, 232, 1) 24%, rgba(78, 105, 217, 1) 50%, rgba(160, 87, 232, 1) 81%, rgba(255, 255, 255, 1) 100%)',
            padding: '2px'
          }}
        >
          {/* White content box */}
          <div
            style={{
              borderRadius: '38px 38px 0 0',
              background: 'var(--Shades-White-Level0, #FFF)',
              width: '100%',
              height: '100%'
            }}
          >
          <div className="bg-white flex flex-col items-center justify-center w-full min-h-[180px] h-[180px] p-2" style={{ borderRadius: '43px' }}>
            <div className="flex items-center gap-2 mb-1">
              {aiState === 'listening' && <span className="text-[#5B7FFF] font-semibold text-lg">Listening...</span>}
      </div>
            {/* Start and End Buttons moved inside white box */}
            <div className="flex flex-col justify-center mt-auto w-full">
              <div className="flex-1 flex justify-center">
                <img
                  src={
                    aiState === 'listening'
                      ? '/blob-listening.gif'
                      : aiState === 'speaking'
                      ? '/blob-answering.gif'
                      : '/blob-static.gif'
                  }
                  alt="Start"
                  width={100}
                  height={100}
                  className={`cursor-pointer ${aiState === 'listening' || aiState === 'speaking' ? 'pointer-events-none' : ''}`}
                  onClick={async () => {
                    if (!isAudioPlaying) {
                      // Trigger webhook to n8n
                      try {
                        await fetch('/api/webhook', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            buttonClicked: 'start',
                            aiState: aiState,
                            timestamp: new Date().toISOString()
                          }),
                        })
                      } catch (error) {
                        console.error('Failed to send webhook:', error)
                      }
                      
                      // Start listening
                      onStartListening?.()
                      setAiState('listening')
                    }
                  }}
                />
              </div>
              <div className="flex-1 flex justify-between items-center px-[10px] pb-[15px]">
                <img
                  src="/chathistory.png"
                  alt="Chat History"
                  width={30}
                  height={30}
                  className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                  onClick={() => {
                    if (setShowChatInterface) {
                      setShowChatInterface(true)
                    }
                    // Stop Eva session automatically
                    if (onStopListening) {
                      onStopListening()
                    }
                    setAiState('idle')
                    setCurrentText('')
                  }}
                />
                <img
                  src="/end-call.svg"
                  alt="End"
                  width={30}
                  height={30}
                  className={`cursor-pointer ${aiState === 'idle' ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => {
                    if (aiState === 'listening' || aiState === 'speaking') {
                      onStopListening?.()
                      setAiState('idle')
                      setCurrentText('')
                    }
                  }}
                />
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .cont {
          width: 100vw;
        }
        @media (min-width: 768px) {
          .cont {
            width: 440px;
          }
          video[src="/eva-bg.mp4"] {
            border-radius: 55px;
          }
        }
      `}</style>
    </div>
  )
}
