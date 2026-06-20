// app/page.js
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">🔥</div>
      <h1 className="text-3xl font-bold mb-2">ຊິ້ນດາດ</h1>
      <p className="text-ash mb-8">Sindat Lao BBQ Ordering System</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/menu?table=1"
          className="bg-ember text-white py-3 px-6 rounded-xl font-semibold text-center hover:bg-orange-600 transition-colors"
        >
          Customer Menu (Table 1)
        </Link>
        <Link
          href="/staff/kitchen"
          className="surface py-3 px-6 rounded-xl font-semibold text-center hover:border-ember transition-colors"
        >
          Kitchen Display
        </Link>
        <Link
          href="/staff/cashier"
          className="surface py-3 px-6 rounded-xl font-semibold text-center hover:border-ember transition-colors"
        >
          Cashier
        </Link>
      </div>
      <p className="text-ash text-sm mt-8">
        QR Code URL format: <code className="text-ember">/menu?table=[number]</code>
      </p>
    </main>
  )
}
