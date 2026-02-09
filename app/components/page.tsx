'use client'

import PaymentSummaryResponsive from '../../components/PaymentSummaryResponsive'
import ChatInterface from '../../components/ChatInterface'

export default function ComponentsPage() {

  return (
    <div className="min-h-screen bg-black text-blue-600 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{color: '#1659BD'}}>
            Component Library
          </h1>
          <p className="text-lg" style={{color: '#1659BD'}}>
            UI components designed for Eva AI responses
          </p>
        </div>

        {/* Chat Interface Component Preview */}
        <div className="bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{color: '#1659BD'}}>
            Chat Interface Component
          </h2>
          
          <div className="bg-blue-200 border border-gray-200 rounded-lg p-4 flex justify-center">
            <div className="w-[560px]">
              <ChatInterface />
            </div>
          </div>
        </div>

        {/* Payment Summary Responsive Component Preview */}
        <div className="bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4" style={{color: '#1659BD'}}>
            Payment Summary Responsive Component
          </h2>
          
          <div className="bg-blue-200 border border-gray-200 rounded-lg p-4 focus-main-box">
            <PaymentSummaryResponsive 
              mainHeaderText="Payment Received!"
              mainHeaderSubText="We have received the part-prepayment for Home Loan"
              header2Text="Here is your payment summary"
              loanType="Home Loan"
              accountNumber="*****6789"
              amount="₹2,00,000.00"
              startDate="01/05/2022"
              interestRate="8.5% (Floating)"
              balanceTenure="204 Months"
              emi="₹1,73,468"
              outstandingPrincipal="₹1,84,20,000"
              principal="₹1,85,00,000"
              holdBalance="₹10,000"
              holdBalanceText="This amount is on hold & not available for use"
              documentTitle="Revised Home Loan Schedule"
              documentSize="2.4 MB"
              confirmationText="We've mailed you a confirmation & the new payment plan (Amortization Schedule) to your registered ID"
            />
          </div>
        </div>

        {/* Back to Eva Link */}
        <div className="mt-8 text-center">
          <a 
            href="/c/test123" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Eva Assistant
          </a>
        </div>
      </div>
    </div>
  )
}
