const STL_AIRBNB_ADDRESS = '2245 Jules St, St. Louis, MO 63104'
const STL_AIRBNB_COORDINATES = { lat: 38.6090, lng: -90.2388 }

export const TRIP_META = {
  title: 'St. Louis Family Weekend',
  subtitle: 'Sat 5/23 to Tue 5/26',
  commandName: 'Family Trip Command Center',
  airbnb: {
    name: 'Jules St Basecamp',
    url: null,
    manualUrl: null,
    location: STL_AIRBNB_ADDRESS,
    checkIn: 'Check-in after 4:00 PM',
    checkOut: 'Check-out before 11:00 AM',
    gateNote: 'Confirm access details with host before Saturday departure.',
    parkingNote: 'Street parking on Jules St.',
    directionsNote: '2245 Jules St, St. Louis, MO 63104',
    lockNote: null,
    wifiNetwork: null,
    wifiPassword: null,
    hostName: null,
    coHostName: null,
    guestSummary: null,
    confirmationCode: null,
    vehicleFee: null,
  },
}

export const MAP_POINTS = [
  {
    id: 'bwi',
    label: 'Burdens',
    caption: 'Baltimore / BWI',
    familyId: 'burdens',
    focusDay: 'sat',
    tone: 'warning',
    position: { lat: 39.1754, lng: -76.6685 },
  },
  {
    id: 'dtw',
    label: 'Harvey-Gardners',
    caption: 'Detroit / DTW',
    familyId: 'harvey-gardners',
    focusDay: 'sat',
    tone: 'critical',
    position: { lat: 42.2124, lng: -83.3534 },
  },
  {
    id: 'stl-airbnb',
    label: 'Basecamp',
    caption: 'St. Louis, MO',
    familyId: 'all',
    focusDay: 'all',
    tone: 'success',
    position: STL_AIRBNB_COORDINATES,
  },
  {
    id: 'stl-airport',
    label: 'STL Airport',
    caption: 'Lambert International',
    familyId: 'all',
    focusDay: 'sat',
    tone: 'muted',
    position: { lat: 38.7487, lng: -90.3700 },
  },
]

export const MAP_ROUTES = [
  {
    id: 'route-bwi-stl',
    familyId: 'burdens',
    focusDay: 'sat',
    tone: 'warning',
    dashed: true,
    path: [
      { lat: 39.1754, lng: -76.6685 },
      { lat: 39.1, lng: -83.0 },
      { lat: 38.7487, lng: -90.3700 },
    ],
  },
  {
    id: 'route-dtw-stl',
    familyId: 'harvey-gardners',
    focusDay: 'sat',
    tone: 'critical',
    dashed: true,
    path: [
      { lat: 42.2124, lng: -83.3534 },
      { lat: 40.8, lng: -86.8 },
      { lat: 38.7487, lng: -90.3700 },
    ],
  },
]

export const MAP_FACILITIES = [
  {
    id: 'stl-alamo',
    label: 'Alamo Rental',
    caption: 'Burdens car pickup',
    category: 'logistics',
    position: { lat: 38.7487, lng: -90.3700 },
  },
  {
    id: 'stl-jules',
    label: 'Jules St',
    caption: 'Basecamp',
    category: 'activity',
    position: STL_AIRBNB_COORDINATES,
  },
]

export const NAV_ITEMS = [
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'stay', label: 'Stay' },
  { id: 'meals', label: 'Meals' },
  { id: 'activities', label: 'Activities' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'families', label: 'Families' },
]

export const DAYS = [
  {
    id: 'sat',
    shortLabel: 'Sat 5/23',
    title: 'Fly In',
    weather: 'TBD',
    temperature: 'TBD',
    caution: 'Low',
  },
  {
    id: 'sun',
    shortLabel: 'Sun 5/24',
    title: 'St. Louis Day 1',
    weather: 'TBD',
    temperature: 'TBD',
    caution: 'Low',
  },
  {
    id: 'mon',
    shortLabel: 'Mon 5/25',
    title: 'St. Louis Day 2',
    weather: 'TBD',
    temperature: 'TBD',
    caution: 'Low',
  },
  {
    id: 'tue',
    shortLabel: 'Tue 5/26',
    title: 'Fly Home',
    weather: 'TBD',
    temperature: 'TBD',
    caution: 'Low',
  },
]

export const TIME_SLOTS = ['00', '06', '12', '18']

export const INITIAL_FAMILIES = [
  {
    id: 'burdens',
    name: 'Burdens',
    origin: 'Baltimore',
    shortOrigin: 'BWI',
    status: 'Transit',
    eta: 'Sat midday',
    driveTime: 'WN 1565',
    headcount: 'TBD',
    vehicle: 'Rental (Alamo)',
    responsibility: 'Car rental + navigation',
    readiness: 75,
    routeSummary: 'Southwest WN 1565 from BWI to STL. Alamo car rental pickup on arrival.',
    checklist: [
      { id: 'flight-checkin', label: 'Check in to WN 1565', done: false },
      { id: 'alamo-confirm', label: 'Alamo reservation confirmed', done: false },
      { id: 'pack-bags', label: 'Bags packed', done: false },
      { id: 'airbnb-access', label: 'Airbnb check-in details confirmed', done: false },
    ],
  },
  {
    id: 'harvey-gardners',
    name: 'Harvey-Gardners',
    origin: 'Detroit',
    shortOrigin: 'DTW',
    status: 'Transit',
    eta: 'Sat TBD',
    driveTime: 'TBD',
    headcount: 'TBD',
    vehicle: 'TBD',
    responsibility: 'TBD',
    readiness: 60,
    routeSummary: 'Flight from DTW to STL. Flight details TBD.',
    checklist: [
      { id: 'flight-confirm', label: 'Flight details confirmed', done: false },
      { id: 'pack-bags', label: 'Bags packed', done: false },
      { id: 'ground-transport', label: 'Ground transport from STL arranged', done: false },
      { id: 'airbnb-access', label: 'Airbnb check-in details confirmed', done: false },
    ],
  },
]

export const ITINERARY_ROWS = [
  {
    id: 'travel',
    label: 'Transit',
    segments: [
      { id: 'burdens-flight', familyId: 'burdens', start: 1.33, span: 0.42, color: 'warning', label: 'Burdens WN 1565' },
      { id: 'harvey-gardners-flight', familyId: 'harvey-gardners', start: 1.33, span: 0.42, color: 'critical', label: 'Harvey-Gardners fly in' },
    ],
  },
  {
    id: 'activities',
    label: 'Main Ops',
    segments: [
      { id: 'sat-arrival', start: 1.0, span: 3.0, color: 'critical', label: 'Fly in + check in' },
      { id: 'sun-day', start: 4, span: 4, color: 'info', label: 'St. Louis Day 1' },
      { id: 'mon-day', start: 8, span: 4, color: 'warning', label: 'St. Louis Day 2' },
      { id: 'tue-return', start: 13.0, span: 1.5, color: 'success', label: 'Fly home' },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    segments: [
      { id: 'airbnb-checkin', start: 2.67, span: 0.5, color: 'muted', label: 'Airbnb check-in' },
      { id: 'car-pickup', start: 1.75, span: 0.33, color: 'muted', label: 'Alamo pickup' },
    ],
  },
]

export const INITIAL_MEALS = [
  { id: 'sat-dinner', day: 'Saturday', meal: 'TBD — first night in STL', owner: 'TBD', status: 'TBD', note: 'Arrive Saturday, dinner TBD' },
  { id: 'sun-breakfast', day: 'Sunday', meal: 'TBD', owner: 'TBD', status: 'TBD', note: '' },
  { id: 'sun-lunch', day: 'Sunday', meal: 'TBD', owner: 'TBD', status: 'TBD', note: '' },
  { id: 'sun-dinner', day: 'Sunday', meal: 'TBD', owner: 'TBD', status: 'TBD', note: '' },
  { id: 'mon-breakfast', day: 'Monday', meal: 'TBD', owner: 'TBD', status: 'TBD', note: '' },
  { id: 'mon-lunch', day: 'Monday', meal: 'TBD', owner: 'TBD', status: 'TBD', note: '' },
  { id: 'mon-dinner', day: 'Monday', meal: 'TBD', owner: 'TBD', status: 'TBD', note: '' },
  { id: 'tue-breakfast', day: 'Tuesday', meal: 'TBD — pre-flight', owner: 'TBD', status: 'TBD', note: 'Fly home Tuesday' },
]

export const INITIAL_EXPENSES = [
  { id: 'airbnb', label: 'STL Airbnb', payer: 'TBD', amount: 0, split: 'Equal split', settled: false },
  { id: 'flights', label: 'Flights', payer: 'Each family', amount: 0, split: 'Individual', settled: true },
  { id: 'car-rental', label: 'Car rental (Alamo)', payer: 'Burdens', amount: 0, split: 'Shared', settled: false },
  { id: 'activities', label: 'Activities / entry fees', payer: 'Unassigned', amount: 0, split: 'Equal split', settled: false },
]

export const ACTIVITIES = [
  {
    id: 'sat-arrivals',
    title: 'Fly In + Check In',
    status: 'Go',
    window: 'Sat / all day',
    description: 'Both families fly into STL. Burdens on WN 1565 from BWI with Alamo car rental pickup. Harvey-Gardners from DTW. Check in to 2245 Jules St after 4 PM.',
    backup: 'If flights delayed, coordinate check-in timing and hold dinner loose.',
  },
  {
    id: 'sun-explore',
    title: 'St. Louis Day 1',
    status: 'TBD',
    window: 'Sun / all day',
    description: 'Activities TBD. St. Louis has strong options: City Museum, Forest Park, Gateway Arch, Soulard Market.',
    backup: 'TBD',
  },
  {
    id: 'mon-explore',
    title: 'St. Louis Day 2 — Memorial Day',
    status: 'TBD',
    window: 'Mon / all day',
    description: 'Memorial Day. Activity TBD — check what is open. Forest Park free attractions are a safe anchor.',
    backup: 'TBD',
  },
  {
    id: 'tue-departure',
    title: 'Fly Home',
    status: 'Go',
    window: 'Tue / morning',
    description: 'Pack, check out by 11 AM, drive to STL airport, depart.',
    backup: 'Pre-pack Monday night to reduce Tuesday morning chaos.',
  },
]

export const STAY_DETAILS = {
  commandSummary: 'Basecamp at 2245 Jules St, St. Louis, MO 63104.',
  houseOps: [
    'Confirm check-in access with host before Saturday departure.',
    'Stage sleeping assignments before first family arrival.',
    'Plan activities for Sunday and Monday.',
    'Pre-pack departure gear Monday night.',
  ],
  rooms: [
    { label: 'Room 1', assignment: 'Burdens' },
    { label: 'Room 2', assignment: 'Harvey-Gardners' },
  ],
}

export const INITIAL_NOTES = {
  itinerary: 'Both families fly in Saturday. Activities and meals for Sun / Mon are TBD.',
  stay: 'Confirm airbnb check-in access before wheels-up Saturday.',
  meals: 'Meals TBD — plan before departure.',
  activities: 'Sunday and Monday activities TBD. City Museum, Forest Park, and the Arch are strong anchors.',
  expenses: 'Airbnb and car rental are the main shared costs. Track before the trip.',
  families: 'Burdens on WN 1565 from BWI. Harvey-Gardners from DTW — flight details TBD.',
}
