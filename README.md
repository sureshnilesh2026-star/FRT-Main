# Pulse - AI Conversation Interface

A modern, interactive AI conversation interface built with Next.js, Neon and ElevenLabs. This application provides a seamless way to have voice conversations with an AI assistant and sync them in your serverless Postgres.

<img src="https://github.com/user-attachments/assets/1267a85c-d35a-4779-8d7f-a07f4aa1ec7a" />

## 🌟 Features

- Real-time voice conversations with AI
- Beautiful animated interface
- Dark mode support
- Persistent conversation history
- Edge runtime support
- Responsive design

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 15
- **Styling**: [Tailwind](https://tailwindcss.com/)
- **Animation**: Framer Motion
- **Database**: [Neon](https://neon.tech/)
- **AI Integration**: [ElevenLabs API](https://elevenlabs.io/docs/conversational-ai/docs/introduction)

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/neondatabase-labs/pulse
cd pulse
```

2. Run `npm install` and `npm run schema` to install dependencies and set the relevant schema in your Neon database.

3. Create a `.env` file in the root directory with the following variables:

```bash
# Grab Agent ID from https://elevenlabs.io/app/conversational-ai
AGENT_ID="..."
# Grab API Key from https://elevenlabs.io/app/settings/api-keys
XI_API_KEY="..."
# Grab a connection string from https://console.neon.tech
DATABASE_URL="postgresql://neondb_owner:...@ep-...us-east-1.aws.neon.tech/neondb?sslmode=require"
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Project Structure

- `/app` - Next.js app directory containing routes and layouts
- `/components` - Reusable React components

## 🔑 Environment Variables

- `DATABASE_URL`: Neon database connection string
- `XI_API_KEY`: ElevenLabs API key
- `AGENT_ID`: ElevenLabs agent ID

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 References

- [Next.js](https://nextjs.org/)
- [ElevenLabs](https://elevenlabs.io/)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Neon Database](https://neon.tech/)

# Authors

- Raouf Chebri ([@_raoufai](https://twitter.com/_raoufai))
- Rishi Raj Jain ([@rishi_raj_jain_](https://twitter.com/rishi_raj_jain_))
