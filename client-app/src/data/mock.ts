export interface TicketTier {
  id: string
  name: string
  price: number
  description: string
  color: string
}

export interface Listing {
  id: number
  category: 'food' | 'groceries' | 'events' | 'experiences'
  type: string
  name: string
  cuisine: string
  rating: number
  reviewCount: number
  priceLevel: string
  distance: string
  address: string
  description: string
  image: string
  images: string[]
  tags: string[]
  features: string[]
  hours: string
  timeSlots?: string[]
  ticketTiers?: TicketTier[]
  eventDate?: string
  eventTime?: string
  pointsEarned: number
  eta: string
  popular: boolean
  price?: number
  menu?: MenuItem[]
}

export interface MenuItem {
  id: string
  name: string
  desc: string
  price: number
  image: string
}

export interface Review {
  id: number
  listingId: number
  user: string
  avatar: string
  rating: number
  date: string
  text: string
  verified: boolean
}

export interface Booking {
  id: string
  listingId: number
  listingName: string
  listingImage: string
  date: string
  time: string
  partySize: number
  confirmationCode: string
  points: number
  status: 'confirmed' | 'completed' | 'cancelled'
  type: string
  canReview?: boolean
}

export const currentUser = {
  name: 'Deon Matongo',
  firstName: 'Deon',
  email: 'deonmatongo@spotly.app',
  phone: '+263 77 234 5678',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
  initial: 'D',
  points: 1240,
  tier: 'Gold',
  nextTierPoints: 2000,
  memberSince: 'March 2024',
}

export const listings: Listing[] = [
  // ─── FOOD ───────────────────────────────────────────────
  {
    id: 1,
    category: 'food',
    type: 'restaurant',
    name: 'Amanzi Restaurant',
    cuisine: 'Zimbabwean Fusion · Fine Dining',
    rating: 4.8,
    reviewCount: 642,
    priceLevel: '$$$$',
    distance: '1.2 km',
    address: '225 Enterprise Road, Highlands, Harare',
    description: "Award-winning fine dining in the heart of Highlands. Amanzi celebrates Zimbabwe's finest ingredients — nyama, fresh bream, and vibrant garden produce — elevated with modern techniques and stunning lake-view terrace.",
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop'],
    tags: ['Fine Dining', 'Date Night', 'Lake View', 'Zimbabwean'],
    features: ['outdoor_seating', 'group_friendly'],
    hours: 'Mon–Sun: 12:00 PM – 11:00 PM',
    timeSlots: ['6:00 PM', '6:30 PM', '7:15 PM', '7:30 PM', '9:00 PM'],
    pointsEarned: 150,
    eta: '12 min',
    popular: true,
  },
  {
    id: 2,
    category: 'food',
    type: 'restaurant',
    name: 'The Braai Deck',
    cuisine: 'Southern African · Braai & Grills',
    rating: 4.6,
    reviewCount: 471,
    priceLevel: '$$',
    distance: '0.8 km',
    address: 'Borrowdale Village, Shop 14, Harare',
    description: "Harare's most beloved braai spot. Hand-cut boerewors, marinated t-bones, and peri-peri chicken grilled over open flame. Cold Zambezi on tap, live marimba on weekends.",
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=500&fit=crop'],
    tags: ['Braai', 'Outdoor', 'Group-Friendly', 'Casual'],
    features: ['outdoor_seating', 'delivery', 'group_friendly'],
    hours: 'Mon–Thu: 11 AM – 10 PM · Fri–Sun: 11 AM – 11 PM',
    timeSlots: ['5:30 PM', '6:00 PM', '6:45 PM', '8:00 PM', '8:30 PM'],
    pointsEarned: 80,
    eta: '20 min',
    popular: true,
    menu: [
      { id: 'm1', name: 'Boerewors & Pap', desc: 'Traditional beef sausage with sadza and relish', price: 18.00, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop' },
      { id: 'm2', name: 'Peri-Peri Chicken', desc: 'Whole spatchcock, flame-grilled, garlic butter', price: 22.50, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop' },
      { id: 'm3', name: 'Nyama Choma', desc: 'Slow-roasted goat ribs, chimichurri, roasted maize', price: 26.00, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 3,
    category: 'food',
    type: 'restaurant',
    name: "Gava's Kitchen",
    cuisine: 'Modern Zimbabwean · Farm-to-Table',
    rating: 4.7,
    reviewCount: 298,
    priceLevel: '$$$',
    distance: '1.5 km',
    address: '4 Newlands Shopping Centre, Newlands, Harare',
    description: "Chef Gava Muponda's celebrated bistro sources direct from smallholder farms around Harare. The menu changes with the harvest — expect sadza gnocchi, bream ceviche, and seasonal muriwo risotto.",
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=500&fit=crop'],
    tags: ['Farm-to-Table', 'Vegetarian-Friendly', 'Seasonal', 'Brunch'],
    features: ['outdoor_seating', 'delivery'],
    hours: 'Tue–Sun: 11:30 AM – 10:00 PM',
    timeSlots: ['12:00 PM', '12:30 PM', '7:00 PM', '7:30 PM', '8:15 PM'],
    pointsEarned: 100,
    eta: '18 min',
    popular: false,
  },
  {
    id: 13,
    category: 'food',
    type: 'restaurant',
    name: 'Café Nush',
    cuisine: 'Café · Coffee & Brunch',
    rating: 4.7,
    reviewCount: 512,
    priceLevel: '$$',
    distance: '0.6 km',
    address: 'Sam Levy\'s Village, Borrowdale, Harare',
    description: 'Harare\'s favourite all-day brunch spot. Specialty single-origin coffee, fluffy ricotta hotcakes, shakshuka, and a sun-drenched garden courtyard perfect for slow mornings.',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=500&fit=crop'],
    tags: ['Brunch', 'Coffee', 'Breakfast', 'Casual'],
    features: ['outdoor_seating', 'delivery'],
    hours: 'Mon–Sun: 7:00 AM – 5:00 PM',
    timeSlots: ['8:00 AM', '9:00 AM', '10:30 AM', '12:00 PM', '1:30 PM'],
    pointsEarned: 70,
    eta: '15 min',
    popular: true,
    menu: [
      { id: 'm4', name: 'Ricotta Hotcakes', desc: 'Stacked hotcakes, honeycomb butter, berries', price: 9.50, image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop' },
      { id: 'm5', name: 'Shakshuka', desc: 'Baked eggs, spiced tomato, feta, sourdough', price: 11.00, image: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=200&h=200&fit=crop' },
      { id: 'm6', name: 'Flat White', desc: 'Double-shot single origin, silky microfoam', price: 3.20, image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 14,
    category: 'food',
    type: 'restaurant',
    name: 'Saffron',
    cuisine: 'North Indian · Curry House',
    rating: 4.6,
    reviewCount: 389,
    priceLevel: '$$$',
    distance: '2.0 km',
    address: 'Avondale Shopping Centre, Harare',
    description: 'Authentic North Indian cooking from the tandoor. Slow-simmered butter chicken, smoky paneer tikka, and freshly baked naan — generous portions in a warm, spice-scented dining room.',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=500&fit=crop'],
    tags: ['Indian', 'Curry', 'Vegetarian-Friendly', 'Halal'],
    features: ['delivery', 'group_friendly'],
    hours: 'Tue–Sun: 12:00 PM – 10:30 PM',
    timeSlots: ['12:30 PM', '1:00 PM', '6:30 PM', '7:30 PM', '8:30 PM'],
    pointsEarned: 90,
    eta: '22 min',
    popular: true,
    menu: [
      { id: 'm7', name: 'Butter Chicken', desc: 'Tandoori chicken, silky tomato cream gravy', price: 14.00, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&h=200&fit=crop' },
      { id: 'm8', name: 'Paneer Tikka', desc: 'Char-grilled cottage cheese, mint chutney', price: 12.50, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=200&h=200&fit=crop' },
      { id: 'm9', name: 'Garlic Naan', desc: 'Tandoor-baked flatbread, roasted garlic, butter', price: 3.00, image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 15,
    category: 'food',
    type: 'restaurant',
    name: 'La Fontana',
    cuisine: 'Italian · Wood-Fired Pizza',
    rating: 4.8,
    reviewCount: 604,
    priceLevel: '$$$',
    distance: '1.7 km',
    address: 'Newlands Shopping Centre, Newlands, Harare',
    description: 'Naples-style wood-fired pizza with a 72-hour fermented dough, house-made pasta, and an all-Italian wine list. A Harare institution for date nights and family feasts alike.',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&h=500&fit=crop'],
    tags: ['Italian', 'Pizza', 'Pasta', 'Date Night'],
    features: ['outdoor_seating', 'delivery', 'group_friendly'],
    hours: 'Mon–Sun: 11:30 AM – 11:00 PM',
    timeSlots: ['12:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'],
    pointsEarned: 110,
    eta: '24 min',
    popular: true,
    menu: [
      { id: 'm10', name: 'Margherita', desc: 'San Marzano, fior di latte, basil, EVOO', price: 10.50, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop' },
      { id: 'm11', name: 'Tagliatelle Bolognese', desc: 'Fresh egg pasta, slow-cooked beef ragù', price: 13.00, image: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=200&h=200&fit=crop' },
      { id: 'm12', name: 'Tiramisù', desc: 'Mascarpone, espresso-soaked savoiardi, cocoa', price: 6.50, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 16,
    category: 'food',
    type: 'restaurant',
    name: 'Tokyo Lane',
    cuisine: 'Japanese · Sushi & Ramen',
    rating: 4.7,
    reviewCount: 276,
    priceLevel: '$$$',
    distance: '2.6 km',
    address: 'Chisipite Shopping Centre, Harare',
    description: 'Hand-rolled sushi, steaming bowls of tonkotsu ramen, and a sleek omakase counter. Fresh fish flown in weekly and a quietly excellent sake selection.',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=500&fit=crop'],
    tags: ['Japanese', 'Sushi', 'Ramen', 'Date Night'],
    features: ['delivery', 'group_friendly'],
    hours: 'Tue–Sun: 12:00 PM – 10:00 PM',
    timeSlots: ['12:30 PM', '1:30 PM', '6:30 PM', '7:30 PM', '8:30 PM'],
    pointsEarned: 100,
    eta: '26 min',
    popular: false,
    menu: [
      { id: 'm13', name: 'Salmon Nigiri (4pc)', desc: 'Fresh salmon over seasoned rice', price: 9.00, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop' },
      { id: 'm14', name: 'Tonkotsu Ramen', desc: '18-hour pork broth, chashu, soft egg', price: 13.50, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop' },
      { id: 'm15', name: 'Dragon Roll', desc: 'Eel, avocado, tempura prawn, unagi glaze', price: 12.00, image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=200&h=200&fit=crop' },
    ],
  },

  // ─── GROCERIES ──────────────────────────────────────────
  {
    id: 4,
    category: 'groceries',
    type: 'grocery',
    name: 'Harvest Basket',
    cuisine: 'Groceries · Fresh Produce',
    rating: 4.5,
    reviewCount: 237,
    priceLevel: '$$',
    distance: '0.5 km',
    address: "Sam Levy's Village, Borrowdale, Harare",
    description: 'Premium Zimbabwean groceries, organic Mazowe produce, and artisan pantry staples sourced from local farms — delivered in under 30 minutes across Harare.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=500&fit=crop'],
    tags: ['Organic', 'Local Produce', 'Express Delivery'],
    features: ['delivery'],
    hours: 'Mon–Sun: 7:00 AM – 9:00 PM',
    eta: '25 min',
    pointsEarned: 50,
    popular: true,
    menu: [
      { id: 'g1', name: 'Mazowe Oranges (2kg)', desc: 'Fresh-picked, sweet & juicy', price: 3.50, image: 'https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?w=200&h=200&fit=crop' },
      { id: 'g2', name: 'Freshly Baked Bread', desc: 'Locally milled flour, stone-baked daily', price: 2.80, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop' },
      { id: 'g3', name: 'Biltong Box (250g)', desc: 'Premium beef biltong, hand-cured', price: 12.00, image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 17,
    category: 'groceries',
    type: 'grocery',
    name: 'Greenwood Organics',
    cuisine: 'Groceries · Organic & Health',
    rating: 4.7,
    reviewCount: 184,
    priceLevel: '$$$',
    distance: '1.1 km',
    address: 'Highlands Shopping Centre, Harare',
    description: 'Certified organic produce, plant-based pantry staples, cold-pressed juices, and a dedicated wellness aisle. Everything sourced from regenerative farms within 100km of Harare.',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&h=500&fit=crop'],
    tags: ['Organic', 'Vegan', 'Health', 'Cold-Pressed'],
    features: ['delivery'],
    hours: 'Mon–Sun: 8:00 AM – 8:00 PM',
    eta: '20 min',
    pointsEarned: 60,
    popular: true,
    menu: [
      { id: 'g4', name: 'Organic Veg Box', desc: 'Seasonal mixed vegetables, 8–10 items', price: 14.00, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&fit=crop' },
      { id: 'g5', name: 'Cold-Pressed Green Juice', desc: 'Kale, cucumber, apple, ginger, lemon', price: 4.50, image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=200&h=200&fit=crop' },
      { id: 'g6', name: 'Raw Forest Honey (500g)', desc: 'Unfiltered, single-apiary Eastern Highlands', price: 8.50, image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 18,
    category: 'groceries',
    type: 'grocery',
    name: 'FreshMart Express',
    cuisine: 'Groceries · Everyday Essentials',
    rating: 4.4,
    reviewCount: 421,
    priceLevel: '$',
    distance: '0.4 km',
    address: 'Borrowdale Village, Shop 6, Harare',
    description: 'Your neighbourhood convenience store, online. Everyday essentials, household goods, snacks, and chilled drinks delivered to your door in as little as 15 minutes.',
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=500&fit=crop'],
    tags: ['Convenience', 'Express Delivery', 'Everyday', 'Budget'],
    features: ['delivery'],
    hours: 'Daily: 6:00 AM – 11:00 PM',
    eta: '15 min',
    pointsEarned: 40,
    popular: false,
    menu: [
      { id: 'g7', name: 'Full Cream Milk (2L)', desc: 'Fresh Dairibord, locally produced', price: 2.20, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop' },
      { id: 'g8', name: 'Free-Range Eggs (6)', desc: 'Farm-fresh, large grade', price: 2.00, image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200&h=200&fit=crop' },
      { id: 'g9', name: 'Mineral Water (6×500ml)', desc: 'Chilled spring water pack', price: 3.00, image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 19,
    category: 'groceries',
    type: 'grocery',
    name: 'The Butchery Co.',
    cuisine: 'Groceries · Butcher & Deli',
    rating: 4.8,
    reviewCount: 312,
    priceLevel: '$$$',
    distance: '1.4 km',
    address: 'Arundel Village, Mount Pleasant, Harare',
    description: 'Master butchers since 1998. Dry-aged steaks, hand-linked boerewors, free-range poultry, and a deli counter of artisan cheeses and charcuterie. Braai packs made to order.',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&h=500&fit=crop'],
    tags: ['Butcher', 'Braai', 'Deli', 'Premium'],
    features: ['delivery'],
    hours: 'Mon–Sat: 8:00 AM – 6:00 PM',
    eta: '25 min',
    pointsEarned: 70,
    popular: true,
    menu: [
      { id: 'g10', name: 'Dry-Aged Sirloin (500g)', desc: '28-day aged, grass-fed beef', price: 16.00, image: 'https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=200&h=200&fit=crop' },
      { id: 'g11', name: 'Braai Pack (Serves 4)', desc: 'Boerewors, lamb chops, chicken, marinade', price: 28.00, image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=200&h=200&fit=crop' },
      { id: 'g12', name: 'Charcuterie Board', desc: 'Cured meats, local cheeses, olives', price: 18.50, image: 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?w=200&h=200&fit=crop' },
    ],
  },

  // ─── EVENTS ─────────────────────────────────────────────
  {
    id: 5,
    category: 'events',
    type: 'event',
    name: 'Winky D Live in Concert',
    cuisine: 'Live Music · Zimdancehall',
    rating: 4.9,
    reviewCount: 312,
    priceLevel: '$$$',
    distance: '3.1 km',
    address: 'Harare International Conference Centre, Harare',
    description: "Zimbabwe's biggest Zimdancehall artist takes the stage for an unforgettable night. Winky D brings his full band, stunning visuals, and a setlist spanning his iconic career — from Disappear to Dread Noku Zvara.",
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop'],
    tags: ['Concert', 'Zimdancehall', 'Live Music', 'Harare'],
    features: ['group_friendly'],
    hours: 'Sat 5 Jul 2025',
    eventDate: 'Saturday, 5 July 2025',
    eventTime: '7:00 PM – 11:30 PM',
    ticketTiers: [
      { id: 't1', name: 'General Admission', price: 25, description: 'Standing floor access, general area', color: '#6B7280' },
      { id: 't2', name: 'VIP Seated', price: 75, description: 'Reserved seating, complimentary drink', color: '#B45309' },
      { id: 't3', name: 'Premium Lounge', price: 150, description: 'Exclusive lounge, open bar, meet & greet', color: '#15803D' },
    ],
    pointsEarned: 200,
    eta: 'Sat 5 Jul',
    popular: true,
  },
  {
    id: 6,
    category: 'events',
    type: 'event',
    name: 'Zimbabwe vs Zambia — AFCON Qualifier',
    cuisine: 'Sport · Football',
    rating: 4.8,
    reviewCount: 196,
    priceLevel: '$$',
    distance: '4.2 km',
    address: 'National Sports Stadium, Harare',
    description: "The Warriors take on Zambia in a crucial AFCON qualifier. Experience the electric atmosphere of 65,000 passionate fans as Zimbabwe fight for a place at the continental showpiece.",
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=500&fit=crop'],
    tags: ['Football', 'Warriors', 'AFCON', 'Sport'],
    features: ['group_friendly'],
    hours: 'Fri 11 Jul 2025',
    eventDate: 'Friday, 11 July 2025',
    eventTime: '3:00 PM Kick-off',
    ticketTiers: [
      { id: 't1', name: 'General Terrace', price: 10, description: 'Open terrace, general standing', color: '#6B7280' },
      { id: 't2', name: 'Covered Stand', price: 20, description: 'Covered seating, side view', color: '#1D4ED8' },
      { id: 't3', name: 'VIP Tribune', price: 50, description: 'Premium central seating, hospitality lounge', color: '#B45309' },
    ],
    pointsEarned: 80,
    eta: 'Fri 11 Jul',
    popular: true,
  },
  {
    id: 7,
    category: 'events',
    type: 'event',
    name: 'Bustop TV Comedy Night',
    cuisine: 'Comedy · Live Show',
    rating: 4.7,
    reviewCount: 143,
    priceLevel: '$$',
    distance: '1.8 km',
    address: 'SASA Comedy Club, Avondale, Harare',
    description: "Zimbabwe's hottest comedy platform brings its full cast to the stage. Expect two hours of gut-busting sketches, audience participation, and surprise celebrity guests.",
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop'],
    tags: ['Comedy', 'Live Show', 'Entertainment', 'Harare'],
    features: ['group_friendly'],
    hours: 'Sat 19 Jul 2025',
    eventDate: 'Saturday, 19 July 2025',
    eventTime: '7:00 PM – 9:30 PM',
    ticketTiers: [
      { id: 't1', name: 'Standard', price: 15, description: 'General seating, great view of the stage', color: '#6B7280' },
      { id: 't2', name: 'Front Row', price: 35, description: 'Premium front-row seats', color: '#7C3AED' },
    ],
    pointsEarned: 60,
    eta: 'Sat 19 Jul',
    popular: true,
  },
  {
    id: 8,
    category: 'events',
    type: 'event',
    name: 'TEDx Harare 2025',
    cuisine: 'Conference · Ideas',
    rating: 4.9,
    reviewCount: 88,
    priceLevel: '$$$',
    distance: '2.3 km',
    address: 'Meikles Hotel, Jason Moyo Ave, Harare',
    description: "This year's theme: \"Reimagining Zimbabwe\". 12 visionary speakers across tech, arts, and social enterprise. Networking lunch, workshop sessions, and the TEDx afterparty included with all tickets.",
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop'],
    tags: ['Conference', 'TED', 'Tech', 'Innovation', 'Networking'],
    features: ['group_friendly'],
    hours: 'Sat 26 Jul 2025',
    eventDate: 'Saturday, 26 July 2025',
    eventTime: '9:00 AM – 6:00 PM',
    ticketTiers: [
      { id: 't1', name: 'General', price: 45, description: 'Full day access, networking lunch included', color: '#6B7280' },
      { id: 't2', name: 'Professional', price: 90, description: 'Front seating, workshop sessions, afterparty', color: '#0369A1' },
      { id: 't3', name: 'Sponsor Pass', price: 200, description: 'All access, speaker meet & greet, brand exposure', color: '#B45309' },
    ],
    pointsEarned: 180,
    eta: 'Sat 26 Jul',
    popular: false,
  },
  {
    id: 9,
    category: 'events',
    type: 'event',
    name: 'Zimbabwe Craft Beer & Food Festival',
    cuisine: 'Festival · Food & Drink',
    rating: 4.6,
    reviewCount: 174,
    priceLevel: '$$',
    distance: '2.1 km',
    address: 'Borrowdale Racecourse Grounds, Harare',
    description: '30+ local craft breweries, artisan food vendors, and live acoustic sets across three stages. Sample everything from Zambezi Pale Ale to mopane-infused stouts. Free tasting glass with every ticket.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop'],
    tags: ['Festival', 'Craft Beer', 'Food', 'Outdoor', 'Live Music'],
    features: ['outdoor_seating', 'group_friendly'],
    hours: 'Sat–Sun 2–3 Aug 2025',
    eventDate: 'Saturday–Sunday, 2–3 August 2025',
    eventTime: '12:00 PM – 10:00 PM',
    ticketTiers: [
      { id: 't1', name: 'Day Pass', price: 18, description: 'Single day entry, tasting glass included', color: '#6B7280' },
      { id: 't2', name: 'Weekend Pass', price: 30, description: 'Both days access, tasting glass + 5 tokens', color: '#B45309' },
      { id: 't3', name: 'VIP Weekend', price: 65, description: 'Both days, VIP lounge, unlimited tastings, t-shirt', color: '#15803D' },
    ],
    pointsEarned: 90,
    eta: '2–3 Aug',
    popular: true,
  },
  {
    id: 10,
    category: 'events',
    type: 'event',
    name: 'Harare Jazz & Soul Festival',
    cuisine: 'Live Music · Jazz',
    rating: 4.9,
    reviewCount: 229,
    priceLevel: '$$$',
    distance: '3.4 km',
    address: 'Harare Gardens Amphitheatre, Harare',
    description: "Three nights of world-class jazz, Afro-soul, and R&B under the Harare sky. Featuring Zimbabwe's finest — Oliver Mtukudzi Tribute Band, Patience Musikavanhu, and international headliners.",
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop'],
    tags: ['Jazz', 'Soul', 'Afro', 'Festival', 'Outdoor', 'Date Night'],
    features: ['outdoor_seating', 'group_friendly'],
    hours: 'Fri–Sun 8–10 Aug 2025',
    eventDate: 'Friday–Sunday, 8–10 August 2025',
    eventTime: '6:00 PM – 11:30 PM',
    ticketTiers: [
      { id: 't1', name: 'General Admission', price: 35, description: 'Open lawn access, single night', color: '#6B7280' },
      { id: 't2', name: 'Festival Pass', price: 85, description: 'All 3 nights, reserved seating', color: '#7C3AED' },
      { id: 't3', name: 'Gold Circle', price: 160, description: '3 nights, gold circle seating, backstage tour, canapes', color: '#B45309' },
    ],
    pointsEarned: 250,
    eta: '8–10 Aug',
    popular: true,
  },
  {
    id: 11,
    category: 'events',
    type: 'event',
    name: 'Harare Fashion Week',
    cuisine: 'Fashion · Lifestyle',
    rating: 4.5,
    reviewCount: 94,
    priceLevel: '$$$',
    distance: '1.9 km',
    address: 'Crowne Plaza Hotel, Harare',
    description: '5 days of cutting-edge Zimbabwean fashion design. Daily runway shows featuring both established designers and rising stars, pop-up boutiques, styling workshops, and the coveted Gala Dinner.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop'],
    tags: ['Fashion', 'Runway', 'Lifestyle', 'Gala'],
    features: ['group_friendly'],
    hours: 'Mon–Fri 18–22 Aug 2025',
    eventDate: 'Monday–Friday, 18–22 August 2025',
    eventTime: 'Shows from 6:00 PM daily',
    ticketTiers: [
      { id: 't1', name: 'Show Ticket', price: 30, description: 'Single runway show, assigned seating', color: '#6B7280' },
      { id: 't2', name: 'Week Pass', price: 100, description: 'All 5 shows, front-row priority', color: '#BE185D' },
      { id: 't3', name: 'Gala Dinner', price: 250, description: 'Includes Gala Dinner, all shows, VIP lounge', color: '#B45309' },
    ],
    pointsEarned: 150,
    eta: '18–22 Aug',
    popular: false,
  },

  // ─── EXPERIENCES ────────────────────────────────────────
  {
    id: 12,
    category: 'experiences',
    type: 'experience',
    name: 'Msasa Wellness Studio',
    cuisine: 'Wellness · Spa & Float Therapy',
    rating: 4.8,
    reviewCount: 195,
    priceLevel: '$$$',
    distance: '2.4 km',
    address: '17 Msasa Park Drive, Msasa, Harare',
    description: "Harare's premier wellness destination. Choose from float therapy pods, hot stone massage, and guided meditation — all designed to restore balance in the heart of Msasa.",
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=500&fit=crop'],
    tags: ['Wellness', 'Spa', 'Meditation', 'Solo', 'Couples'],
    features: [],
    hours: 'Mon–Sun: 8:00 AM – 9:00 PM',
    timeSlots: ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '5:00 PM', '7:00 PM'],
    pointsEarned: 130,
    eta: 'Any day',
    popular: false,
    price: 65,
  },
  {
    id: 20,
    category: 'experiences',
    type: 'experience',
    name: 'Lake Chivero Sunset Cruise',
    cuisine: 'Adventure · Boat Cruise',
    rating: 4.8,
    reviewCount: 263,
    priceLevel: '$$$',
    distance: '32 km',
    address: 'Lake Chivero Recreational Park, Harare',
    description: 'A two-hour catamaran cruise across Lake Chivero timed for golden hour. Spot hippos and fish eagles, sip a sundowner from the open bar, and watch the sky catch fire over the water.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop'],
    tags: ['Sunset', 'Boat', 'Wildlife', 'Couples', 'Sundowner'],
    features: ['group_friendly'],
    hours: 'Daily: Departs 4:30 PM',
    timeSlots: ['4:30 PM'],
    pointsEarned: 150,
    eta: 'Daily 4:30 PM',
    popular: true,
    price: 55,
  },
  {
    id: 21,
    category: 'experiences',
    type: 'experience',
    name: 'Mbare Clay & Pottery Workshop',
    cuisine: 'Arts · Hands-On Class',
    rating: 4.7,
    reviewCount: 138,
    priceLevel: '$$',
    distance: '5.0 km',
    address: 'Mbare Art Studios, Harare',
    description: 'Get your hands dirty in a three-hour pottery class led by master ceramicist Tendai Gwa. Throw your own bowl on the wheel, glaze it, and take home a piece of Zimbabwe.',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=500&fit=crop'],
    tags: ['Arts', 'Workshop', 'Solo', 'Creative', 'Indoor'],
    features: ['group_friendly'],
    hours: 'Wed–Sun: Sessions 10 AM & 2 PM',
    timeSlots: ['10:00 AM', '2:00 PM'],
    pointsEarned: 90,
    eta: 'Wed–Sun',
    popular: false,
    price: 35,
  },
  {
    id: 22,
    category: 'experiences',
    type: 'experience',
    name: 'Balloon Safari Over Mazowe',
    cuisine: 'Adventure · Hot Air Balloon',
    rating: 4.9,
    reviewCount: 91,
    priceLevel: '$$$$',
    distance: '40 km',
    address: 'Mazowe Valley Launch Site, Mazowe',
    description: 'Float over the Mazowe Valley at sunrise in a hot air balloon, then touch down to a sparkling-wine breakfast in the bush. The most unforgettable way to see the highveld.',
    image: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800&h=500&fit=crop'],
    tags: ['Hot Air Balloon', 'Sunrise', 'Adventure', 'Bucket List', 'Couples'],
    features: ['group_friendly'],
    hours: 'Daily: Departs 5:30 AM',
    timeSlots: ['5:30 AM'],
    pointsEarned: 250,
    eta: 'Daily 5:30 AM',
    popular: true,
    price: 145,
  },
  {
    id: 23,
    category: 'experiences',
    type: 'experience',
    name: 'Domboshava Hike & Picnic',
    cuisine: 'Outdoors · Guided Hike',
    rating: 4.6,
    reviewCount: 207,
    priceLevel: '$$',
    distance: '27 km',
    address: 'Domboshava National Monument, Domboshava',
    description: 'A guided morning hike to the granite domes of Domboshava, with ancient San rock-art along the way and panoramic views from the summit. Finishes with a packed gourmet picnic.',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=500&fit=crop',
    images: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=500&fit=crop'],
    tags: ['Hiking', 'Nature', 'Picnic', 'Outdoor', 'Group-Friendly'],
    features: ['outdoor_seating', 'group_friendly'],
    hours: 'Sat–Sun: Departs 7:00 AM',
    timeSlots: ['7:00 AM'],
    pointsEarned: 80,
    eta: 'Weekends',
    popular: false,
    price: 30,
  },
]

export const reviews: Review[] = [
  { id: 1, listingId: 1, user: 'Farai Ncube', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face', rating: 5, date: 'June 2025', text: 'Amanzi never disappoints. The bream was cooked to perfection and the terrace at sunset is something truly special. Best fine dining in Harare.', verified: true },
  { id: 2, listingId: 1, user: 'Chiedza Mhuri', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face', rating: 4, date: 'May 2025', text: "One of the best evenings we've had in the city. The Zimbabwean fusion tasting menu was creative and the service was warm and attentive.", verified: true },
  { id: 3, listingId: 2, user: 'Munashe Dube', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face', rating: 5, date: 'June 2025', text: 'Best boerewors in Harare. The Braai Deck gets it right every time — smoky, perfectly seasoned, and the sadza is authentic. My whole family loves this place.', verified: true },
  { id: 4, listingId: 5, user: 'Tatenda Sibanda', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', rating: 5, date: 'Jun 2025', text: 'Winky D was absolutely electric. The Premium Lounge experience was worth every dollar — the meet & greet alone was unforgettable.', verified: true },
  { id: 5, listingId: 9, user: 'Rudo Chikwanda', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face', rating: 5, date: 'May 2025', text: 'The craft beer festival exceeded all expectations. So many incredible local breweries and the food was phenomenal. Got the Weekend Pass — worth every cent!', verified: true },
]

export interface Offer {
  id: string
  code: string
  title: string
  blurb: string
  detail: string
  category: 'food' | 'groceries' | 'events' | 'experiences' | 'all'
  discountType: 'percent' | 'flat' | 'shipping'
  amount: number // percent (0-100) or flat $ amount; 0 for shipping
  minSpend: number
  expires: string
  colors: [string, string]
  icon: string
}

export const offers: Offer[] = [
  { id: 'o1', code: 'FRESH20', title: '20% off groceries', blurb: 'First grocery delivery', detail: '20% off your first grocery order. Max discount $15.', category: 'groceries', discountType: 'percent', amount: 20, minSpend: 0, expires: 'Ends Sun, 29 Jun', colors: ['#0D1B2A', '#166534'], icon: 'bag-handle' },
  { id: 'o2', code: 'SPOTLY10', title: '$10 off any booking', blurb: 'Restaurants & experiences', detail: '$10 off when you spend $40 or more on dining or experiences.', category: 'all', discountType: 'flat', amount: 10, minSpend: 40, expires: 'Ends 5 Jul', colors: ['#15803D', '#16A34A'], icon: 'restaurant' },
  { id: 'o3', code: 'FREERIDE', title: 'Free delivery', blurb: 'No minimum spend', detail: 'Free delivery on your next 3 food or grocery orders.', category: 'food', discountType: 'shipping', amount: 0, minSpend: 0, expires: 'Ends 12 Jul', colors: ['#1D4ED8', '#2563EB'], icon: 'bicycle' },
  { id: 'o4', code: 'LIVE15', title: '15% off live events', blurb: 'Concerts & festivals', detail: '15% off event tickets. Excludes VIP tiers. Max discount $25.', category: 'events', discountType: 'percent', amount: 15, minSpend: 0, expires: 'Ends 1 Aug', colors: ['#6D28D9', '#7C3AED'], icon: 'ticket' },
  { id: 'o5', code: 'WELLNESS25', title: '$25 off wellness', blurb: 'Spa & retreats', detail: '$25 off any experience over $80. Treat yourself.', category: 'experiences', discountType: 'flat', amount: 25, minSpend: 80, expires: 'Ends 20 Jul', colors: ['#0E7490', '#0EA5E9'], icon: 'sparkles' },
]

export const upcomingBookings: Booking[] = [
  { id: 'b001', listingId: 5, listingName: 'Winky D Live in Concert', listingImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=240&fit=crop', date: 'Sat, 5 Jul 2025', time: '7:00 PM', partySize: 2, confirmationCode: 'SPT-7823', points: 200, status: 'confirmed', type: 'event' },
  { id: 'b002', listingId: 1, listingName: 'Amanzi Restaurant', listingImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=240&fit=crop', date: 'Sat, 12 Jul 2025', time: '7:30 PM', partySize: 4, confirmationCode: 'SPT-4401', points: 150, status: 'confirmed', type: 'restaurant' },
]

export const pastBookings: Booking[] = [
  { id: 'b003', listingId: 2, listingName: 'The Braai Deck', listingImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=240&fit=crop', date: 'Sat, 14 Jun 2025', time: '7:00 PM', partySize: 3, confirmationCode: 'SPT-2209', points: 80, status: 'completed', type: 'restaurant', canReview: true },
  { id: 'b004', listingId: 10, listingName: 'Harare Jazz & Soul Festival', listingImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=240&fit=crop', date: 'Fri, 24 May 2025', time: '6:00 PM', partySize: 2, confirmationCode: 'SPT-9934', points: 250, status: 'completed', type: 'event', canReview: false },
]
