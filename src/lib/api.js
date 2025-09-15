const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
console.log('API URL:', API);

const safeFetch = async (path, options = {}, retries = 5) => {
  const baseUrl = API;
  console.log(`API call: ${baseUrl}${path}`);
  
  for (let i = 0; i < retries; i++) {
    try {
      const headers = new Headers(options.headers || {});
      try {
        const token = localStorage.getItem('admin_token');
        if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      } catch {}
      const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
      if (!res.ok) {
        // Try to extract server error details
        let serverError = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          if (errBody && (errBody.error || errBody.message)) {
            serverError = `${serverError}: ${errBody.error || errBody.message}`;
          }
        } catch {}
        const err = new Error(serverError);
        if (res.status >= 400 && res.status < 500) {
          throw err; // immediate fail for 4xx
        }
        throw err; // will be caught and potentially retried
      }
      const data = await res.json();
      console.log(`API response for ${path}:`, data);
      return data;
    } catch (error) {
      console.log(`API call failed (attempt ${i + 1}/${retries}):`, error.message);
      // If it's a 4xx client error, don't retry
      const m = /^HTTP\s+(\d{3})$/.exec(String(error.message || ''));
      if (m) {
        const code = Number(m[1]);
        if (code >= 400 && code < 500) {
          throw error;
        }
      }
      if (i === retries - 1) {
        console.error(`All ${retries} attempts failed for ${path}`);
        throw error;
      }
      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, i) + Math.random() * 1000, 10000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export const fetchRoutes = () => safeFetch('/routes');
export const fetchRoute = (id) => safeFetch(`/routes/${id}`);
export const fetchStopsForRoute = (routeId) => safeFetch(`/routes/${routeId}`);
export const fetchAlerts = () => safeFetch('/alerts');
export const planTrip = (body) => safeFetch('/trip/plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
export const submitFeedback = (body) => safeFetch('/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
export const fetchNearbyStops = (lat, lng, radius = 1000) => safeFetch(`/stops/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);


export const fetchBuses = (routeId) => {
  const q = routeId ? `?routeId=${routeId}` : '';
  return safeFetch(`/buses${q}`);
};

import busSimulation from './busSimulation.js';

// Ethiopian transit data - realistic simulation following routes
export const fetchEthiopianBuses = async () => {
  // Initialize simulation if not already running
  if (!busSimulation.isRunning) {
    await busSimulation.initialize();
  }
  
  // Return current bus positions
  return busSimulation.getBuses();
};

// Get buses for a specific route
export const fetchBusesForRoute = async (routeId) => {
  if (!busSimulation.isRunning) {
    await busSimulation.initialize();
  }
  
  return busSimulation.getBusesForRoute(routeId);
};

// Get simulation status
export const getSimulationStatus = () => {
  return busSimulation.getStatus();
};

// Add a new bus to a route
export const addBusToRoute = async (routeId) => {
  if (!busSimulation.isRunning) {
    await busSimulation.initialize();
  }
  
  return busSimulation.addBus(routeId);
};

// Remove a bus
export const removeBus = (busId) => {
  return busSimulation.removeBus(busId);
};

export const fetchRoutesWithStops = async () => {
  const routes = await fetchRoutes();
  const results = [];
  for (const r of routes) {
    try {
      // Backend /routes/{id} already includes stops
      const routeWithStops = await fetchRoute(r.id);
      // Map backend field names to frontend expected names
      results.push({
        ...routeWithStops,
        shortName: routeWithStops.short_name || routeWithStops.shortName,
        routeNumber: routeWithStops.route_number || routeWithStops.routeNumber
      });
    } catch {
      // Fallback to basic route info if detailed fetch fails
      results.push({
        ...r,
        shortName: r.short_name || r.shortName,
        routeNumber: r.route_number || r.routeNumber,
        stops: []
      });
    }
  }
  return results;
};

export const fetchRouteGeometry = async (routeId = null) => {
  const q = routeId ? `?routeId=${routeId}` : '';
  return safeFetch(`/routes/geometry${q}`);
};

// Admin login
export const adminLogin = async (email, password) => {
  return safeFetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
}

export const fetchFeedbacks = (limit = 200) => safeFetch(`/feedbacks?limit=${limit}`);

// Road snapping using Mapbox Directions API
export const getSnappedRoute = async (coordinates, profile = 'driving') => {
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  
  if (!MAPBOX_TOKEN) {
    console.warn('No Mapbox token found, using straight line geometry');
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coordinates
      }
    };
  }

  try {
    // Convert coordinates to the format expected by Mapbox Directions API
    const coordinatesString = coordinates.map(coord => `${coord[0]},${coord[1]}`).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinatesString}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    
    console.log('Fetching snapped route from Mapbox:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      return {
        type: "Feature",
        geometry: data.routes[0].geometry,
        properties: {
          distance: data.routes[0].distance,
          duration: data.routes[0].duration
        }
      };
    } else {
      throw new Error('No routes returned from Mapbox');
    }
  } catch (error) {
    console.error('Error fetching snapped route:', error);
    // Fallback to straight line
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coordinates
      }
    };
  }
};

// Alternative: Use OSRM (free, no API key required)
export const getSnappedRouteOSRM = async (coordinates, profile = 'driving') => {
  try {
    const coordinatesString = coordinates.map(coord => `${coord[0]},${coord[1]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/${profile}/${coordinatesString}?geometries=geojson&overview=full`;
    
    console.log('Fetching snapped route from OSRM:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      return {
        type: "Feature",
        geometry: data.routes[0].geometry,
        properties: {
          distance: data.routes[0].distance,
          duration: data.routes[0].duration
        }
      };
    } else {
      throw new Error('No routes returned from OSRM');
    }
  } catch (error) {
    console.error('Error fetching snapped route from OSRM:', error);
    // Fallback to straight line
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coordinates
      }
    };
  }
};

export const openBusesSSE = (routeId = null, onMessage, onError) => {
  const q = routeId ? `?routeId=${routeId}` : '';
  const url = `${API}/buses/stream${q}`;
  
  console.log('Opening SSE connection to:', url);
  
  const eventSource = new EventSource(url);
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing SSE data:', error);
      onError(error);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    onError(error);
  };
  
  return eventSource;
};

// Get bus status with passenger load data
export const fetchBusStatus = (routeId = null, plateNumber = null) => {
  const params = new URLSearchParams();
  if (routeId) params.append('routeId', routeId);
  if (plateNumber) params.append('plateNumber', plateNumber);
  
  const query = params.toString();
  return safeFetch(`/buses/status${query ? '?' + query : ''}`);
};

// Add ticket (when ticket machine prints ticket)
export const addTicket = (plateNumber) => {
  return safeFetch('/buses/add-ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plateNumber })
  });
};

// Reset bus passenger count (end of route)
export const resetBusCount = (plateNumber) => {
  return safeFetch('/buses/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plateNumber })
  });
};

// Fleet Management: Send reroute command to driver
export const sendRerouteCommand = (busId, destination, reason = 'High passenger demand detected', priority = 'medium') => {
  return safeFetch('/fleet/reroute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bus_id: busId, destination, reason, priority })
  });
};

// Fleet Management: Reroute by target route id
export const sendRerouteToRoute = (busId, targetRouteId, reason = 'Move bus to congested route', priority = 'medium', plateNumber = null, targetRouteShortName = null, targetRouteName = null) => {
  return safeFetch('/fleet/reroute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bus_id: busId,
      plate_number: plateNumber,
      target_route_id: targetRouteId,
      target_route_short_name: targetRouteShortName,
      target_route_name: targetRouteName,
      reason,
      priority
    })
  });
};

// Fleet Management: Get AI congestion predictions
export const fetchCongestionData = () => {
  return safeFetch('/fleet/congestion');
};

// Route-level congestion (DB)
export const fetchRouteCongestion = () => {
  return safeFetch('/fleet/congestion/routes');
};