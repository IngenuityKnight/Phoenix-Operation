const SCOTTSDALE_AIRBNB_ADDRESS = '6543 East 3rd Street, Scottsdale, AZ 85251'
const SCOTTSDALE_AIRBNB_COORDINATES = { lat: 33.4955, lng: -111.9141 }

export const TRIP_META = {
  title: 'Scottsdale Bachelor Weekend',
  subtitle: 'Wed 5/28 to Sat 5/31',
  commandName: 'Operation Scottsdale',
  airbnb: {
    name: 'Scottsdale Command House',
    url: null,
    manualUrl: null,
    location: SCOTTSDALE_AIRBNB_ADDRESS,
    checkIn: 'Check-in after 4:00 PM',
    checkOut: 'Check-out before 11:00 AM',
    gateNote: 'Confirm access details with host before departure.',
    parkingNote: 'Driveway + street parking available.',
    directionsNote: '6543 East 3rd Street, Scottsdale, AZ 85251',
    lockNote: null,
    wifiNetwork: null,
    wifiPassword: null,
    hostName: null,
    coHostName: null,
    guestSummary: '14 guests',
    confirmationCode: null,
    vehicleFee: null,
  },
}

export const MAP_POINTS = [
  {
    id: 'scottsdale-house',
    label: 'Command House',
    caption: 'Scottsdale, AZ',
    familyId: 'all',
    focusDay: 'all',
    tone: 'success',
    position: SCOTTSDALE_AIRBNB_COORDINATES,
  },
  {
    id: 'phx-airport',
    label: 'PHX',
    caption: 'Phoenix Sky Harbor',
    familyId: 'all',
    focusDay: 'wed',
    tone: 'info',
    position: { lat: 33.4373, lng: -112.0078 },
  },
  {
    id: 'old-town',
    label: 'Old Town',
    caption: 'Scottsdale Nightlife',
    familyId: 'all',
    focusDay: 'all',
    tone: 'warning',
    position: { lat: 33.4942, lng: -111.9261 },
  },
]

export const MAP_ROUTES = []

export const MAP_FACILITIES = [
  {
    id: 'phx',
    label: 'PHX Airport',
    caption: 'Main arrival point',
    category: 'logistics',
    position: { lat: 33.4373, lng: -112.0078 },
  },
  {
    id: 'sdl',
    label: 'SDL Airport',
    caption: 'Scottsdale Airport',
    category: 'logistics',
    position: { lat: 33.6229, lng: -111.9109 },
  },
  {
    id: 'old-town-scottsdale',
    label: 'Old Town',
    caption: 'Bars + Restaurants',
    category: 'activity',
    position: { lat: 33.4942, lng: -111.9261 },
  },
]

export const NAV_ITEMS = [
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'arrivals', label: 'Arrivals' },
  { id: 'map', label: 'Map' },
  { id: 'meals', label: 'Meals' },
  { id: 'logistics', label: 'Logistics' },
]

export const DAYS = [
  {
    id: 'wed',
    shortLabel: 'Wed 5/28',
    title: 'Arrivals Day',
    weather: 'Sunny',
    temperature: '98°F',
    caution: 'Low',
  },
  {
    id: 'thu',
    shortLabel: 'Thu 5/29',
    title: 'Pool + Day 1',
    weather: 'Sunny',
    temperature: '100°F',
    caution: 'Low',
  },
  {
    id: 'fri',
    shortLabel: 'Fri 5/30',
    title: 'Golf / Nightlife',
    weather: 'Sunny',
    temperature: '101°F',
    caution: 'Low',
  },
  {
    id: 'sat',
    shortLabel: 'Sat 5/31',
    title: 'Last Night / Fly Home',
    weather: 'Sunny',
    temperature: '99°F',
    caution: 'Low',
  },
]

export const TIME_SLOTS = ['00', '06', '12', '18']

// Legacy exports — kept for tripModel compatibility, not used by new Supabase panels
export const INITIAL_FAMILIES = []
export const ITINERARY_ROWS = [
  {
    id: 'activities',
    label: 'Main Ops',
    segments: [
      { id: 'wed-arrivals', start: 1.0, span: 3.0, color: 'critical', label: 'Arrivals + settle in' },
      { id: 'thu-pool', start: 4, span: 4, color: 'info', label: 'Pool day' },
      { id: 'fri-golf', start: 8, span: 4, color: 'warning', label: 'Golf / Nightlife' },
      { id: 'sat-last', start: 12, span: 3, color: 'success', label: 'Last night / fly home' },
    ],
  },
]
export const INITIAL_MEALS = []
export const INITIAL_EXPENSES = []
export const ACTIVITIES = [
  {
    id: 'wed-arrivals',
    title: 'Arrivals Day',
    status: 'Go',
    window: 'Wed / all day',
    description: '14 guys arriving from various cities. PHX is the main hub. House opens at 4 PM.',
    backup: 'Coordinate airport pickups if needed.',
  },
  {
    id: 'thu-pool',
    title: 'Pool Day',
    status: 'Go',
    window: 'Thu / all day',
    description: 'Full pool day at the house. Activities TBD.',
    backup: 'TBD',
  },
  {
    id: 'fri-golf',
    title: 'Golf + Nightlife',
    status: 'TBD',
    window: 'Fri / all day',
    description: 'Golf in the morning, nightlife in Old Town Scottsdale.',
    backup: 'TBD',
  },
  {
    id: 'sat-last',
    title: 'Last Night / Fly Home',
    status: 'TBD',
    window: 'Sat',
    description: 'Final day. Flights TBD. Checkout by 11 AM.',
    backup: 'Pre-pack Friday night.',
  },
]
export const STAY_DETAILS = {
  commandSummary: '6543 East 3rd Street, Scottsdale, AZ 85251. 14 guests.',
  houseOps: [
    'Confirm check-in access with host before departure.',
    'Stage sleeping assignments before first arrival.',
    'Confirm pool/amenity access.',
    'Pre-pack departure gear Friday night.',
  ],
  rooms: [],
}
export const INITIAL_NOTES = {
  itinerary: 'Activities TBD. Use the Itinerary section to plan.',
  stay: 'Confirm airbnb access before wheels-up.',
  meals: 'Meals TBD — plan before departure.',
  activities: 'Golf, pool, and Old Town Scottsdale nightlife are the main anchors.',
  expenses: 'Track shared costs before the trip.',
  families: '14 guys from various cities. See Arrivals for details.',
}
