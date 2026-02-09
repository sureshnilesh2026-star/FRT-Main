'use client'

import React from 'react'
import PaymentSummaryResponsive from './PaymentSummaryResponsive'

// Image assets from Figma
const imgImg13611 = "http://localhost:3845/assets/b6fd7fd98ad394aad6e1914bff674799549654c3.png";
const img64E9502E4159Bed6F8F57B071Db5Ac7E2 = "http://localhost:3845/assets/d4ba5198c332e046d67a71ce0bb7046e9b6302fd.png";
const imgGradientCircles = "/bg.jpg";
const img = "/close.svg";
const img1 = "/chathistory.png";

interface UserChatBoxProps {
  userChatText?: string;
}

function UserChatBox({ userChatText = "Hi, I want to know my outstanding loan balance, and, how, I, can, do: a, part, prepayment, for: my, Home, Loan, Please, help, " }: UserChatBoxProps) {
  return (
    <div className="content-stretch flex items-center justify-start overflow-clip relative rounded-bl-[16px] rounded-tl-[16px] rounded-tr-[16px] size-full" data-name="User Chat Box" data-node-id="32:1919">
      <div className="basis-0 flex flex-row grow items-center self-stretch shrink-0">
        <div className="basis-0 grow h-full min-h-px min-w-px rounded-bl-[16px] rounded-tl-[16px] rounded-tr-[16px] shrink-0" data-name="Empty" data-node-id="32:1920"/>
      </div>
      <div className="bg-[rgba(28,63,202,0.1)] box-border content-stretch flex gap-2 items-center justify-end px-4 py-3 relative rounded-bl-[16px] rounded-tl-[16px] rounded-tr-[16px] shrink-0" data-name="User Chat" data-node-id="32:1921">
        <div className="css-gvyd60 font-['Inter:Regular',_sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[12px] text-right text-white" data-node-id="32:1922">
          <p className="mb-2">{userChatText}</p>
          <p className="">and how I can do a part prepayment for my Home Loan. Please help.</p>
        </div>
      </div>
    </div>
  );
}

interface Component7Props {
  property1?: 'IMG_1340' | 'IMG_1341' | 'Variant3';
}

function Component7({ property1 = "IMG_1341" }: Component7Props) {
  if (property1 === 'Variant3') {
    return (
      <div className="relative size-full" data-name="Property 1=Variant3" data-node-id="32:2126">
        <div className="absolute bg-[0%_99.92%] bg-no-repeat bg-size-[100%_1628.77%] bottom-0 h-12 left-1/2 translate-x-[-50%] w-[361.263px]" data-name="IMG_1361 1" data-node-id="32:2127" style={{ backgroundImage: `url('${imgImg13611}')` }}/>
      </div>
    );
  }
  return null;
}

// Function to parse Products JSON structure from N8N response
const parseProductsJSON = (messageContent: string) => {
  try {
    // Look for JSON structure in the message content
    const jsonMatch = messageContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;

    const jsonData = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(jsonData) || jsonData.length === 0) return null;

    const transcript = jsonData[0]?.Transcript;
    if (!Array.isArray(transcript)) return null;

    // Find Products section
    const productsSection = transcript.find(item => item.Products);
    if (!productsSection?.Products) return null;

    const products = productsSection.Products;
    const headerLine = products['Header Line'];
    
    // Process each product
    const loanDataArray: any[] = [];
    const productKeys = Object.keys(products).filter(key => key !== 'Header Line');
    
    productKeys.forEach((productKey, index) => {
      const product = products[productKey];
      if (!product || !product.Datasets) return;

      const productName = product['Product Name'] || 'Loan';
      const datasets = product.Datasets;

      // Extract data from datasets
      const data = {
        amount: '',
        interestRate: '',
        emi: '',
        balanceTenure: '',
        outstandingPrincipal: '',
        principal: '',
        startDate: '',
        accountNumber: '*****6789'
      };

      datasets.forEach((dataset: any) => {
        const datasetKey = Object.keys(dataset)[0];
        const datasetData = dataset[datasetKey];
        if (!datasetData) return;

        const label = datasetData.Label?.toLowerCase() || '';
        const value = datasetData.Value || '';

        if (label.includes('amount')) {
          data.amount = value;
        } else if (label.includes('interest rate')) {
          data.interestRate = value;
        } else if (label.includes('emi')) {
          data.emi = value;
        } else if (label.includes('balance tenure') || label.includes('tenure')) {
          data.balanceTenure = value;
        } else if (label.includes('outstanding')) {
          data.outstandingPrincipal = value;
        } else if (label.includes('principal')) {
          data.principal = value;
        } else if (label.includes('start date') || label.includes('date')) {
          data.startDate = value;
        }
      });

      // Create loan data object
      const loanData = {
        mainHeaderText: "",
        mainHeaderSubText: "",
        header2Text: index === 0 ? headerLine : "",
        showMainHeader: false,
        showHeader2: index === 0,
        loanType: productName,
        accountNumber: data.accountNumber,
        amount: data.amount,
        startDate: data.startDate,
        interestRate: data.interestRate,
        balanceTenure: data.balanceTenure,
        emi: data.emi,
        outstandingPrincipal: data.outstandingPrincipal,
        principal: data.principal,
        holdBalance: "",
        holdBalanceText: "",
        documentTitle: "",
        documentSize: "",
        confirmationText: ""
      };

      loanDataArray.push(loanData);
    });

    return loanDataArray.length > 0 ? loanDataArray : null;
  } catch (error) {
    console.error('Error parsing Products JSON:', error);
    return null;
  }
};

// Function to detect and extract payment summary data from message content
const extractPaymentSummaryData = (messageContent: string) => {
  // Check if the message contains payment summary indicators
  const isPaymentSummary = messageContent.includes('Payment Summary') || 
                          messageContent.includes('payment summary') ||
                          messageContent.includes('Home Loan') ||
                          messageContent.includes('loan details') ||
                          messageContent.includes('PAYMENT_SUMMARY_COMPONENT') ||
                          messageContent.includes('loan balance') ||
                          messageContent.includes('outstanding') ||
                          messageContent.includes('EMI') ||
                          messageContent.includes('prepayment') ||
                          messageContent.includes('loan information') ||
                          messageContent.includes('account details') ||
                          messageContent.includes('loan summary')
  
  if (!isPaymentSummary) return null
  
  // Enhanced extraction function with better patterns
  const extractValue = (pattern: RegExp, defaultValue: string = '') => {
    const match = messageContent.match(pattern)
    return match ? (match[1] || match[0]).trim() : defaultValue
  }
  
  // Extract loan type with more comprehensive patterns
  const loanType = extractValue(/(?:Home Loan|Personal Loan|Car Loan|Business Loan|Auto Loan|Education Loan|Gold Loan)/i, '')
  
  // Extract account number with various patterns
  const accountNumber = extractValue(/(\*{4,}\d{4}|\d{4}\*{4}|\*{3,}\d{3,})/, '')
  
  // Extract amount with currency symbols and various formats
  const amount = extractValue(/₹[\d,]+\.?\d*|Rs\.?\s*[\d,]+\.?\d*|INR\s*[\d,]+\.?\d*/i, '')
  
  // Extract EMI with better patterns
  const emi = extractValue(/EMI[:\s]*₹[\d,]+\.?\d*|Monthly[:\s]*₹[\d,]+\.?\d*|Installment[:\s]*₹[\d,]+\.?\d*/i, '')
  
  // Extract interest rate with various formats
  const interestRate = extractValue(/(\d+\.?\d*%)\s*(?:Floating|Fixed|p\.a\.|per annum)?/i, '')
  
  // Extract tenure with months/years
  const balanceTenure = extractValue(/(\d+)\s*(?:Months|months|Years|years|Yrs|yrs)/i, '')
  
  // Extract outstanding principal
  const outstandingPrincipal = extractValue(/Outstanding[:\s]*₹[\d,]+\.?\d*|Balance[:\s]*₹[\d,]+\.?\d*/i, '')
  
  // Extract principal
  const principal = extractValue(/Principal[:\s]*₹[\d,]+\.?\d*|Loan[:\s]*Amount[:\s]*₹[\d,]+\.?\d*/i, '')
  
  // Extract hold balance
  const holdBalance = extractValue(/Hold[:\s]*₹[\d,]+\.?\d*|Blocked[:\s]*₹[\d,]+\.?\d*/i, '')
  
  // Extract start date with various formats
  const startDate = extractValue(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}|\d{4}-\d{1,2}-\d{1,2})/i, '')
  
  // Extract document title
  const documentTitle = extractValue(/Revised\s+.*?Schedule|Amortization\s+.*?Schedule|Payment\s+.*?Schedule/i, '')
  
  // Extract document size
  const documentSize = extractValue(/(\d+\.?\d*\s*MB|\d+\.?\d*\s*KB)/i, '')
  
  // Extract confirmation text
  const confirmationText = extractValue(/We've mailed.*?ID|Confirmation.*?mailed|Email.*?sent/i, '')
  
  // Extract hold balance text
  const holdBalanceText = extractValue(/This amount is on hold.*?use|Amount.*?hold.*?available/i, '')
  
  // Create custom data fields from extracted values
  const customDataFields = []
  
  // Add prepayment amount if found
  if (messageContent.includes('Prepayment') || messageContent.includes('prepayment')) {
    const prepaymentAmount = extractValue(/Prepayment[:\s]*₹[\d,]+\.?\d*/i, '')
    if (prepaymentAmount) {
      customDataFields.push({ label: 'Prepayment', value: prepaymentAmount })
    }
  }
  
  // Add processing fee if found
  if (messageContent.includes('Processing Fee') || messageContent.includes('processing fee')) {
    const processingFee = extractValue(/Processing Fee[:\s]*₹[\d,]+\.?\d*/i, '')
    if (processingFee) {
      customDataFields.push({ label: 'Processing Fee', value: processingFee })
    }
  }
  
  // Add late fee if found
  if (messageContent.includes('Late Fee') || messageContent.includes('late fee')) {
    const lateFee = extractValue(/Late Fee[:\s]*₹[\d,]+\.?\d*/i, '')
    if (lateFee) {
      customDataFields.push({ label: 'Late Fee', value: lateFee })
    }
  }
  
  // Add penalty if found
  if (messageContent.includes('Penalty') || messageContent.includes('penalty')) {
    const penalty = extractValue(/Penalty[:\s]*₹[\d,]+\.?\d*/i, '')
    if (penalty) {
      customDataFields.push({ label: 'Penalty', value: penalty })
    }
  }
  
  // Extract data from the message content - use empty strings for missing data
  const data = {
    mainHeaderText: "Payment Received!",
    mainHeaderSubText: loanType ? `We have received the part-prepayment for ${loanType}` : "We have received your payment",
    header2Text: "Here is your payment summary",
    loanType: loanType || '',
    accountNumber: accountNumber || '',
    amount: amount || '',
    startDate: startDate || '',
    interestRate: interestRate || '',
    balanceTenure: balanceTenure || '',
    emi: emi || '',
    outstandingPrincipal: outstandingPrincipal || '',
    principal: principal || '',
    holdBalance: holdBalance || '',
    holdBalanceText: holdBalanceText || '',
    documentTitle: documentTitle || '',
    documentSize: documentSize || '',
    confirmationText: confirmationText || '',
    customDataFields: customDataFields
  }
  
  return data
}

export default function ChatInterface({ onClose, conversationHistory, paymentSummaryData }: { onClose?: () => void, conversationHistory?: any[], paymentSummaryData?: any[] }) {
  return (
    <div className="chat-interface-container overflow-clip relative rounded-[40px] w-full h-screen" data-name="Intro - Frame 392" data-node-id="32:2688">
      <div className="absolute flex h-full items-center justify-center left-0 top-0 w-full">
        <div className="flex-none scale-y-[-100%]">
          <div className="h-screen overflow-clip relative w-screen" data-name="BG" data-node-id="32:2689">
            <div className="absolute flex h-[1810px] items-center justify-center mix-blend-multiply top-[-501px] translate-x-[-50%] w-[1357.5px]" style={{ left: "calc(50% - 36.5px)" }}>
              <div className="flex-none rotate-[90deg] scale-y-[-100%]">
                <div className="bg-center bg-cover bg-no-repeat blur-[50px] filter h-[1357.5px] opacity-50 w-[1810px]" data-name="64e9502e4159bed6f8f57b071db5ac7e 2" data-node-id="32:2690" style={{ backgroundImage: `url('${img64E9502E4159Bed6F8F57B071Db5Ac7E2}')` }}/>
              </div>
            </div>
            <div className="absolute h-[1001.5px] left-[-260px] top-[-80px] w-[836.581px]" data-name="Gradient circles" data-node-id="32:2691">
              <div className="absolute inset-[-29.96%_-35.86%]">
                {/* <img alt="" className="block max-w-none size-full" src={imgGradientCircles}/> */}
              </div>
            </div>
            <div className="absolute flex h-full items-center justify-center left-0 top-0 w-full hidden">
              <div className="flex-none scale-y-[-100%]">
                <div className="bg-gradient-to-t from-[#f0f4fd] from-[24.104%] h-[423px] to-[#f0f4fd00] w-[360px]" data-node-id="32:2696"/>
              </div>
            </div>
          </div>
        </div>
      </div>
      
        <div className="absolute content-stretch flex flex-col h-full items-start justify-start left-0 top-0 w-full" data-name="Content" data-node-id="32:2697">
        <div className="basis-0 box-border content-stretch flex flex-col gap-4 grow items-start justify-start min-h-px min-w-px px-5 py-6 relative shrink-0 w-full overflow-y-auto conversation-scrollbar" data-name="Chatiiing" data-node-id="32:2698" style={{ marginBottom: '44px', paddingTop: '7.5rem' }}>
          
          {conversationHistory && conversationHistory.length > 0 ? (
            conversationHistory
              .sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()) // Sort by timestamp
              .map((message, index) => {
                return (
                  <div key={`${message.id || index}-${message.timestamp || index}`} className="w-full">
                {message.source === 'user' ? (
                  <div className="content-stretch flex items-center justify-start overflow-clip relative rounded-bl-[16px] rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-full" data-name="User Chat Box">
                    <div className="basis-0 flex flex-row grow items-center self-stretch shrink-0">
                      <div className="basis-0 grow h-full min-h-px min-w-px rounded-bl-[16px] rounded-tl-[16px] rounded-tr-[16px] shrink-0" data-name="Empty"/>
                    </div>
                    <div className="bg-blue-600 box-border content-stretch flex gap-2 items-center justify-end px-4 py-3 relative rounded-bl-[16px] rounded-tl-[16px] rounded-tr-[16px] shrink-0" data-name="User Chat">
                      <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[12px] text-right text-white">
                        <p className="text-white">{message.content_transcript || message.text || 'User message'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0">
                    {/* Check if this message contains payment summary data */}
                    {(() => {
                      const messageContent = message.content_transcript || message.text || ''
                      
                      // First, check if we have structured paymentSummaryData for full loan details
                      // Show PaymentSummaryResponsive if we have data and this is an Eva message with loan-related content
                      const hasLoanContent = messageContent.toLowerCase().includes('loan') || 
                                           messageContent.toLowerCase().includes('rupees') || 
                                           messageContent.toLowerCase().includes('rate') || 
                                           messageContent.toLowerCase().includes('percent') ||
                                           messageContent.toLowerCase().includes('emi') ||
                                           messageContent.toLowerCase().includes('interest') ||
                                           messageContent.toLowerCase().includes('outstanding') ||
                                           messageContent.includes('PAYMENT_SUMMARY_COMPONENT') || 
                                           messageContent.includes('Payment Summary') || 
                                           messageContent.includes('payment summary') ||
                                           messageContent.includes('loan details')
                      
                      // Show PaymentSummaryResponsive if we have data and this message has loan content
                      if (paymentSummaryData && paymentSummaryData.length > 0 && hasLoanContent) {
                        return (
                          <div className="w-full">
                            {/* Eva's original message */}
                            <div className="bg-[rgba(255,255,255,0.4)] max-w-80 min-w-80 relative rounded-br-[20px] rounded-tl-[20px] rounded-tr-[20px] shrink-0 w-[528px]" data-name="Chat">
                              <div className="box-border content-stretch flex flex-col gap-3 items-start justify-center max-w-inherit min-w-inherit overflow-clip p-[16px] relative w-80">
                                <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Header Mobile">
                                  <div 
                                    className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-start leading-[0] min-w-full not-italic relative shrink-0 text-[12px] text-black"
                                    style={{ textAlign: 'left', alignItems: 'flex-start' }}
                                  >
                                    <div 
                                      className="leading-[16px] text-left"
                                      style={{ textAlign: 'left', width: '100%' }}
                                      dangerouslySetInnerHTML={{ 
                                        __html: messageContent.replace('PAYMENT_SUMMARY_COMPONENT', 'Here are your loan details:')
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-br-[20px] rounded-tl-[20px] rounded-tr-[20px]"/>
                            </div>
                            
                            {/* Full loan details using structured data */}
                            <div className="mt-4 space-y-4">
                              {paymentSummaryData.map((loanData, index) => (
                                <PaymentSummaryResponsive 
                                  key={index}
                                  {...loanData}
                                  showMainHeader={false}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      }
                      
                      // Check if message contains Products JSON structure from N8N
                      const productsData = parseProductsJSON(messageContent);
                      if (productsData && productsData.length > 0) {
                        return (
                          <div className="w-full">
                            {/* Eva's original message */}
                            <div className="bg-[rgba(255,255,255,0.4)] max-w-80 min-w-80 relative rounded-br-[20px] rounded-tl-[20px] rounded-tr-[20px] shrink-0 w-[528px]" data-name="Chat">
                              <div className="box-border content-stretch flex flex-col gap-3 items-start justify-center max-w-inherit min-w-inherit overflow-clip p-[16px] relative w-80">
                                <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Header Mobile">
                                  <div 
                                    className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-start leading-[0] min-w-full not-italic relative shrink-0 text-[12px] text-black"
                                    style={{ textAlign: 'left', alignItems: 'flex-start' }}
                                  >
                                    <div 
                                      className="leading-[16px] text-left"
                                      style={{ textAlign: 'left', width: '100%' }}
                                      dangerouslySetInnerHTML={{ 
                                        __html: 'Loan details processed from N8N data'
                                      }}
                                    />
                                  </div>
                                </div>
                                <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-br-[20px] rounded-tl-[20px] rounded-tr-[20px]"/>
                              </div>
                            </div>
                            
                            {/* Loan details using parsed Products JSON */}
                            <div className="mt-4 space-y-4">
                              {productsData.map((loanData, index) => (
                                <PaymentSummaryResponsive 
                                  key={index}
                                  {...loanData}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      }
                      
                      // DEBUG: Show PaymentSummaryResponsive if we have data regardless of message content (for testing)
                      if (paymentSummaryData && paymentSummaryData.length > 0 && !hasLoanContent) {
                        return (
                          <div className="w-full">
                            {/* Eva's original message */}
                            <div className="bg-[rgba(255,255,255,0.4)] max-w-80 min-w-80 relative rounded-br-[20px] rounded-tl-[20px] rounded-tr-[20px] shrink-0 w-[528px]" data-name="Chat">
                              <div className="box-border content-stretch flex flex-col gap-3 items-start justify-center max-w-inherit min-w-inherit overflow-clip p-[16px] relative w-80">
                                <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Header Mobile">
                                  <div 
                                    className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-start leading-[0] min-w-full not-italic relative shrink-0 text-[12px] text-black"
                                    style={{ textAlign: 'left', alignItems: 'flex-start' }}
                                  >
                                    <div 
                                      className="leading-[16px] text-left"
                                      style={{ textAlign: 'left', width: '100%' }}
                                      dangerouslySetInnerHTML={{ 
                                        __html: messageContent + '<br/><small style="color: red;">[DEBUG: PaymentSummaryData available but no loan keywords detected]</small>'
                                      }}
                                    />
                                  </div>
                                </div>
                                <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-br-[20px] rounded-tl-[20px] rounded-tr-[20px]"/>
                              </div>
                            </div>
                            
                            {/* Full loan details using structured data */}
                            <div className="mt-4 space-y-4">
                              {paymentSummaryData.map((loanData, index) => (
                                <PaymentSummaryResponsive 
                                  key={index}
                                  {...loanData}
                                  showMainHeader={false}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      }
                      
                      // Fallback to text-based extraction for other cases
                      const paymentData = extractPaymentSummaryData(messageContent)
                      
                      // Check if this is the "active loans" message
                      const isActiveLoansMessage = messageContent.includes('active loans') || 
                                                 messageContent.includes('2 active loans') ||
                                                 messageContent.includes('Please choose one to see details')
                      
                      if (paymentData) {
                        return (
                          <div className="w-full">
                            <PaymentSummaryResponsive {...paymentData} showMainHeader={false} />
                          </div>
                        )
                      }
                      
                      // If it's the active loans message, show loan details inline
                      if (isActiveLoansMessage) {
                        return (
                          <div className="w-full">
                            {/* Eva's original message */}
                            <div className="bg-[rgba(255,255,255,0.4)] max-w-80 min-w-80 relative rounded-br-[20px] rounded-tl-[20px] rounded-tr-[20px] shrink-0 w-[528px]" data-name="Chat">
                              <div className="box-border content-stretch flex flex-col gap-3 items-start justify-center max-w-inherit min-w-inherit overflow-clip p-[16px] relative w-80">
                                <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Header Mobile">
                                  <div 
                                    className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-start leading-[0] min-w-full not-italic relative shrink-0 text-[12px] text-black"
                                    style={{ textAlign: 'left', alignItems: 'flex-start' }}
                                  >
                                    <div 
                                      className="leading-[16px] text-left"
                                      style={{ textAlign: 'left', width: '100%' }}
                                      dangerouslySetInnerHTML={{ 
                                        __html: messageContent
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-br-[20px] rounded-tl-[20px] rounded-tr-[20px]"/>
                            </div>
                            
                            {/* Loan details inline */}
                            <div className="mt-4 space-y-4">
                              {/* First Loan */}
                              <PaymentSummaryResponsive 
                                mainHeaderText=""
                                mainHeaderSubText=""
                                header2Text=""
                                showMainHeader={false}
                                showHeader2={false}
                                loanType="Home Loan"
                                accountNumber="*****6789"
                                amount="₹1,84,20,000"
                                emi="₹1,73,468"
                                interestRate="8.5% (Floating)"
                                balanceTenure="204 Months"
                                outstandingPrincipal="₹1,84,20,000"
                                principal="₹1,85,00,000"
                                holdBalance=""
                                startDate="01/05/2022"
                                documentTitle=""
                                documentSize=""
                                confirmationText=""
                                holdBalanceText=""
                              />
                              
                              {/* Second Loan */}
                              <PaymentSummaryResponsive 
                                mainHeaderText=""
                                mainHeaderSubText=""
                                header2Text=""
                                showMainHeader={false}
                                showHeader2={false}
                                loanType="Personal Loan"
                                accountNumber="*****4321"
                                amount="₹2,50,000"
                                emi="₹25,000"
                                interestRate="12.5% (Fixed)"
                                balanceTenure="36 Months"
                                outstandingPrincipal="₹2,00,000"
                                principal="₹2,50,000"
                                holdBalance=""
                                startDate="15/03/2023"
                                documentTitle=""
                                documentSize=""
                                confirmationText=""
                                holdBalanceText=""
                              />
                            </div>
                          </div>
                        )
                      }
                      
                      // Regular Eva response
                      return (
                        <div className="bg-[rgba(255,255,255,0.4)] max-w-80 min-w-80 relative rounded-br-[20px] rounded-tl-[20px] rounded-tr-[20px] shrink-0 w-[528px]" data-name="Chat">
                          <div className="box-border content-stretch flex flex-col gap-3 items-start justify-center max-w-inherit min-w-inherit overflow-clip p-[16px] relative w-80">
                            <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Header Mobile">
                              <div 
                                className="flex flex-col font-['Inter:Semi_Bold',_sans-serif] font-semibold justify-start leading-[0] min-w-full not-italic relative shrink-0 text-[12px] text-black"
                                style={{ textAlign: 'left', alignItems: 'flex-start' }}
                              >
                                <div 
                                  className="leading-[16px] text-left"
                                  style={{ textAlign: 'left', width: '100%' }}
                                  dangerouslySetInnerHTML={{ 
                                    __html: message.content_transcript || message.text || 'Eva response' 
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-br-[20px] rounded-tl-[20px] rounded-tr-[20px]"/>
                        </div>
                      )
                    })()}
                  </div>
                )}
                  </div>
                )
              })
          ) : (
            <div className="w-full text-center text-gray-500 py-8">
              <p>No conversation history available</p>
            </div>
          )}
        </div>
        
        <div className="h-12 relative shrink-0 w-[360px] hidden" data-name="Component 7" data-node-id="32:2715">
          <Component7 property1="Variant3"/>
        </div>
      </div>
      
      <div className="absolute backdrop-blur backdrop-filter bg-[rgba(255,255,255,0.1)] box-border content-stretch flex flex-col items-center justify-start left-0 pb-3 pt-0 px-0 top-0 w-full" data-node-id="32:2716">
        <div className="box-border content-stretch flex flex-col h-12 items-center justify-center mb-[-12px] px-5 py-3 shrink-0 w-full" data-name="Status Bar" data-node-id="32:2717"/>
        <div className="box-border content-stretch flex items-center justify-between mb-[-12px] px-4 py-2 relative shrink-0 w-full" data-name="32:2718">
          <div className="box-border content-stretch flex items-center justify-center relative rounded-[24px] shrink-0 back" data-name="Chat History" data-node-id="32:2719">
            <div className="relative shrink-0" data-name="20px/Arrow" data-node-id="32:2720">
              <div className="absolute contents inset-0" data-name="icon" id="node-I32_2720-272_19610">
                <img alt="" className="block max-w-none size-full" src={img}/>
              </div>
            </div>
          </div>
          <div className="box-border content-stretch flex items-center justify-center relative rounded-[24px] shrink-0 chat-close cursor-pointer" data-name="Chat History" data-node-id="32:2738" onClick={onClose}>
            <div className="content-stretch flex flex-col items-center justify-center relative rounded-[80px] shrink-0" data-name="Icon/Mail & Message/OTP" data-node-id="32:2739">
              <div className="content-stretch flex items-center justify-start relative shrink-0" data-name="Icon 16px" id="node-I32_2739-6085_32412">
                <div className="relative shrink-0" data-name="Outline" id="node-I32_2739-6085_32413">
                  <img alt="" className="block max-w-none size-full" src={img1}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
