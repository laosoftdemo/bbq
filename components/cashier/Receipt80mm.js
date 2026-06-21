'use client'
// components/cashier/Receipt80mm.js
// Formatted specifically for 80mm thermal receipt printers.
// Uses @media print CSS to constrain width on actual print output.
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { formatKip, formatTime } from '@/lib/format'

export default function Receipt80mm({ paymentData, lang, onClose }) {
  const {
    receiptNumber, table, items, total,
    paymentMethod, amountReceived, amountChange, paidAt, staffName,
  } = paymentData

  const t = (lo, en) => lang === 'lo' ? lo : en
  const qrCanvasRef = useRef(null)
  const [qrReady, setQrReady] = useState(false)

  useEffect(() => {
    if (qrCanvasRef.current && receiptNumber) {
      QRCode.toCanvas(qrCanvasRef.current, receiptNumber, {
        width: 110,
        margin: 0,
        color: { dark: '#000000', light: '#ffffff' },
      }, (err) => {
        if (!err) setQrReady(true)
      })
    }
  }, [receiptNumber])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:bg-white print:p-0" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-plate rounded-3xl overflow-hidden print:bg-white print:rounded-none print:max-w-none print:shadow-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Screen-only header */}
        <div className="bg-jade/15 px-5 py-4 flex items-center justify-between border-b border-rim print:hidden">
          <div>
            <h3 className="text-white font-bold text-base">✅ {t('ຈ່າຍເງິນສຳເລັດ', 'Payment Complete')}</h3>
            <p className="text-ash text-xs">{receiptNumber}</p>
          </div>
          <button onClick={onClose} className="text-ash hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-700 transition-colors">
            ×
          </button>
        </div>

        {/* ─── Printable receipt area (80mm width) ─── */}
        <div id="receipt-print-area" className="bg-white text-black mx-auto" style={{ width: '80mm', padding: '4mm' }}>
          <div className="text-center mb-2">
            <div className="text-2xl">🔥</div>
            <div className="font-black text-lg leading-tight">ຊິ້ນດາດ</div>
            <div className="text-xs text-gray-600">Sindat Lao BBQ</div>
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          <div className="text-xs space-y-0.5">
            <div className="flex justify-between">
              <span>{t('ໂຕະ', 'Table')}</span>
              <span className="font-bold">{table?.table_number}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('ໃບບິນເລກທີ', 'Receipt No.')}</span>
              <span className="font-mono">{receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('ວັນທີ', 'Date')}</span>
              <span>{formatTime(paidAt)}</span>
            </div>
            {staffName && (
              <div className="flex justify-between">
                <span>{t('ພະນັກງານ', 'Staff')}</span>
                <span>{staffName}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          {/* Items */}
          <div className="text-xs space-y-1">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span className="flex-1">
                  {item.quantity}× {lang === 'lo' ? item.name_lo : item.name_en}
                </span>
                <span className="flex-shrink-0">{formatKip(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          {/* Total */}
          <div className="flex justify-between font-black text-sm mb-1">
            <span>{t('ລວມທັງໝົດ', 'TOTAL')}</span>
            <span>{formatKip(total)}</span>
          </div>

          {/* Payment method details */}
          <div className="text-xs space-y-0.5 mt-2">
            <div className="flex justify-between">
              <span>{t('ວິທີຈ່າຍ', 'Payment Method')}</span>
              <span className="font-semibold">
                {paymentMethod === 'cash' ? t('ເງິນສົດ', 'Cash') : 'BCEL OnePay'}
              </span>
            </div>
            {paymentMethod === 'cash' && (
              <>
                <div className="flex justify-between">
                  <span>{t('ຮັບເງິນ', 'Received')}</span>
                  <span>{formatKip(amountReceived)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('ເງິນທອນ', 'Change')}</span>
                  <span>{formatKip(amountChange)}</span>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          {/* QR code */}
          <div className="flex flex-col items-center mt-2">
            <canvas ref={qrCanvasRef} />
            <div className="text-[9px] text-gray-500 mt-1">{receiptNumber}</div>
          </div>

          <div className="text-center text-xs text-gray-600 mt-3">
            {t('ຂອບໃຈທີ່ໃຊ້ບໍລິການ', 'Thank you for dining with us')}
          </div>
        </div>
        {/* ─── End printable area ─── */}

        {/* Screen-only actions */}
        <div className="p-5 print:hidden">
          <button
            onClick={handlePrint}
            className="w-full bg-ember hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <span>🖨️</span>
            <span>{t('ພິມໃບບິນ', 'Print Receipt')}</span>
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 surface text-ash hover:text-white py-3 rounded-xl transition-colors text-sm"
          >
            {t('ປິດ', 'Close')}
          </button>
        </div>
      </div>

      {/* Print-specific styles: hide everything except the receipt area, set page size for 80mm */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #receipt-print-area, #receipt-print-area * {
            visibility: visible;
          }
          #receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important;
          }
        }
      `}</style>
    </div>
  )
}
