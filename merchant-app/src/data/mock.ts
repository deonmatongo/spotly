// Merchant is Amanzi Restaurant — the same vendor referenced in the driver-app
// so a future shared backend hands the same order ref without a reshape.

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'done' | 'declined'
export type MenuCategory = 'Mains' | 'Starters' | 'Drinks' | 'Desserts' | 'Sides'

export interface OrderItem {
  id: string
  name: string
  qty: number
  unitPrice: number
  note?: string
}

export interface MerchantOrder {
  id: string
  ref: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  placedAt: string
  placedTs?: number   // epoch ms — drives the live "elapsed since placed" timer
  prepMinutes: number
  driverName?: string
  address: string
}

export interface MenuItem {
  id: string
  name: string
  category: MenuCategory
  price: number
  description: string
  available: boolean
  soldToday: number
}

// ---------------------------------------------------------------------------
// Store profile
// ---------------------------------------------------------------------------
export const currentStore = {
  name: 'Amanzi Restaurant',
  firstName: 'Amanzi',
  email: 'orders@amanzi.co.zw',
  phone: '+263 77 301 1122',
  address: '225 Enterprise Road, Highlands, Harare',
  rating: 4.7,
  totalOrders: 3842,
  memberSince: 'March 2023',
  avgPrepTime: 18,
  coverageRadius: '5 km',
  bankAccount: '**** **** 9342',
}

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------
export const menuItems: MenuItem[] = [
  { id: 'm1', name: 'Grilled Tilapia', category: 'Mains', price: 12.50, description: 'Whole tilapia, chimichurri, served with sadza', available: true, soldToday: 14 },
  { id: 'm2', name: 'Nyama Choma Platter', category: 'Mains', price: 16.90, description: 'Mixed BBQ meats, peri-peri sauce, roast veg', available: true, soldToday: 22 },
  { id: 'm3', name: 'Chicken Livers', category: 'Starters', price: 6.50, description: 'Peri-peri chicken livers, toasted ciabatta', available: true, soldToday: 9 },
  { id: 'm4', name: 'Prawn Cocktail', category: 'Starters', price: 8.90, description: 'Harare prawns, Marie Rose, shredded lettuce', available: false, soldToday: 0 },
  { id: 'm5', name: 'Matumbo Stew', category: 'Mains', price: 9.00, description: 'Slow-cooked tripe, tomato base, served with rice', available: true, soldToday: 7 },
  { id: 'm6', name: 'Mazoe Sorbet', category: 'Desserts', price: 3.50, description: 'House-made Mazoe orange sorbet', available: true, soldToday: 11 },
  { id: 'm7', name: 'Dovi Peanut Butter Stew', category: 'Mains', price: 10.50, description: 'Chicken in peanut butter sauce, cabbage, sadza', available: true, soldToday: 6 },
  { id: 'm8', name: 'Chibuku Draft', category: 'Drinks', price: 2.00, description: '500ml traditional sorghum beer', available: false, soldToday: 0 },
  { id: 'm9', name: 'Sparkling Water', category: 'Drinks', price: 1.50, description: '500ml', available: true, soldToday: 18 },
  { id: 'm10', name: 'Sadza & Greens', category: 'Sides', price: 3.00, description: 'Sadza with covo or rape greens', available: true, soldToday: 20 },
  { id: 'm11', name: 'Chips (Fries)', category: 'Sides', price: 2.50, description: 'Crispy house-cut chips, seasoned salt', available: true, soldToday: 31 },
  { id: 'm12', name: 'Chocolate Lava Cake', category: 'Desserts', price: 5.50, description: 'Warm chocolate fondant, vanilla ice cream', available: true, soldToday: 8 },
]

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export const seedOrders: MerchantOrder[] = [
  {
    id: 'o1',
    ref: 'SPT-4401',
    customerName: 'Chiedza Mhuri',
    customerPhone: '+263 77 991 2233',
    items: [
      { id: 'i1', name: 'Grilled Tilapia', qty: 1, unitPrice: 12.50 },
      { id: 'i2', name: 'Sadza & Greens', qty: 1, unitPrice: 3.00 },
      { id: 'i3', name: 'Sparkling Water', qty: 2, unitPrice: 1.50 },
    ],
    subtotal: 18.50,
    deliveryFee: 2.90,
    total: 21.40,
    status: 'new',
    placedAt: '2 min ago',
    prepMinutes: 20,
    address: '14 Harrow Road, Msasa',
  },
  {
    id: 'o2',
    ref: 'SPT-4398',
    customerName: 'Tapiwa Gonzo',
    customerPhone: '+263 77 445 8801',
    items: [
      { id: 'i4', name: 'Nyama Choma Platter', qty: 2, unitPrice: 16.90 },
      { id: 'i5', name: 'Chips (Fries)', qty: 2, unitPrice: 2.50 },
      { id: 'i6', name: 'Sparkling Water', qty: 2, unitPrice: 1.50 },
    ],
    subtotal: 41.80,
    deliveryFee: 3.40,
    total: 45.20,
    status: 'preparing',
    placedAt: '11 min ago',
    prepMinutes: 25,
    driverName: 'Tatenda Moyo',
    address: '2 Glenara Court, Msasa',
  },
  {
    id: 'o3',
    ref: 'SPT-4391',
    customerName: 'Rudo Chikwanda',
    customerPhone: '+263 77 320 9911',
    items: [
      { id: 'i7', name: 'Chicken Livers', qty: 1, unitPrice: 6.50 },
      { id: 'i8', name: 'Dovi Peanut Butter Stew', qty: 1, unitPrice: 10.50 },
      { id: 'i9', name: 'Mazoe Sorbet', qty: 2, unitPrice: 3.50 },
    ],
    subtotal: 24.00,
    deliveryFee: 2.90,
    total: 26.90,
    status: 'ready',
    placedAt: '28 min ago',
    prepMinutes: 18,
    driverName: 'Blessing Mutasa',
    address: '8 Cambridge Ave, Newlands',
  },
  {
    id: 'o4',
    ref: 'SPT-4385',
    customerName: 'Munashe Dube',
    customerPhone: '+263 78 445 6620',
    items: [
      { id: 'i10', name: 'Matumbo Stew', qty: 1, unitPrice: 9.00 },
      { id: 'i11', name: 'Sadza & Greens', qty: 1, unitPrice: 3.00 },
    ],
    subtotal: 12.00,
    deliveryFee: 2.60,
    total: 14.60,
    status: 'done',
    placedAt: '52 min ago',
    prepMinutes: 22,
    driverName: 'Farai Ncube',
    address: '31 Glenara Avenue, Chisipite',
  },
  {
    id: 'o5',
    ref: 'SPT-4379',
    customerName: 'Kuda Mhaka',
    customerPhone: '+263 78 210 4455',
    items: [
      { id: 'i12', name: 'Grilled Tilapia', qty: 2, unitPrice: 12.50 },
      { id: 'i13', name: 'Chips (Fries)', qty: 2, unitPrice: 2.50 },
      { id: 'i14', name: 'Chocolate Lava Cake', qty: 2, unitPrice: 5.50 },
    ],
    subtotal: 41.00,
    deliveryFee: 3.20,
    total: 44.20,
    status: 'done',
    placedAt: '1 hr 14 min ago',
    prepMinutes: 20,
    driverName: 'Tatenda Moyo',
    address: '19 Pendennis Road, Mount Pleasant',
  },
]

// ---------------------------------------------------------------------------
// Revenue / analytics
// ---------------------------------------------------------------------------
export interface RevenueDay {
  label: string
  amount: number
  orders: number
}

export const weeklyRevenue: RevenueDay[] = [
  { label: 'Mon', amount: 142.00, orders: 9 },
  { label: 'Tue', amount: 198.50, orders: 13 },
  { label: 'Wed', amount: 117.30, orders: 7 },
  { label: 'Thu', amount: 241.80, orders: 16 },
  { label: 'Fri', amount: 318.60, orders: 21 },
  { label: 'Sat', amount: 404.20, orders: 28 },
  { label: 'Sun', amount: 87.40, orders: 5 },
]

export const revenueSummary = {
  today: { amount: 87.40, orders: 5, avgOrderValue: 17.48 },
  week: {
    amount: weeklyRevenue.reduce((s, d) => s + d.amount, 0),
    orders: weeklyRevenue.reduce((s, d) => s + d.orders, 0),
  },
  pendingPayout: 1267.80,
  nextPayoutDate: 'Mon, 7 Jul',
  platformFeeRate: 0.12,
}

// Hourly order demand — drives the busiest-hours chart.
export const orderDemand = [
  { hour: '10a', level: 0.1 }, { hour: '11a', level: 0.25 }, { hour: '12p', level: 0.9 },
  { hour: '1p', level: 1.0 }, { hour: '2p', level: 0.65 }, { hour: '4p', level: 0.35 },
  { hour: '6p', level: 0.8 }, { hour: '7p', level: 0.95 }, { hour: '8p', level: 0.7 },
]
export const peakWindow = '12:00 PM – 2:00 PM & 6:00 PM – 8:00 PM'

// Top-selling items for analytics screen.
export const topItems = [
  { name: 'Chips (Fries)', sold: 31, revenue: 77.50 },
  { name: 'Nyama Choma Platter', sold: 22, revenue: 371.80 },
  { name: 'Grilled Tilapia', sold: 14, revenue: 175.00 },
  { name: 'Mazoe Sorbet', sold: 11, revenue: 38.50 },
  { name: 'Matumbo Stew', sold: 7, revenue: 63.00 },
]

// Rating breakdown
export const ratingData = {
  overall: 4.7,
  total: 312,
  breakdown: [
    { stars: 5, count: 188 },
    { stars: 4, count: 82 },
    { stars: 3, count: 29 },
    { stars: 2, count: 9 },
    { stars: 1, count: 4 },
  ],
}

// Payout history
export interface PayoutRecord {
  id: string
  amount: number
  date: string
  period: string
  status: 'paid' | 'pending'
}

export const payoutHistory: PayoutRecord[] = [
  { id: 'p1', amount: 1042.30, date: 'Mon, 30 Jun', period: '23–29 Jun', status: 'paid' },
  { id: 'p2', amount: 876.10, date: 'Mon, 23 Jun', period: '16–22 Jun', status: 'paid' },
  { id: 'p3', amount: 1188.60, date: 'Mon, 16 Jun', period: '9–15 Jun', status: 'paid' },
  { id: 'p4', amount: 954.80, date: 'Mon, 9 Jun', period: '2–8 Jun', status: 'paid' },
]

// Notification feed
export interface MerchantNotification {
  id: string
  type: 'order' | 'review' | 'payout' | 'system'
  title: string
  body: string
  time: string
  read: boolean
}

export const notificationsSeed: MerchantNotification[] = [
  { id: 'n1', type: 'order', title: 'New order — SPT-4401', body: 'Chiedza Mhuri placed an order · $21.40', time: '2 min ago', read: false },
  { id: 'n2', type: 'review', title: 'New 5-star review', body: '"The Nyama Choma was perfect. Will order again!" — Kuda M.', time: '1 hr ago', read: false },
  { id: 'n3', type: 'payout', title: 'Payout processed', body: '$1,042.30 sent to your bank account ending 9342', time: 'Yesterday', read: true },
  { id: 'n4', type: 'system', title: 'Friday surge active', body: 'High demand expected 6 PM–9 PM — extend your store hours?', time: 'Yesterday', read: true },
  { id: 'n5', type: 'order', title: 'Order cancelled — SPT-4362', body: 'Tinashe B. cancelled before you accepted · $18.00', time: '2 days ago', read: true },
]
