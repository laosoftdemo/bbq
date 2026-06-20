// app/layout.js
import { Noto_Sans_Lao, Inter } from 'next/font/google'
import './globals.css'

const notoSansLao = Noto_Sans_Lao({
  subsets: ['lao'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lao',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'ຊິ້ນດາດ – Sindat BBQ',
  description: 'Lao BBQ Table Ordering System',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#1a1a2e',
}

export default function RootLayout({ children }) {
  return (
    <html lang="lo" className={`${notoSansLao.variable} ${inter.variable}`}>
      <body className="bg-neutral-950 text-white antialiased font-lao">
        {children}
      </body>
    </html>
  )
}
