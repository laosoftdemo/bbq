// app/menu/page.js
// Accessed via QR code: /menu?table=3
import { Suspense } from 'react'
import MenuApp from '@/components/menu/MenuApp'

export const metadata = {
  title: 'ສັ່ງອາຫານ – Sindat BBQ',
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🔥</div>
          <p className="text-ash text-sm">ກຳລັງໂຫລດ...</p>
        </div>
      </div>
    }>
      <MenuApp />
    </Suspense>
  )
}
