// Fallback data for when API is not available
export const fallbackRoutes = [
  {
    id: 1,
    short_name: "1",
    name: "Route 1 - Bole to Piazza",
    color: "#1e40af",
    description: "Main route connecting Bole to Piazza via Meskel Square"
  },
  {
    id: 2,
    short_name: "2", 
    name: "Route 2 - CMC to Arat Kilo",
    color: "#16a34a",
    description: "Route from CMC to Arat Kilo via Mexico Square"
  },
  {
    id: 3,
    short_name: "3",
    name: "Route 3 - Kazanchis to Merkato", 
    color: "#f59e0b",
    description: "Busy route connecting Kazanchis to Merkato"
  },
  {
    id: 4,
    short_name: "4",
    name: "Route 4 - Bole to Airport",
    color: "#dc2626", 
    description: "Direct route from Bole to Addis Ababa Airport"
  },
  {
    id: 5,
    short_name: "5",
    name: "Route 5 - Piazza to Merkato",
    color: "#7c3aed",
    description: "Historic route through the city center"
  }
];

export const fallbackBuses = [
  {
    id: 1,
    route_id: 1,
    lat: "8.985",
    lng: "38.76", 
    heading: "45",
    speed: "25",
    occupancy: 15,
    vehicle_number: "AA001",
    next_stop: "Meskel Square",
    eta: "3 min"
  },
  {
    id: 2,
    route_id: 1,
    lat: "9.008",
    lng: "38.765",
    heading: "90", 
    speed: "20",
    occupancy: 22,
    vehicle_number: "AA002",
    next_stop: "Mexico Square",
    eta: "7 min"
  },
  {
    id: 3,
    route_id: 2,
    lat: "9.018",
    lng: "38.735",
    heading: "180",
    speed: "30",
    occupancy: 18,
    vehicle_number: "AA003", 
    next_stop: "Mexico Square",
    eta: "2 min"
  },
  {
    id: 4,
    route_id: 3,
    lat: "9.025",
    lng: "38.752",
    heading: "270",
    speed: "15",
    occupancy: 35,
    vehicle_number: "AA004",
    next_stop: "Mexico Square", 
    eta: "5 min"
  },
  {
    id: 5,
    route_id: 4,
    lat: "8.985",
    lng: "38.76",
    heading: "135",
    speed: "40",
    occupancy: 8,
    vehicle_number: "AA005",
    next_stop: "Addis Ababa Airport",
    eta: "12 min"
  },
  {
    id: 6,
    route_id: 5,
    lat: "9.035",
    lng: "38.752",
    heading: "225",
    speed: "18",
    occupancy: 28,
    vehicle_number: "AA006",
    next_stop: "Mexico Square",
    eta: "4 min"
  }
];

export const fallbackGeometries = [
  {
    route_id: 1,
    geometry: {
      type: "LineString",
      coordinates: [
        [38.76, 8.985],
        [38.765, 9.008],
        [38.77, 9.02],
        [38.775, 9.03]
      ]
    },
    color: "#1e40af"
  },
  {
    route_id: 2,
    geometry: {
      type: "LineString", 
      coordinates: [
        [38.735, 9.018],
        [38.74, 9.02],
        [38.745, 9.025],
        [38.75, 9.03]
      ]
    },
    color: "#16a34a"
  },
  {
    route_id: 3,
    geometry: {
      type: "LineString",
      coordinates: [
        [38.752, 9.025],
        [38.755, 9.03],
        [38.76, 9.035],
        [38.765, 9.04]
      ]
    },
    color: "#f59e0b"
  },
  {
    route_id: 4,
    geometry: {
      type: "LineString",
      coordinates: [
        [38.76, 8.985],
        [38.77, 8.99],
        [38.78, 8.995],
        [38.79, 9.0]
      ]
    },
    color: "#dc2626"
  },
  {
    route_id: 5,
    geometry: {
      type: "LineString",
      coordinates: [
        [38.752, 9.035],
        [38.755, 9.03],
        [38.76, 9.025],
        [38.765, 9.02]
      ]
    },
    color: "#7c3aed"
  }
];
