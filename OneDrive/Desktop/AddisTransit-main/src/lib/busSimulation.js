// Bus simulation system that follows actual routes and stops

class BusSimulation {
  constructor() {
    this.buses = new Map();
    this.routes = [];
    this.isRunning = false;
    this.intervalId = null;
    this.updateInterval = 5000; // Update every 5 seconds
  }

  // Initialize the simulation with routes
  async initialize() {
    if (this.isRunning) return // Already initialized
    try {
      // Use the routes data directly instead of importing
      this.routes = [
        {
          id: "route-38",
          name: "Meskel Square to Piazza",
          shortName: "38",
          color: "#1e40af",
          type: "bus",
          description: "Addis Ababa City Bus",
          stops: [
            { id: "stop-1", name: "Meskel Square", lat: 9.0054, lng: 38.7636 },
            { id: "stop-2", name: "Piazza", lat: 9.0154, lng: 38.7736 },
            { id: "stop-3", name: "CMC Terminal", lat: 9.0254, lng: 38.7836 }
          ]
        },
        {
          id: "route-91",
          name: "Bole to Kazanchis",
          shortName: "91",
          color: "#f59e0b",
          type: "bus",
          description: "Addis Ababa City Bus",
          stops: [
            { id: "stop-4", name: "Bole Airport", lat: 8.9954, lng: 38.7536 },
            { id: "stop-5", name: "Kazanchis", lat: 9.0054, lng: 38.7436 }
          ]
        },
        {
          id: "route-12",
          name: "Merkato to Arat Kilo",
          shortName: "12",
          color: "#16a34a",
          type: "bus",
          description: "Addis Ababa City Bus",
          stops: [
            { id: "stop-6", name: "Merkato", lat: 8.9854, lng: 38.7236 },
            { id: "stop-7", name: "Arat Kilo", lat: 9.0154, lng: 38.7536 }
          ]
        },
        {
          id: "route-23",
          name: "Current Location",
          shortName: "23",
          color: "#dc2626",
          type: "bus",
          description: "Addis Ababa City Bus",
          stops: [
            { id: "stop-8", name: "Current Location", lat: 9.0054, lng: 38.7636 },
            { id: "stop-9", name: "National Theatre", lat: 9.0054, lng: 38.7436 }
          ]
        },
        {
          id: "route-07",
          name: "CMC to Bole",
          shortName: "07",
          color: "#8b5cf6",
          type: "bus",
          description: "Addis Ababa City Bus",
          stops: [
            { id: "stop-10", name: "CMC", lat: 9.0300, lng: 38.8000 },
            { id: "stop-11", name: "Bole", lat: 8.9990, lng: 38.7800 }
          ]
        },
        {
          id: "route-35",
          name: "Piazza to Mexico",
          shortName: "35",
          color: "#0ea5e9",
          type: "bus",
          description: "Addis Ababa City Bus",
          stops: [
            { id: "stop-12", name: "Piazza", lat: 9.0154, lng: 38.7736 },
            { id: "stop-13", name: "Mexico Square", lat: 9.0085, lng: 38.7460 }
          ]
        }
      ];
      this.createBuses();
      this.start();
    } catch (error) {
      console.error('Failed to initialize bus simulation:', error);
    }
  }

  // Create buses for each route
  createBuses() {
    this.routes.forEach(route => {
      if (route.stops && route.stops.length >= 2) {
        // Create 2-3 buses per route
        const busCount = Math.floor(Math.random() * 2) + 2; // 2-3 buses
        
        for (let i = 1; i <= busCount; i++) {
          const busId = `bus-${route.shortName}-${i}`;
          const bus = this.createBus(busId, route, i);
          this.buses.set(busId, bus);
        }
      }
    });
  }

  // Create a single bus
  createBus(busId, route, busNumber) {
    const stops = route.stops;
    const startStopIndex = Math.floor(Math.random() * stops.length);
    const startStop = stops[startStopIndex];
    
    return {
      id: busId,
      routeId: route.id,
      vehicleNumber: `${route.shortName}${busNumber.toString().padStart(2, '0')}`,
      driver: this.getRandomDriver(),
      operator: this.getRandomOperator(),
      busType: this.getRandomBusType(),
      mengedCompatible: Math.random() > 0.3, // ~70% compatible
      lat: startStop.lat,
      lng: startStop.lng,
      heading: 0,
      speed: 0,
      capacity: 40,
      occupancy: Math.floor(Math.random() * 40),
      currentStopIndex: startStopIndex,
      nextStopIndex: (startStopIndex + 1) % stops.length,
      nextStop: stops[(startStopIndex + 1) % stops.length].name,
      eta: this.calculateETA(stops[startStopIndex], stops[(startStopIndex + 1) % stops.length]),
      lastUpdated: new Date(),
      isMoving: false,
      progress: 0, // 0-1 progress between stops
      route: route
    };
  }

  // Get random Ethiopian driver name
  getRandomDriver() {
    const firstNames = ['Alemayehu', 'Meron', 'Tigist', 'Yonas', 'Eleni', 'Dawit', 'Kebede', 'Selam', 'Abebe', 'Mulu', 'Tewodros', 'Hirut'];
    const lastNames = ['Tesfaye', 'Kebede', 'Assefa', 'Mengistu', 'Tadesse', 'Girma', 'Hailu', 'Worku', 'Getachew', 'Bekele'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  }

  // Random operator
  getRandomOperator() {
    const operators = ['Anbessa', 'Sheger', 'Velocity']
    return operators[Math.floor(Math.random() * operators.length)]
  }

  // Random bus type (could be same as operator branding)
  getRandomBusType() {
    const types = ['Standard', 'Articulated', 'Mini']
    return types[Math.floor(Math.random() * types.length)]
  }

  // Calculate ETA between two stops
  calculateETA(fromStop, toStop) {
    const distance = this.calculateDistance(fromStop.lat, fromStop.lng, toStop.lat, toStop.lng);
    const speed = 15 + Math.random() * 10; // 15-25 km/h average bus speed
    const timeMinutes = Math.round((distance / speed) * 60);
    return `${timeMinutes} min`;
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Start the simulation
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.updateBuses();
    }, this.updateInterval);
    
    console.log('Bus simulation started');
  }

  // Stop the simulation
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Bus simulation stopped');
  }

  // Update all buses
  updateBuses() {
    this.buses.forEach(bus => {
      this.updateBus(bus);
    });
  }

  // Update a single bus
  updateBus(bus) {
    const route = bus.route;
    const stops = route.stops;
    
    if (stops.length < 2) return;

    const currentStop = stops[bus.currentStopIndex];
    const nextStop = stops[bus.nextStopIndex];

    // Calculate distance to next stop
    const distanceToNext = this.calculateDistance(
      bus.lat, bus.lng, 
      nextStop.lat, nextStop.lng
    );

    // If very close to next stop, move to it
    if (distanceToNext < 0.01) { // ~100m threshold
      this.arriveAtStop(bus);
    } else {
      // Move towards next stop
      this.moveTowardsStop(bus, nextStop);
    }

    // Update last updated time
    bus.lastUpdated = new Date();
  }

  // Move bus towards next stop
  moveTowardsStop(bus, nextStop) {
    // Ensure clearly visible movement every 5s tick
    const speed = 0.00035 + Math.random() * 0.00045; // ~0.00035-0.0008 deg per update
    
    // Calculate direction
    const latDiff = nextStop.lat - bus.lat;
    const lngDiff = nextStop.lng - bus.lng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    if (distance > 0) {
      // Move towards next stop
      bus.lat += (latDiff / distance) * speed;
      bus.lng += (lngDiff / distance) * speed;
      
      // Update heading
      bus.heading = Math.atan2(lngDiff, latDiff) * 180 / Math.PI;
      
      // Update speed (km/h)
      bus.speed = Math.max(10, Math.round(speed * 111000)); // Rough conversion to km/h
      bus.isMoving = true;
      
      // Update progress
      const currentStop = bus.route.stops[bus.currentStopIndex]
      const totalDistance = this.calculateDistance(
        currentStop.lat,
        currentStop.lng,
        nextStop.lat,
        nextStop.lng
      );
      const remainingDistance = this.calculateDistance(
        bus.lat,
        bus.lng,
        nextStop.lat,
        nextStop.lng
      );
      bus.progress = totalDistance > 0 ? Math.min(1, (totalDistance - remainingDistance) / totalDistance) : 0;
    }
  }

  // Bus arrives at a stop
  arriveAtStop(bus) {
    const route = bus.route;
    const stops = route.stops;
    
    // Move to next stop
    bus.currentStopIndex = bus.nextStopIndex;
    bus.nextStopIndex = (bus.nextStopIndex + 1) % stops.length;
    
    // Update position to exact stop location
    const currentStop = stops[bus.currentStopIndex];
    bus.lat = currentStop.lat;
    bus.lng = currentStop.lng;
    
    // Update next stop info
    const nextStop = stops[bus.nextStopIndex];
    bus.nextStop = nextStop.name;
    bus.eta = this.calculateETA(currentStop, nextStop);
    
    // Reset progress
    bus.progress = 0;
    bus.speed = 0;
    bus.isMoving = false;
    
    // Randomly change occupancy
    bus.occupancy = Math.floor(Math.random() * bus.capacity);
    
    console.log(`Bus ${bus.vehicleNumber} arrived at ${currentStop.name}, next: ${nextStop.name}`);
  }

  // Get all buses as array
  getBuses() {
    return Array.from(this.buses.values());
  }

  // Get buses for a specific route
  getBusesForRoute(routeId) {
    return this.getBuses().filter(bus => bus.routeId === routeId);
  }

  // Get bus by ID
  getBus(busId) {
    return this.buses.get(busId);
  }

  // Add a new bus to a route
  addBus(routeId) {
    const route = this.routes.find(r => r.id === routeId);
    if (!route) return null;

    const busNumber = this.getBusesForRoute(routeId).length + 1;
    const busId = `bus-${route.shortName}-${busNumber}`;
    const bus = this.createBus(busId, route, busNumber);
    
    this.buses.set(busId, bus);
    return bus;
  }

  // Remove a bus
  removeBus(busId) {
    return this.buses.delete(busId);
  }

  // Get simulation status
  getStatus() {
    return {
      isRunning: this.isRunning,
      busCount: this.buses.size,
      routes: this.routes.length,
      lastUpdate: new Date()
    };
  }
}

// Create singleton instance
const busSimulation = new BusSimulation();

export default busSimulation;
