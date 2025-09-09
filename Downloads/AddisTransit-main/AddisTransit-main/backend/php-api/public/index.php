<?php
declare(strict_types=1);

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', '1');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    require __DIR__ . '/../db.php';
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to load database connection', 'details' => $e->getMessage()]);
    exit;
}

function jsonResponse($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path === '/health') {
    jsonResponse(['ok' => true]);
    exit;
}

if ($path === '/debug/routes') {
    try {
        $stmt = $pdo->query('SELECT COUNT(*) as route_count FROM routes');
        $routeCount = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->query('SELECT COUNT(*) as stop_count FROM stops');
        $stopCount = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->query('SELECT r.id, r.short_name, COUNT(s.id) as stop_count FROM routes r LEFT JOIN stops s ON r.id = s.route_id GROUP BY r.id, r.short_name');
        $routesWithStops = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse([
            'route_count' => $routeCount['route_count'],
            'stop_count' => $stopCount['stop_count'],
            'routes_with_stops' => $routesWithStops
        ]);
    } catch (Throwable $e) {
        jsonResponse(['error' => 'Debug failed', 'details' => $e->getMessage()], 500);
    }
    exit;
}

if ($path === '/routes' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query('select id, short_name, name, color, coalesce(description, \'\') as description from routes order by short_name');
        jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Throwable $e) {
        jsonResponse(['error' => 'Failed to fetch routes', 'details' => $e->getMessage()], 500);
    }
    exit;
}

if (preg_match('#^/routes/(.+)$#', $path, $m) && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = $m[1]; // Accept any string ID (route-07, etc.)
    $stmt = $pdo->prepare('select id, short_name, name, color, coalesce(description, \'\') as description from routes where id=?');
    $stmt->execute([$id]);
    $route = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$route) {
        jsonResponse(['error' => 'not found'], 404);
        exit;
    }
    $stmt = $pdo->prepare('select id, name, lat, lng, sequence from stops where route_id=? order by sequence');
    $stmt->execute([$id]);
    $route['stops'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse($route);
    exit;
}

if ($path === '/stops/nearby' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $lat = isset($_GET['lat']) ? (float) $_GET['lat'] : 0.0;
    $lng = isset($_GET['lng']) ? (float) $_GET['lng'] : 0.0;
    $radius = isset($_GET['radius']) ? (int) $_GET['radius'] : 1200; // meters
    // Haversine distance in PostgreSQL
    $sql = 'select s.*, r.name as route_name, r.short_name as route_short_name, r.color as route_color,
      (6371000 * acos( cos(radians(?)) * cos(radians(s.lat)) * cos(radians(s.lng) - radians(?)) + sin(radians(?)) * sin(radians(s.lat)) )) as meters
      from stops s join routes r on r.id=s.route_id
      where (6371000 * acos( cos(radians(?)) * cos(radians(s.lat)) * cos(radians(s.lng) - radians(?)) + sin(radians(?)) * sin(radians(s.lat)) )) <= ?
      order by meters asc
      limit 200';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$lat, $lng, $lat, $lat, $lng, $lat, $radius]);
    jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($path === '/alerts' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query('select * from alerts order by updated_at desc limit 100');
    jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($path === '/buses' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        if (isset($_GET['routeId'])) {
            $routeId = (int) $_GET['routeId'];
            $stmt = $pdo->prepare('select * from buses where route_id=?');
            $stmt->execute([$routeId]);
            jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
        } else {
            $stmt = $pdo->query('select * from buses');
            jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
    } catch (Throwable $e) {
        jsonResponse(['error' => 'Failed to fetch buses', 'details' => $e->getMessage()], 500);
    }
    exit;
}


if ($path === '/routes/geometry' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $routeId = isset($_GET['routeId']) ? $_GET['routeId'] : null;

        if ($routeId) {
            // Get stops for specific route
            $stmt = $pdo->prepare('select lat, lng from stops where route_id=? order by sequence');
            $stmt->execute([$routeId]);
            $stops = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            // Get all routes with their stops
            $stmt = $pdo->query('
                select r.id as route_id, r.color, s.lat, s.lng, s.sequence
                from routes r 
                left join stops s on r.id = s.route_id 
                order by r.id, s.sequence
            ');
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $result = [];
            $currentRoute = null;
            $stops = [];

            foreach ($rows as $row) {
                if ($currentRoute === null || $currentRoute['route_id'] !== $row['route_id']) {
                    // Process previous route
                    if ($currentRoute !== null && !empty($stops)) {
                        $result[] = [
                            'route_id' => $currentRoute['route_id'],
                            'color' => $currentRoute['color'],
                            'geometry' => getRouteGeometry($stops)
                        ];
                    }

                    // Start new route
                    $currentRoute = $row;
                    $stops = [];
                }

                if ($row['lat'] !== null && $row['lng'] !== null) {
                    $stops[] = ['lat' => $row['lat'], 'lng' => $row['lng']];
                }
            }

            // Process last route
            if ($currentRoute !== null && !empty($stops)) {
                $result[] = [
                    'route_id' => $currentRoute['route_id'],
                    'color' => $currentRoute['color'],
                    'geometry' => getRouteGeometry($stops)
                ];
            }

            jsonResponse($result);
            exit;
        }

        if (empty($stops)) {
            jsonResponse(['error' => 'No stops found'], 404);
            exit;
        }

        $geometry = getRouteGeometry($stops);
        jsonResponse(['geometry' => $geometry]);

    } catch (Throwable $e) {
        error_log('Route geometry error: ' . $e->getMessage());
        jsonResponse(['error' => 'Failed to get route geometry', 'details' => $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
    }
    exit;
}

if ($path === '/trip/plan' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    // For now, just return an empty array; frontend has fallback
    jsonResponse(['options' => []]);
    exit;
}

function getRouteGeometry($stops)
{
    if (count($stops) < 2) {
        return null;
    }

    // Use Mapbox Directions API for road snapping
    $mapboxToken = getenv('MAPBOX_ACCESS_TOKEN');
    if (!$mapboxToken) {
        // Fallback to simple line if no Mapbox token
        $coordinates = [];
        foreach ($stops as $stop) {
            $coordinates[] = [(float) $stop['lng'], (float) $stop['lat']];
        }
        return [
            'type' => 'LineString',
            'coordinates' => $coordinates
        ];
    }

    // Build coordinates string for Mapbox API
    $coordinates = [];
    foreach ($stops as $stop) {
        $coordinates[] = $stop['lng'] . ',' . $stop['lat'];
    }
    $coordinatesStr = implode(';', $coordinates);

    // Call Mapbox Directions API
    $url = "https://api.mapbox.com/directions/v5/mapbox/driving/{$coordinatesStr}?geometries=geojson&access_token={$mapboxToken}";

    $context = stream_context_create([
        'http' => [
            'timeout' => 10,
            'method' => 'GET'
        ]
    ]);

    $response = @file_get_contents($url, false, $context);
    if ($response === false) {
        // Fallback to simple line if API call fails
        $coordinates = [];
        foreach ($stops as $stop) {
            $coordinates[] = [(float) $stop['lng'], (float) $stop['lat']];
        }
        return [
            'type' => 'LineString',
            'coordinates' => $coordinates
        ];
    }

    $data = json_decode($response, true);
    if (isset($data['routes'][0]['geometry'])) {
        return $data['routes'][0]['geometry'];
    }

    // Fallback to simple line if no geometry in response
    $coordinates = [];
    foreach ($stops as $stop) {
        $coordinates[] = [(float) $stop['lng'], (float) $stop['lat']];
    }
    return [
        'type' => 'LineString',
        'coordinates' => $coordinates
    ];
}

jsonResponse(['error' => 'Not found'], 404);