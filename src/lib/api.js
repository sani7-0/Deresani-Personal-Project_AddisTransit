const API = 'https://calculator-php-transition-paint.trycloudflare.com';
console.log('API URL:', API);

const safeFetch = async (path, options = {}, retries = 5) => {
  const baseUrl = API;
  let origin;
  try {
    const u = new URL(baseUrl);
    origin = u.origin;
  } catch {
    origin = String(baseUrl || '').replace(/\/$/, '');
  }
  console.log(`API call: ${origin}${path}`);
  
  for (let i = 0; i < retries; i++) {
    try {
      const headers = new Headers(options.headers || {});
      try {
        const token = localStorage.getItem('admin_token');
        if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      } catch {}
      if (!headers.has('Accept')) headers.set('Accept', 'application/json');
      let url = new URL(path, origin.endsWith('/') ? origin : origin + '/').toString();
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        let serverError = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          if (errBody && (errBody.error || errBody.message)) {
            serverError = `${serverError}: ${errBody.error || errBody.message}`;
          }
        } catch {}
        const err = new Error(serverError);
        if (res.status >= 400 && res.status < 500) {
          throw err;
        }
        throw err;
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Invalid content-type: ${ct} body: ${text.slice(0,120)}`);
      }
      const data = await res.json();
      console.log(`API response for ${path}:`, data);
      return data;
    } catch (error) {
      console.log(`API call failed (attempt ${i + 1}/${retries}):`, error.message);
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

export const fetchEthiopianBuses = async () => {
  if (!busSimulation.isRunning) {
    await busSimulation.initialize();
  }
  
  return busSimulation.getBuses();
};

export const fetchBusesForRoute = async (routeId) => {
  if (!busSimulation.isRunning) {
    await busSimulation.initialize();
  }
  
  return busSimulation.getBusesForRoute(routeId);
};

export const getSimulationStatus = () => {
  return busSimulation.getStatus();
};

export const addBusToRoute = async (routeId) => {
  if (!busSimulation.isRunning) {
    await busSimulation.initialize();
  }
  
  return busSimulation.addBus(routeId);
};

export const removeBus = (busId) => {
  return busSimulation.removeBus(busId);
};

export const fetchRoutesWithStops = async () => {
  const routes = await fetchRoutes();
  const results = [];
  for (const r of routes) {
    try {
      const routeWithStops = await fetchRoute(r.id);
      results.push({
        ...routeWithStops,
        shortName: routeWithStops.short_name || routeWithStops.shortName,
        routeNumber: routeWithStops.route_number || routeWithStops.routeNumber
      });
    } catch {
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

export const sendOtp = (phoneNumber) =>
  safeFetch('/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phoneNumber })
  });

export const verifyOtp = (phoneNumber, otpCode) =>
  safeFetch('/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phoneNumber, otp_code: otpCode })
  });

export const resendOtp = (phoneNumber) =>
  safeFetch('/auth/resend-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phoneNumber })
  });

export const adminLogin = async (email, password) => {
  return safeFetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
}

export const fetchFeedbacks = (limit = 200) => safeFetch(`/feedbacks?limit=${limit}`);

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
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coordinates
      }
    };
  }
};

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

export const fetchBusStatus = (routeId = null, plateNumber = null) => {
  const params = new URLSearchParams();
  if (routeId) params.append('routeId', routeId);
  if (plateNumber) params.append('plateNumber', plateNumber);
  
  const query = params.toString();
  return safeFetch(`/buses/status${query ? '?' + query : ''}`);
};

export const addTicket = (plateNumber) => {
  return safeFetch('/buses/add-ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plateNumber })
  });
};

export const resetBusCount = (plateNumber) => {
  return safeFetch('/buses/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plateNumber })
  });
};

export const sendRerouteCommand = (busId, destination, reason = 'High passenger demand detected', priority = 'medium') => {
  return safeFetch('/fleet/reroute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bus_id: busId, destination, reason, priority })
  });
};

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

export const fetchCongestionData = () => {
  return safeFetch('/fleet/congestion');
};

export const fetchRouteCongestion = () => {
  return safeFetch('/fleet/congestion/routes');
};