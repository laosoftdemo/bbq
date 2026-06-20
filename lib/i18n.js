// lib/i18n.js
// Lightweight bilingual dictionary for Lao / English

export const translations = {
  // Navigation & General
  appName: { lo: 'ຊິ້ນດາດ', en: 'Sindat BBQ' },
  table: { lo: 'ໂຕະ', en: 'Table' },
  menu: { lo: 'ລາຍການອາຫານ', en: 'Menu' },
  cart: { lo: 'ກະຕ່າສິນຄ້າ', en: 'Cart' },
  myOrders: { lo: 'ອໍເດີຂອງຂ້ອຍ', en: 'My Orders' },
  placeOrder: { lo: 'ສັ່ງອາຫານ', en: 'Place Order' },
  total: { lo: 'ລວມທັງໝົດ', en: 'Total' },
  kip: { lo: 'ກີບ', en: 'Kip' },
  confirm: { lo: 'ຢືນຢັນ', en: 'Confirm' },
  cancel: { lo: 'ຍົກເລີກ', en: 'Cancel' },
  close: { lo: 'ປິດ', en: 'Close' },
  add: { lo: 'ເພີ່ມ', en: 'Add' },
  remove: { lo: 'ລຶບ', en: 'Remove' },
  notes: { lo: 'ໝາຍເຫດ', en: 'Notes' },
  notesPlaceholder: { lo: 'ເຊັ່ນ: ບໍ່ເອົາຜັກ, ຫວານໜ້ອຍ...', en: 'e.g. no onion, less spicy...' },
  qty: { lo: 'ຈຳນວນ', en: 'Qty' },
  price: { lo: 'ລາຄາ', en: 'Price' },
  available: { lo: 'ມີພ້ອມ', en: 'Available' },
  unavailable: { lo: 'ໝົດແລ້ວ', en: 'Unavailable' },
  loading: { lo: 'ກຳລັງໂຫລດ...', en: 'Loading...' },
  error: { lo: 'ເກີດຂໍ້ຜິດພາດ', en: 'An error occurred' },
  
  // Menu Categories
  catMeats: { lo: 'ຊີ້ນ', en: 'Meats' },
  catVegetables: { lo: 'ຜັກ', en: 'Vegetables' },
  catSauces: { lo: 'ນ້ຳຈິ້ມ', en: 'Dipping Sauces' },
  catDrinks: { lo: 'ເຄື່ອງດື່ມ', en: 'Drinks' },
  catSoup: { lo: 'ແກງ / ນ້ຳແກງ', en: 'Soup & Refills' },

  // Order Status
  statusPending: { lo: 'ລໍຖ້າ', en: 'Pending' },
  statusPreparing: { lo: 'ກຳລັງກຽມ', en: 'Preparing' },
  statusServed: { lo: 'ເສີຣ໌ແລ້ວ', en: 'Served' },
  statusCancelled: { lo: 'ຍົກເລີກ', en: 'Cancelled' },
  
  // Customer UI
  scanWelcome: { lo: 'ຍິນດີຕ້ອນຮັບ!', en: 'Welcome!' },
  scanSubtitle: { lo: 'ເລືອກອາຫານທີ່ທ່ານຕ້ອງການ', en: 'Choose what you\'d like to grill' },
  emptyCart: { lo: 'ກະຕ່າຂອງທ່ານຫວ່າງ', en: 'Your cart is empty' },
  emptyCartSub: { lo: 'ເລີ່ມເພີ່ມອາຫານຈາກລາຍການ', en: 'Start adding items from the menu' },
  orderSuccess: { lo: 'ສຳເລັດ! ອໍເດີຂອງທ່ານຖືກສົ່ງແລ້ວ', en: 'Order sent to kitchen!' },
  orderSuccessSub: { lo: 'ທ່ານສາມາດຕິດຕາມໄດ້ທາງ "ອໍເດີຂອງຂ້ອຍ"', en: 'Track it under "My Orders"' },
  noOrders: { lo: 'ຍັງບໍ່ມີອໍເດີ', en: 'No orders yet' },
  noOrdersSub: { lo: 'ສັ່ງອາຫານທຳອິດຂອງທ່ານ!', en: 'Place your first order!' },
  sharedCart: { lo: 'ກະຕ່າລວມໂຕະ', en: 'Shared Table Cart' },
  sharedCartInfo: { lo: 'ທຸກຄົນຢູ່ໂຕະດຽວກັນສາມາດເພີ່ມໄດ້', en: 'Everyone at this table shares this cart' },
  confirmOrder: { lo: 'ຢືນຢັນການສັ່ງ', en: 'Confirm Order' },
  confirmOrderText: { lo: 'ທ່ານຕ້ອງການສັ່ງອາຫານເຫຼົ່ານີ້ບໍ?', en: 'Ready to send these items to the kitchen?' },

  // Kitchen
  kitchenTitle: { lo: 'ໜ້າຈໍຄົວ', en: 'Kitchen Display' },
  newOrder: { lo: 'ອໍເດີໃໝ່!', en: 'New Order!' },
  markPreparing: { lo: 'ເລີ່ມກຽມ', en: 'Start Preparing' },
  markServed: { lo: 'ເສີຣ໌ແລ້ວ', en: 'Mark as Served' },
  allOrders: { lo: 'ທຸກອໍເດີ', en: 'All Orders' },
  pendingOrders: { lo: 'ລໍຖ້າ', en: 'Pending' },
  preparingOrders: { lo: 'ກຳລັງກຽມ', en: 'Preparing' },
  servedOrders: { lo: 'ເສີຣ໌ແລ້ວ', en: 'Served' },
  noActiveOrders: { lo: 'ບໍ່ມີອໍເດີ', en: 'No active orders' },
  orderedAt: { lo: 'ສັ່ງເວລາ', en: 'Ordered at' },

  // Cashier
  cashierTitle: { lo: 'ໜ້າຈໍເງິນ', en: 'Cashier' },
  activeTables: { lo: 'ໂຕະທີ່ໃຊ້ຢູ່', en: 'Active Tables' },
  vacantTables: { lo: 'ໂຕະວ່າງ', en: 'Vacant Tables' },
  billSummary: { lo: 'ລາຍລະອຽດບິນ', en: 'Bill Summary' },
  generateBill: { lo: 'ສ້າງບິນ', en: 'Generate Bill' },
  payViaBCEL: { lo: 'ຈ່າຍຜ່ານ BCEL OnePay', en: 'Pay via BCEL OnePay' },
  scanQRPay: { lo: 'ສະແກນ QR ເພື່ອຈ່າຍ', en: 'Scan QR to Pay' },
  paymentTotal: { lo: 'ຈຳນວນທັງໝົດ', en: 'Payment Total' },
  closeTable: { lo: 'ປິດໂຕະ', en: 'Close Table' },
  tableActive: { lo: 'ກຳລັງໃຊ້', en: 'Active' },
  tableVacant: { lo: 'ວ່າງ', en: 'Vacant' },
  viewBill: { lo: 'ເບິ່ງບິນ', en: 'View Bill' },
  items: { lo: 'ລາຍການ', en: 'items' },
}

// React hook for language switching
// Usage: const { t, lang, setLang } = useLang()
// In components: import { useLang } from '@/lib/i18n'
