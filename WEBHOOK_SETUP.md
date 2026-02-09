# N8N Webhook Integration Setup

This document explains how to set up the webhook integration with n8n for the HDFC EVA AI Assistant.

## Overview

The application now sends webhooks to n8n when:
1. **Start button is clicked** - Triggers when user clicks the blob button in the white box
2. **Conversation starts** - Triggers when the ElevenLabs conversation begins

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in your project root with the following content:

```bash
# N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
N8N_WEBHOOK_URL=https://eva-ramanik.app.n8n.cloud/webhook/ResponseFormat

```

**Replace the URL with your actual n8n webhook endpoint.**

### 2. N8N Webhook Node Setup

In your n8n workflow:

1. **Add a Webhook node**
2. **Configure the webhook URL** - This will be your endpoint
3. **Set the HTTP method to POST**
4. **Copy the webhook URL** and add it to your `.env.local` file

### 3. Webhook Payload Structure

The webhook sends the following data structure:

#### Start Button Clicked:
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "event": "start_button_clicked",
  "source": "hdfc-eva-ui",
  "data": {
    "buttonClicked": "start",
    "aiState": "idle",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Conversation Started:
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "event": "conversation_started",
  "source": "hdfc-eva-ui",
  "data": {
    "event": "conversation_started",
    "conversationId": "your-conversation-id",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "status": "connecting"
  }
}
```

### 4. Testing the Integration

1. **Start your development server**: `pnpm dev`
2. **Set up your n8n webhook** and copy the URL
3. **Add the URL to `.env.local`**
4. **Restart your development server**
5. **Click the Start button** in your application
6. **Check your n8n workflow** to see the incoming webhook

### 5. Troubleshooting

#### Webhook not sending:
- Check that `.env.local` exists and has the correct URL
- Verify the N8N_WEBHOOK_URL environment variable is set
- Check browser console for any errors
- Ensure your n8n webhook endpoint is accessible

#### Environment variable not loading:
- Restart your development server after adding `.env.local`
- Verify the file is in the project root directory
- Check that the variable name is exactly `N8N_WEBHOOK_URL`

## API Endpoints

### POST `/api/webhook`

Sends webhook data to your configured n8n instance.

**Headers:**
- `Content-Type: application/json`

**Response:**
```json
{
  "success": true,
  "message": "Webhook sent to n8n successfully",
  "n8nResponse": { ... }
}
```

## Security Considerations

- Keep your webhook URLs private
- Consider adding authentication to your n8n webhook endpoints
- Monitor webhook usage to prevent abuse
- Use HTTPS for production webhook URLs

## Next Steps

Once the webhook is working, you can:
1. **Process the webhook data** in n8n
2. **Trigger automated workflows** based on button clicks
3. **Log user interactions** for analytics
4. **Integrate with other systems** through n8n
