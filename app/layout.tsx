import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans, Poppins } from 'next/font/google'
// import { Toaster } from 'sonner'
import './globals.css'

const interFont = Inter({
  subsets: ['latin'],
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
})

const poppinsFont = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const config = {
  url: 'https://www.hdfcbank.com/',
  title: 'HDFC Bank Eva',
  description: 'HDFC Bank AI assistant Eva',
}

const btoa = (str: string) => Buffer.from(str).toString('base64')
const images = `https://www.hdfcbank.com/images/hdfc-bank-logo.png`
// const images = `https://neon.tech/docs/og?title=${btoa('Pulse')}&breadcrumb=${btoa(config.title)}`

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  openGraph: {
    images,
    url: config.url,
    title: config.title,
    description: config.description,
  },
  twitter: {
    images,
    title: config.title,
    card: 'summary_large_image',
    description: config.description,
  },
}

export default function ({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/hdfc-logo.png" type="image/png" />
      </head>
      <body className={`${poppinsFont.className} antialiased`}>
        {/* <Toaster /> */}
        {children}
      </body>
    </html>
  )
}
