import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get the n8n webhook URL from environment variable
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
    
    if (!n8nWebhookUrl || n8nWebhookUrl.includes('your-n8n-instance.com')) {
      // For testing purposes, return the JSON payload that would be sent
      // Determine data type based on the request
      const isLoanData = body.originalMessage?.includes('Home Loan') || body.originalMessage?.includes('Top-Up') || body.requestType === 'loan_information'
      
      let structuredData = {}
      
      if (isLoanData) {
        // Return the proper N8N format for loan data
        return NextResponse.json({
          success: true,
          message: 'N8N webhook not configured - showing test loan data',
          n8nResponse: [{
            "Transcript": [{
              "Products": {
                "Header Line": "Here is your payment summary",
                "Product1": {
                  "Product Name": "Home Loan",
                  "Product Number": "*****6789",
                  "Datasets": [
                    {
                      "Dataset1": {
                        "Label": "Amount",
                        "Value": "₹2,00,000.00"
                      }
                    },
                    {
                      "Dataset2": {
                        "Label": "Start Date", 
                        "Value": "01/05/2022"
                      }
                    },
                    {
                      "Dataset3": {
                        "Label": "Interest Rate",
                        "Value": "8.5%",
                        "Sub Value": "Floating"
                      }
                    },
                    {
                      "Dataset4": {
                        "Label": "Balance Tenure",
                        "Value": "204 Months"
                      }
                    },
                    {
                      "Dataset5": {
                        "Label": "EMI",
                        "Value": "₹1,73,468"
                      }
                    },
                    {
                      "Dataset6": {
                        "Label": "Outstanding Principal",
                        "Value": "₹1,84,20,000"
                      }
                    },
                    {
                      "Dataset7": {
                        "Label": "Principal",
                        "Value": "₹1,85,00,000"
                      }
                    },
                    {
                      "Dataset8": {
                        "Label": "Loan Ending",
                        "Value": "*****6789"
                      }
                    }
                  ]
                }
              }
            }]
          }]
        })
      } else {
        // Generic structured data format for any other data
        structuredData = {
          genericData: {
            items: [
              {
                type: "Account Information",
                accountNumber: "ending with 1234",
                balance: "₹50,000",
                lastTransaction: "15/12/2024",
                status: "Active",
                category: "Savings Account"
              },
              {
                type: "Credit Card",
                accountNumber: "ending with 5678",
                creditLimit: "₹2,00,000",
                availableCredit: "₹1,75,000",
                dueDate: "25/12/2024",
                minimumDue: "₹5,000"
              }
            ]
          }
        }
      }

      const webhookPayload = {
        timestamp: new Date().toISOString(),
        event: body.event || 'structured_data_request',
        source: 'hdfc-eva-ui',
        data: {
          action: body.requestType || 'data_formatting',
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
          ...structuredData,
          ...body
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'N8N webhook not configured - showing test JSON payload',
        webhookPayload: webhookPayload,
        note: 'This is the JSON that would be sent to n8n webhook'
      })
    }

    // Prepare the payload to send to n8n
    const webhookPayload = {
      chatInput: body.originalMessage || '', // N8N AI Agent expects this field
      timestamp: new Date().toISOString(),
      event: body.event || 'start_button_clicked',
      source: 'hdfc-eva-ui',
      data: {
        action: body.requestType || 'start_conversation',
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
        ...body
      }
    }

    // Send webhook to n8n with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    let response
    try {
      response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout: N8N webhook did not respond within 30 seconds. Please check your network connection.')
      }
      if (fetchError.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
        throw new Error(`Connection timeout: Unable to connect to ${n8nWebhookUrl}. Please check your network connection and firewall settings.`)
      }
      throw fetchError
    }

    console.log('N8N Response Status:', response.status)
    console.log('N8N Response Headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.log('N8N Error Response:', errorText)
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
    }

    // Get the raw response text first
    const responseText = await response.text()
    console.log('N8N Raw Response:', responseText)

    // Try to parse as JSON
    let result
    try {
      result = responseText ? JSON.parse(responseText) : {}
    } catch (parseError) {
      console.log('N8N response is not valid JSON, using raw text')
      result = { rawResponse: responseText }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook sent to n8n successfully',
      n8nResponse: result,
      rawResponse: responseText // Include raw response for debugging
    })

  } catch (error) {
    console.error('Error sending webhook to n8n:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send webhook to n8n',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
