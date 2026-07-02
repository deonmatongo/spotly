// Job shapes mirror what the customer app produces (see client-app CourierScreen
// and checkout flow) so a future shared backend can hand these off without a
// reshape. `ref` matches the customer-facing "SPT-####" code.
export type JobType = 'courier' | 'food' | 'groceries'
export type JobStatus = 'available' | 'accepted' | 'picked_up' | 'en_route' | 'delivered' | 'declined'
export type DropoffMode = 'leave_at_door' | 'meet_at_door' | 'curbside'

export interface Coord {
  lat: number
  lng: number
}

export interface JobStop {
  address: string
  detail: string
  customerName: string
  coord?: Coord
}

export interface GroceryItem {
  id: string
  name: string
  qty: number
  subs: string[]
}

export interface DeliveryJob {
  id: string
  type: JobType
  ref: string
  vendorName: string
  pickup: string
  pickupDetail: string
  dropoff: string
  dropoffDetail: string
  customerName: string
  customerPhone: string
  itemsSummary: string
  distance: string
  estMinutes: number
  payout: number
  tip: number
  status: JobStatus
  requestedAt: string
  orderCode: string
  dropoffMode: DropoffMode
  pickupCoord: Coord
  dropoffCoord: Coord
  requiresPin?: boolean
  pin?: string
  surge?: number // payout multiplier already applied, shown for transparency (e.g. 1.3)
  boost?: number // flat promo bonus included in payout
  extraStops?: JobStop[] // stacked orders: additional drop-offs after the primary one
  groceryItems?: GroceryItem[] // Shop & Deliver: what the driver picks in-store
}

// The rider name customers see mid-delivery on the client app — this mock
// driver is that same rider, logged into their own app.
export const currentDriver = {
  name: 'Tatenda Moyo',
  firstName: 'Tatenda',
  email: 'tatenda.moyo@spotly.app',
  phone: '+263 77 812 3456',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  initial: 'T',
  rating: 4.9,
  totalTrips: 1284,
  memberSince: 'January 2024',
  vehicle: {
    type: 'car' as 'car' | 'motorcycle' | 'bicycle' | 'walking',
    make: 'Toyota Vitz',
    color: 'Silver',
    plate: 'AEK 4521',
  },
  lastSelfieCheck: 'Today, 6:42 AM',
}

export const availableJobs: DeliveryJob[] = [
  {
    id: 'j1',
    type: 'courier',
    ref: 'SPT-7823',
    vendorName: 'Package pickup',
    pickup: '12 Fife Avenue, Harare',
    pickupDetail: 'Reception desk, ask for Farai',
    dropoff: 'Sam Levy\'s Village, Borrowdale',
    dropoffDetail: 'Leave with security if unavailable',
    customerName: 'Farai Ncube',
    customerPhone: '+263 77 234 5678',
    itemsSummary: 'Small package · documents',
    distance: '4.2 km',
    estMinutes: 14,
    payout: 5.20,
    tip: 0,
    status: 'available',
    requestedAt: '2 min ago',
    orderCode: 'CN-812',
    dropoffMode: 'meet_at_door',
    pickupCoord: { lat: -17.8236, lng: 31.0448 },
    dropoffCoord: { lat: -17.7546, lng: 31.0879 },
    requiresPin: true,
    pin: '4127',
  },
  {
    id: 'j2',
    type: 'food',
    ref: 'SPT-4401',
    vendorName: 'Amanzi Restaurant',
    pickup: '225 Enterprise Road, Highlands',
    pickupDetail: 'Order ready at the side window — bring insulated bag',
    dropoff: '14 Harrow Road, Msasa',
    dropoffDetail: 'Blue gate, unit 3',
    customerName: 'Chiedza Mhuri',
    customerPhone: '+263 77 991 2233',
    itemsSummary: '2 orders · Amanzi Restaurant',
    distance: '5.4 km',
    estMinutes: 19,
    payout: 9.90,
    tip: 1.50,
    status: 'available',
    requestedAt: '4 min ago',
    orderCode: 'A-118',
    dropoffMode: 'leave_at_door',
    pickupCoord: { lat: -17.7900, lng: 31.1000 },
    dropoffCoord: { lat: -17.8450, lng: 31.1150 },
    surge: 1.2,
    extraStops: [
      { address: '2 Glenara Court, Msasa', detail: 'Ring flat 4 on the intercom', customerName: 'Tapiwa Gonzo', coord: { lat: -17.8380, lng: 31.1080 } },
    ],
  },
  {
    id: 'j3',
    type: 'groceries',
    ref: 'SPT-2209',
    vendorName: 'Harvest Basket',
    pickup: 'Sam Levy\'s Village, Borrowdale',
    pickupDetail: 'Shop & Deliver — pay with your Spotly Plus Card',
    dropoff: '31 Glenara Avenue, Chisipite',
    dropoffDetail: 'Ring the bell twice',
    customerName: 'Munashe Dube',
    customerPhone: '+263 78 445 6620',
    itemsSummary: '5 items · Harvest Basket',
    distance: '5.6 km',
    estMinutes: 24,
    payout: 8.90,
    tip: 0,
    status: 'available',
    requestedAt: '6 min ago',
    orderCode: 'H-902',
    dropoffMode: 'curbside',
    pickupCoord: { lat: -17.7546, lng: 31.0879 },
    dropoffCoord: { lat: -17.7626, lng: 31.1076 },
    boost: 1.50,
    groceryItems: [
      { id: 'g1', name: 'Full cream milk 2L', qty: 1, subs: ['Low-fat milk 2L', 'Full cream milk 2×1L'] },
      { id: 'g2', name: 'Free-range eggs (dozen)', qty: 1, subs: ['Free-range eggs (6-pack) ×2'] },
      { id: 'g3', name: 'Mazowe oranges 2kg', qty: 1, subs: ['Naartjies 2kg', 'Orange juice 2L'] },
      { id: 'g4', name: 'Stone-baked bread', qty: 2, subs: ['Whole-wheat loaf'] },
      { id: 'g5', name: 'Raw forest honey 500g', qty: 1, subs: ['Golden syrup 500g'] },
    ],
  },
]

// Offers that arrive live: one pinged while browsing (incoming) and one pinged
// near the end of an active trip (back-to-back queue).
export const offerPool: DeliveryJob[] = [
  {
    id: 'j4',
    type: 'food',
    ref: 'SPT-5517',
    vendorName: 'La Fontana',
    pickup: 'Newlands Shopping Centre',
    pickupDetail: 'Counter pickup — quote order code',
    dropoff: '8 Cambridge Ave, Newlands',
    dropoffDetail: 'White wall, black gate',
    customerName: 'Rudo Chikwanda',
    customerPhone: '+263 77 320 9911',
    itemsSummary: '3 items · La Fontana',
    distance: '2.8 km',
    estMinutes: 12,
    payout: 7.60,
    tip: 2.00,
    status: 'available',
    requestedAt: 'Just now',
    orderCode: 'LF-334',
    dropoffMode: 'meet_at_door',
    pickupCoord: { lat: -17.8030, lng: 31.0780 },
    dropoffCoord: { lat: -17.8000, lng: 31.0850 },
    surge: 1.4,
  },
  {
    id: 'j5',
    type: 'courier',
    ref: 'SPT-6640',
    vendorName: 'Package pickup',
    pickup: 'Arundel Village, Mount Pleasant',
    pickupDetail: 'Kiosk 3, parcel under ref 6640',
    dropoff: '19 Pendennis Road, Mount Pleasant',
    dropoffDetail: 'Office hours only',
    customerName: 'Kuda Mhaka',
    customerPhone: '+263 78 210 4455',
    itemsSummary: 'Medium package · 4kg',
    distance: '1.9 km',
    estMinutes: 9,
    payout: 4.80,
    tip: 0,
    status: 'available',
    requestedAt: 'Just now',
    orderCode: 'CN-640',
    dropoffMode: 'meet_at_door',
    pickupCoord: { lat: -17.7660, lng: 31.0330 },
    dropoffCoord: { lat: -17.7600, lng: 31.0400 },
  },
]

export interface EarningsDay {
  label: string
  amount: number
  trips: number
}

export const weeklyEarnings: EarningsDay[] = [
  { label: 'Mon', amount: 28.40, trips: 5 },
  { label: 'Tue', amount: 34.10, trips: 6 },
  { label: 'Wed', amount: 19.60, trips: 3 },
  { label: 'Thu', amount: 41.30, trips: 7 },
  { label: 'Fri', amount: 52.90, trips: 9 },
  { label: 'Sat', amount: 61.20, trips: 11 },
  { label: 'Sun', amount: 22.00, trips: 4 },
]

export const earningsSummary = {
  today: { amount: 22.00, trips: 4, onlineHours: 3.4 },
  week: { amount: weeklyEarnings.reduce((sum, d) => sum + d.amount, 0), trips: weeklyEarnings.reduce((sum, d) => sum + d.trips, 0) },
  pendingPayout: 259.50,
  nextPayoutDate: 'Fri, 4 Jul',
  cashOutFee: 0.85,
  maxCashOutsPerDay: 6,
}

export interface FareBreakdown {
  id: string
  vendorName: string
  route: string
  completedAt: string
  base: number
  surgeAmt: number
  boost: number
  tip: number
}

export const earningsHistory: FareBreakdown[] = [
  { id: 'h1', vendorName: 'The Braai Deck', route: 'Borrowdale → Highlands', completedAt: 'Today, 1:12 PM', base: 5.10, surgeAmt: 1.02, boost: 0, tip: 1.00 },
  { id: 'h2', vendorName: 'Harvest Basket', route: 'Borrowdale → Chisipite', completedAt: 'Today, 11:48 AM', base: 6.40, surgeAmt: 0, boost: 1.50, tip: 0 },
  { id: 'h3', vendorName: 'Café Nush', route: 'Sam Levy\'s → Mount Pleasant', completedAt: 'Today, 9:20 AM', base: 4.30, surgeAmt: 0, boost: 0, tip: 2.68 },
]

// Predicted demand across the day — drives the Earnings trends chart.
export const demandForecast = [
  { hour: '6a', level: 0.15 }, { hour: '8a', level: 0.45 }, { hour: '10a', level: 0.3 },
  { hour: '12p', level: 0.85 }, { hour: '2p', level: 0.5 }, { hour: '4p', level: 0.4 },
  { hour: '6p', level: 0.95 }, { hour: '8p', level: 1.0 }, { hour: '10p', level: 0.6 },
]
export const peakWindow = '6:00 PM – 9:00 PM'

export interface Quest {
  id: string
  title: string
  desc: string
  progress: number
  target: number
  reward: number
  expires: string
  joined: boolean
}

export const quests: Quest[] = [
  { id: 'q1', title: 'Evening rush', desc: 'Complete 10 deliveries tonight between 5 PM and 10 PM.', progress: 4, target: 10, reward: 30, expires: 'Ends tonight', joined: true },
  { id: 'q2', title: 'Weekend warrior', desc: 'Complete 25 deliveries Friday through Sunday.', progress: 9, target: 25, reward: 55, expires: 'Ends Sun', joined: true },
  { id: 'q3', title: 'Grocery specialist', desc: 'Complete 5 Shop & Deliver orders this week.', progress: 0, target: 5, reward: 20, expires: 'Ends Sun', joined: false },
]

// Percent-positioned overlays for the mock demand map.
export const surgeZones = [
  { id: 's1', label: '1.6×', top: '18%', left: '58%', size: 92 },
  { id: 's2', label: '1.3×', top: '48%', left: '22%', size: 74 },
  { id: 's3', label: '1.2×', top: '62%', left: '64%', size: 60 },
]

export const hotspots = [
  { id: 'hs1', name: 'Sam Levy\'s Village', orders: 12, top: '30%', left: '30%' },
  { id: 'hs2', name: 'Avondale strip', orders: 7, top: '70%', left: '44%' },
]

export const proStatus = {
  tier: 'Gold' as const,
  points: 620,
  nextTier: 'Platinum' as const,
  nextTierPoints: 1000,
  acceptanceRate: 92,
  satisfaction: 4.9,
  perks: [
    { id: 'p1', label: 'Fuel discounts at Total Energies', tier: 'Gold', unlocked: true },
    { id: 'p2', label: 'Priority support line', tier: 'Gold', unlocked: true },
    { id: 'p3', label: 'Free language courses', tier: 'Platinum', unlocked: false },
    { id: 'p4', label: 'Tuition coverage programme', tier: 'Diamond', unlocked: false },
  ],
}

export const plusCard = {
  last4: '4821',
  balance: 84.50,
}

export interface WalletDocument {
  id: string
  label: string
  status: 'verified' | 'expiring' | 'action_needed'
  expires: string
}

export const documentsWallet: WalletDocument[] = [
  { id: 'd1', label: "Driver's licence", status: 'verified', expires: 'Mar 2028' },
  { id: 'd2', label: 'Vehicle registration', status: 'verified', expires: 'Nov 2026' },
  { id: 'd3', label: 'Insurance policy', status: 'expiring', expires: '28 Jul 2026' },
  { id: 'd4', label: 'Background check', status: 'verified', expires: 'Jan 2027' },
]

export interface ChatMessage {
  id: string
  from: 'driver' | 'customer'
  text: string
  time: string
}

export const chatSeed: ChatMessage[] = [
  { id: 'c1', from: 'customer', text: 'Hi! The gate code is 2244 if you need it.', time: '2:31 PM' },
  { id: 'c2', from: 'driver', text: 'Thanks! On my way — about 8 minutes out.', time: '2:32 PM' },
]

export const chatQuickReplies = [
  "I've arrived 👋",
  'Running ~5 min late',
  'Which gate should I use?',
  'Your order is on the way',
]

// Turn-by-turn steps the mock navigator cycles through per trip phase.
export const navSteps: Record<'toPickup' | 'toDropoff', string[]> = {
  toPickup: [
    'Head north on Fife Avenue',
    'In 400 m, turn left onto Enterprise Road',
    'In 120 m, your pickup is on the right',
  ],
  toDropoff: [
    'Head east on Borrowdale Road',
    'In 800 m, keep left at the fork',
    'In 200 m, destination is on your left',
  ],
}
