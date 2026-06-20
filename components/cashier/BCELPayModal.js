'use client'
// components/cashier/BCELPayModal.js
import { formatKip, formatKipCompact } from '@/lib/format'

// Visual QR code generator using SVG pattern (placeholder that renders the amount)
function QRPlaceholder({ amount, tableNumber }) {
  // Generate a pseudo-QR pattern seeded by the amount for visual variation
  const seed = amount + tableNumber.charCodeAt(0)
  const cells = 21
  const cellSize = 10
  const size = cells * cellSize

  const pattern = Array.from({ length: cells }, (_, row) =>
    Array.from({ length: cells }, (_, col) => {
      // Fixed finder patterns (corners)
      if ((row < 7 && col < 7) || (row < 7 && col >= cells - 7) || (row >= cells - 7 && col < 7)) {
        return true
      }
      // Pseudo-random data cells seeded by amount
      return ((seed * (row * cells + col + 1) * 2654435761) >>> 0) % 3 === 0
    })
  )

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      className="rounded-lg"
    >
      <rect width={size} height={size} fill="white" />
      {pattern.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#111" />
          ) : null
        )
      )}
      {/* Center logo area */}
      <rect x={size/2 - 20} y={size/2 - 20} width={40} height={40} fill="white" />
      <text x={size/2} y={size/2 + 6} textAnchor="middle" fontSize="20" fill="#e65c00">🔥</text>
    </svg>
  )
}

export default function BCELPayModal({ total, tableNumber, onClose }) {
  const amountFormatted = formatKipCompact(total)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* BCEL Header */}
        <div className="bg-[#004B87] px-5 py-4 text-center">
          <div className="text-white font-black text-lg tracking-wide">BCEL OnePay</div>
          <div className="text-blue-200 text-xs mt-0.5">ສະແກນ QR ເພື່ອຈ່າຍ · Scan QR to Pay</div>
        </div>

        {/* Amount */}
        <div className="bg-[#F5F5F5] px-5 py-3 text-center border-b border-gray-200">
          <div className="text-gray-500 text-xs mb-1">ຈຳນວນ / Amount</div>
          <div className="text-[#004B87] font-black text-3xl">{amountFormatted}</div>
          <div className="text-gray-400 text-sm">ກີບ (LAK)</div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center px-8 py-6">
          <div className="p-3 bg-white border-4 border-[#004B87] rounded-2xl shadow-lg">
            <QRPlaceholder amount={total} tableNumber={String(tableNumber)} />
          </div>
          <div className="mt-4 text-center">
            <div className="text-gray-600 text-xs leading-relaxed">
              ໂຕະ / Table <strong className="text-[#004B87]">{tableNumber}</strong>
            </div>
            <div className="text-gray-400 text-xs mt-1">
              QR ໃຊ້ໄດ້ 15 ນາທີ · Valid for 15 minutes
            </div>
          </div>
        </div>

        {/* Info strip */}
        <div className="bg-[#FFF3E0] px-5 py-3 flex items-center gap-3 border-t border-orange-100">
          <span className="text-2xl">📱</span>
          <div>
            <div className="text-[#E65C00] font-semibold text-xs">ເປີດ BCEL OnePay App</div>
            <div className="text-gray-500 text-xs">ເລືອກ "ສະແກນ" ແລ້ວຖ່າຍ QR ດ້ານເທິງ</div>
          </div>
        </div>

        {/* Close */}
        <div className="px-5 py-4">
          <button
            onClick={onClose}
            className="w-full bg-[#004B87] hover:bg-[#003D70] text-white font-bold py-3.5 rounded-2xl transition-colors"
          >
            ປິດ / Close
          </button>
        </div>
      </div>
    </div>
  )
}
