'use client'

interface PaymentSummaryResponsiveProps {
  mainHeaderText?: string
  mainHeaderSubText?: string
  header2Text?: string
  showMainHeader?: boolean
  showHeader2?: boolean
  header2RightIcons?: boolean
  loanType?: string
  accountNumber?: string
  amount?: string
  startDate?: string
  interestRate?: string
  balanceTenure?: string
  emi?: string
  outstandingPrincipal?: string
  principal?: string
  holdBalance?: string
  holdBalanceText?: string
  documentTitle?: string
  documentSize?: string
  confirmationText?: string
  // Dynamic data fields - array of {label, value} pairs
  customDataFields?: Array<{label: string, value: string | number}>
}

export default function PaymentSummaryResponsive({
  mainHeaderText = "Payment Received!",
  mainHeaderSubText = "We have received the part-prepayment for Home Loan",
  header2Text = "Here is your payment summary",
  showMainHeader = true,
  showHeader2 = true,
  header2RightIcons = true,
  loanType = "Home Loan",
  accountNumber = "*****6789",
  amount = "₹2,00,000.00",
  startDate = "01/05/2022",
  interestRate = "8.5% (Floating)",
  balanceTenure = "204 Months",
  emi = "₹1,73,468",
  outstandingPrincipal = "₹1,84,20,000",
  principal = "₹1,85,00,000",
  holdBalance = "₹10,000",
  holdBalanceText = "This amount is on hold & not available for use",
  documentTitle = "Revised Home Loan Schedule",
  documentSize = "2.4 MB",
  confirmationText = "We've mailed you a confirmation & the new payment plan (Amortization Schedule) to your registered ID",
  customDataFields = []
}: PaymentSummaryResponsiveProps) {

  const DocumentCard = () => {
    // Only show document card if we have meaningful document data
    if (!documentTitle || documentTitle.trim() === '' || documentTitle === 'null' || documentTitle === 'undefined') {
      return null
    }
    
    return (
      <div className="bg-white rounded-xl p-3 flex items-center justify-between min-h-[84px]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <g clipPath="url(#clip0_905_57332)">
                <path d="M16.2 22H7.8C5.15 22 3 19.85 3 17.2V6.8C3 4.15 5.15 2 7.8 2H12.8C13.44 2 14.05 2.25 14.5 2.7L20.3 8.3C20.75 8.75 21 9.36 21 10V17.19C21 19.84 18.85 21.99 16.2 21.99V22Z" fill="#E30613"/>
                <path d="M20.6998 8.86998C20.5898 8.66998 20.4598 8.46998 20.2998 8.30998L14.4998 2.70998C14.2998 2.50998 14.0598 2.34998 13.7998 2.22998V6.25998C13.7998 7.69998 14.9698 8.86998 16.4098 8.86998H20.6998Z" fill="#83012C"/>
                <path d="M7.51016 13.0198H6.11016C5.72016 13.0198 5.41016 13.3298 5.41016 13.7198V17.8298C5.41016 18.2198 5.72016 18.5298 6.11016 18.5298C6.50016 18.5298 6.81016 18.2198 6.81016 17.8298V17.0498H7.51016C8.62016 17.0498 9.53016 16.1498 9.53016 15.0298C9.53016 13.9098 8.63016 13.0098 7.51016 13.0098V13.0198ZM7.51016 15.6598H6.81016V14.4298H7.51016C7.85016 14.4298 8.13016 14.7098 8.13016 15.0498C8.13016 15.3898 7.85016 15.6698 7.51016 15.6698V15.6598Z" fill="#FCAE99"/>
                <path d="M18.2801 14.4198C18.6701 14.4198 18.9801 14.1098 18.9801 13.7198C18.9801 13.3298 18.6701 13.0198 18.2801 13.0198H15.9401C15.5501 13.0198 15.2401 13.3298 15.2401 13.7198V17.8298C15.2401 18.2198 15.5501 18.5298 15.9401 18.5298C16.3301 18.5298 16.6401 18.2198 16.6401 17.8298V16.6398H17.8801C18.2701 16.6398 18.5801 16.3298 18.5801 15.9398C18.5801 15.5498 18.2701 15.2398 17.8801 15.2398H16.6401V14.4198H18.2801Z" fill="#FCAE99"/>
                <path d="M12.2201 13.0198H10.8001C10.4101 13.0198 10.1001 13.3298 10.1001 13.7198V17.8298C10.1001 18.2198 10.4101 18.5298 10.8001 18.5298H12.2201C13.5101 18.5298 14.5701 17.4798 14.5701 16.1798V15.3598C14.5701 14.0698 13.5201 13.0098 12.2201 13.0098V13.0198ZM13.1601 16.1898C13.1601 16.7098 12.7401 17.1398 12.2101 17.1398H11.4901V14.4298H12.2101C12.7301 14.4298 13.1601 14.8498 13.1601 15.3798V16.1998V16.1898Z" fill="#FCAE99"/>
              </g>
              <defs>
                <clipPath id="clip0_905_57332">
                  <rect width="24" height="24" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{documentTitle}</div>
            {documentSize && documentSize.trim() !== '' && documentSize !== 'null' && documentSize !== 'undefined' && (
              <div className="text-xs text-gray-700">{documentSize}</div>
            )}
          </div>
        </div>
        <div className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center">
          <img src="/download.png" alt="Download" className="w-8 h-8" />
        </div>
      </div>
    )
  }

  const ConfirmationCard = () => {
    // Only show confirmation card if we have meaningful confirmation text
    if (!confirmationText || confirmationText.trim() === '' || confirmationText === 'null' || confirmationText === 'undefined') {
      return null
    }
    
    return (
      <div className="bg-white rounded-xl p-3 flex items-center gap-3 min-h-[84px]">
        <div className="w-6 h-6 rounded-full flex items-center justify-center">
            <img src="/info.svg" alt="Info" style={{ width: '16px', height: '16px' }} />
        </div>
        <div className="text-xs text-gray-700">{confirmationText}</div>
      </div>
    )
  }

  return (
    <div className="typ-focus bg-white bg-opacity-30 rounded-t-3xl rounded-br-3xl border border-white p-3 sm:p-4 md:p-5 w-full max-w-full mx-auto">
      {/* Main Header - Only show if we have meaningful payment data */}
      {showMainHeader && mainHeaderText && mainHeaderText.trim() !== '' && mainHeaderSubText && mainHeaderSubText.trim() !== '' && mainHeaderText !== 'null' && mainHeaderSubText !== 'null' && (
        <div className="focus-header flex items-center gap-4 pb-4 border-b border-gray-200 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center">
            <img src="/paymentreceived.png" alt="Payment Received" className="w-12 h-12 rounded-full" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">{mainHeaderText}</h2>
            <p className="text-sm text-gray-700">{mainHeaderSubText}</p>
          </div>
        </div>
      )}

      {/* Payment Summary Header */}
      {showHeader2 && header2Text && header2Text.trim() !== '' && header2Text !== 'null' && (
        <div className="flex items-center justify-between mb-4 table-title-wrapper">
          <h3 className="text-sm font-bold text-gray-900">{header2Text}</h3>
        {header2RightIcons && (
          <div className="flex items-center gap-4 focus-act-btn">
            <button className="w-8 h-8 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
              </svg>
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center">
              <img src="/download.png" alt="Download" className="w-8 h-8" />
            </button>
          </div>
        )}
        </div>
      )}

      {/* Main Content */}
        <div className="space-y-mobile-2px md:space-y-4">
          <div className='bg-whiteclr'>
        {/* Loan Info Header - Only show if we have loan type or account number */}
        {(loanType && loanType.trim() !== '' && loanType !== 'null' && loanType !== 'undefined') || (accountNumber && accountNumber.trim() !== '' && accountNumber !== 'null' && accountNumber !== 'undefined') ? (
          <div className="bg-green-50 rounded-xl p-3 flex items-center justify-between">
            {loanType && loanType.trim() !== '' && loanType !== 'null' && loanType !== 'undefined' && (
              <span className="text-sm font-semibold text-gray-900">{loanType}</span>
            )}
            {accountNumber && accountNumber.trim() !== '' && accountNumber !== 'null' && accountNumber !== 'undefined' && (
              <span className="text-sm font-medium text-gray-900">{accountNumber}</span>
            )}
          </div>
        ) : null}

        {/* Cards Grid - Responsive - Only show if we have cards with data */}
        {(() => {
          const cardsWithData = [
            { label: 'Amount', value: amount },
            { label: 'Start Date', value: startDate },
            { label: 'Interest Rate', value: interestRate },
            { label: 'Balance Tenure', value: balanceTenure },
            { label: 'EMI', value: emi },
            { label: 'Outstanding Principal', value: outstandingPrincipal },
            { label: 'Principal', value: principal },
            // Add custom data fields
            ...customDataFields.map(field => ({ label: field.label, value: field.value }))
          ].filter(card => {
            // Enhanced filtering to handle null, undefined, empty strings, and whitespace
            const value = card.value
            return value && 
                   value.toString().trim() !== '' && 
                   value.toString().trim() !== 'null' && 
                   value.toString().trim() !== 'undefined' &&
                   value.toString().trim() !== 'N/A' &&
                   value.toString().trim() !== 'Not Available'
          })
          
          return cardsWithData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0.5 md:gap-3 mt-0.5 md:mt-3">
              {cardsWithData.map((card, index) => (
                <div key={index} className="bg-white rounded-xl p-3 flex flex-row items-center justify-between md:flex-col md:items-start md:justify-start">
                  <div className="text-xs text-gray-700 font-normal">{card.label}</div>
                  <div className="text-sm text-gray-900 font-bold text-left">{card.value}</div>
                </div>
              ))}
            </div>
          ) : null
        })()}
</div>
        {/* Document and Confirmation Cards - Side by Side - Only show if we have cards */}
        {(() => {
          const hasDocument = documentTitle && documentTitle.trim() !== '' && documentTitle !== 'null' && documentTitle !== 'undefined'
          const hasConfirmation = confirmationText && confirmationText.trim() !== '' && confirmationText !== 'null' && confirmationText !== 'undefined'
          
          return (hasDocument || hasConfirmation) ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0.5 add-white-bg">
              <DocumentCard />
              <ConfirmationCard />
            </div>
          ) : null
        })()}
        
        {/* Hold Balance Section - Only show if we have meaningful data */}
        {(holdBalance && holdBalance.trim() !== '' && holdBalance !== 'null' && holdBalance !== 'undefined') && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between center-text-box" style={{marginTop: '15px'}}>
            <div className="flex items-center gap-1 typ2">
              <span className="text-xs text-gray-900">Hold Balance:</span>
              <span className="text-sm font-bold text-red-600">{holdBalance}</span>
            </div>
            {holdBalanceText && holdBalanceText.trim() !== '' && holdBalanceText !== 'null' && holdBalanceText !== 'undefined' && (
              <span className="text-xs text-gray-500 md:text-right mt-1 mb-1 md:mt-0">{holdBalanceText}</span>
            )}
          </div>
        )}

        {/* Final Confirmation - Only show if we have meaningful text */}
        {confirmationText && confirmationText.trim() !== '' && confirmationText !== 'null' && confirmationText !== 'undefined' && (
          <div className="mt-0 center-text-box">
            <p className="text-sm font-bold text-black">{confirmationText}</p>
          </div>
        )}
      </div>
    </div>
  )
}
