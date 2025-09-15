<?php
declare(strict_types=1);

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 0');
header('Referrer-Policy: no-referrer');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
// Strict-Transport-Security should be set by reverse proxy in production
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

$jwtSecret = getenv('JWT_SECRET') ?: 'dev-secret-change-me';

function getBearerToken(): ?string
{
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (stripos($hdr, 'Bearer ') === 0) {
        return substr($hdr, 7);
    }
    return null;
}

function verifyJwt(string $token, string $secret): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3)
        return null;
    [$h, $p, $s] = $parts;
    $sig = rtrim(strtr(base64_encode(hash_hmac('sha256', "$h.$p", $secret, true)), '+/', '-_'), '=');
    if (!hash_equals($sig, $s))
        return null;
    $payload = json_decode(base64_decode(strtr($p, '-_', '+/')) ?: 'null', true);
    if (!is_array($payload))
        return null;
    if (isset($payload['exp']) && time() >= (int) $payload['exp'])
        return null;
    return $payload;
}

function requireAuth(array $roles = []): ?array
{
    global $jwtSecret;
    $t = getBearerToken();
    if (!$t) {
        jsonResponse(['error' => 'Unauthorized'], 401);
        exit;
    }
    $payload = verifyJwt($t, $jwtSecret);
    if (!$payload) {
        jsonResponse(['error' => 'Unauthorized'], 401);
        exit;
    }
    if (!empty($roles)) {
        $role = $payload['role'] ?? '';
        if (!in_array($role, $roles, true)) {
            jsonResponse(['error' => 'Forbidden'], 403);
            exit;
        }
    }
    return $payload;
}

function jsonResponse($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Enforce JSON content type for API responses
header('Content-Type: application/json');

if ($path === '/health') {
    jsonResponse(['ok' => true]);
    exit;
}

// Utilities for distance and ETA
function haversine_km(float $lat1, float $lon1, float $lat2, float $lon2): float
{
    $R = 6371.0; // km
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) * sin($dLon / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $R * $c;
}

function estimate_eta_minutes(float $distanceKm, float $avgSpeedKmh = 22.0): int
{
    if ($avgSpeedKmh <= 0.1) {
        $avgSpeedKmh = 22.0;
    }
    $minutes = ($distanceKm / $avgSpeedKmh) * 60.0;
    return (int) max(1, round($minutes));
}

function table_exists(PDO $pdo, string $table): bool
{
    try {
        $stmt = $pdo->prepare("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = :t)");
        $stmt->execute([':t' => $table]);
        return (bool) $stmt->fetchColumn();
    } catch (Throwable $e) {
        return false;
    }
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
        error_log('Debug failed: ' . $e->getMessage());
        jsonResponse(['error' => 'Debug failed'], 500);
    }
    exit;
}

if ($path === '/routes' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // First check if routes table exists
        $tableCheck = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'routes')")->fetchColumn();

        if (!$tableCheck) {
            // Create routes table if it doesn't exist
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS routes (
                    id SERIAL PRIMARY KEY,
                    short_name VARCHAR(32) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    color VARCHAR(16) NOT NULL,
                    description TEXT
                );
            ");

            // Insert sample data
            $pdo->exec("
                INSERT INTO routes (short_name, name, color, description) VALUES 
                ('1', 'Route 1 - Bole to Piazza', '#1e40af', 'Main route connecting Bole to Piazza via Meskel Square'),
                ('2', 'Route 2 - CMC to Arat Kilo', '#16a34a', 'Route from CMC to Arat Kilo via Mexico Square'),
                ('3', 'Route 3 - Kazanchis to Merkato', '#f59e0b', 'Busy route connecting Kazanchis to Merkato'),
                ('4', 'Route 4 - Bole to Airport', '#dc2626', 'Direct route from Bole to Addis Ababa Airport'),
                ('5', 'Route 5 - Piazza to Merkato', '#7c3aed', 'Historic route through the city center')
                ON CONFLICT DO NOTHING;
            ");
        }

        $stmt = $pdo->query('select id, short_name, name, color, coalesce(description, \'\') as description from routes order by short_name');
        jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Throwable $e) {
        error_log('Database error: ' . $e->getMessage());
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

// Fleet Management: Send reroute command to driver
if ($path === '/fleet/reroute' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        requireAuth(['admin']);
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) {
            $input = [];
        }

        // Accept both snake_case and camelCase
        $busIdRaw = $input['bus_id'] ?? $input['busId'] ?? null;
        $plateRaw = $input['plate_number'] ?? $input['plateNumber'] ?? null;
        $destination = $input['destination'] ?? null;
        $targetRouteIdRaw = $input['target_route_id'] ?? $input['targetRouteId'] ?? null;
        $targetRouteShort = $input['target_route_short_name'] ?? $input['targetRouteShortName'] ?? null;
        $targetRouteName = $input['target_route_name'] ?? $input['targetRouteName'] ?? null;

        if ($busIdRaw === null && $targetRouteIdRaw === null && $destination === null) {
            jsonResponse(['error' => 'Missing required fields: bus_id and (destination or target_route_id)'], 400);
            exit;
        }

        $busId = (int) $busIdRaw;
        $targetRouteId = $targetRouteIdRaw !== null ? (int) $targetRouteIdRaw : null;
        $reason = $input['reason'] ?? 'High passenger demand detected';
        $priority = $input['priority'] ?? 'medium';

        // In a real implementation, this would:
        // 1. Validate the bus exists and is available
        // 2. Store the reroute command in the database
        // 3. Send real-time notification to the driver's device
        // 4. Update the bus's route assignment

        // If target_route_id is not provided, assign by destination proximity
        $lat = isset($destination['lat']) ? (float) $destination['lat'] : null;
        $lng = isset($destination['lng']) ? (float) $destination['lng'] : null;
        if ($targetRouteId === null && ($lat === null || $lng === null)) {
            jsonResponse(['error' => 'Destination lat/lng required when target_route_id is not provided'], 400);
            exit;
        }

        // Validate required tables exist
        if (!table_exists($pdo, 'routes') || !table_exists($pdo, 'stops') || !table_exists($pdo, 'buses')) {
            jsonResponse(['error' => 'Required tables not found (routes/stops/buses)'], 500);
            exit;
        }

        // Validate/resolve bus
        $busRow = null;
        if ($busId) {
            $busCheck = $pdo->prepare('SELECT id, plate_number FROM buses WHERE id = ? LIMIT 1');
            $busCheck->execute([$busId]);
            $busRow = $busCheck->fetch(PDO::FETCH_ASSOC) ?: null;
        }
        if (!$busRow && $plateRaw) {
            $busByPlate = $pdo->prepare('SELECT id, plate_number FROM buses WHERE plate_number = ? LIMIT 1');
            $busByPlate->execute([trim((string) $plateRaw)]);
            $busRow = $busByPlate->fetch(PDO::FETCH_ASSOC) ?: null;
            if ($busRow) {
                $busId = (int) $busRow['id'];
            }
        }
        if (!$busRow) {
            jsonResponse(['error' => 'Bus not found'], 404);
            exit;
        }

        $assignedRoute = null;
        $best = null;
        if ($targetRouteId !== null) {
            $rstmt = $pdo->prepare('SELECT id, short_name, name FROM routes WHERE id = ?');
            $rstmt->execute([$targetRouteId]);
            $assignedRoute = $rstmt->fetch(PDO::FETCH_ASSOC);
            if (!$assignedRoute && $targetRouteShort) {
                $rstmt = $pdo->prepare('SELECT id, short_name, name FROM routes WHERE lower(short_name) = lower(?) LIMIT 1');
                $rstmt->execute([trim((string) $targetRouteShort)]);
                $assignedRoute = $rstmt->fetch(PDO::FETCH_ASSOC);
            }
            if (!$assignedRoute && $targetRouteName) {
                $rstmt = $pdo->prepare('SELECT id, short_name, name FROM routes WHERE lower(name) = lower(?) LIMIT 1');
                $rstmt->execute([trim((string) $targetRouteName)]);
                $assignedRoute = $rstmt->fetch(PDO::FETCH_ASSOC);
            }
            if (!$assignedRoute) {
                jsonResponse(['error' => 'Target route not found'], 404);
                exit;
            }
            $sstmt = $pdo->prepare('SELECT id as stop_id, name, lat, lng, sequence FROM stops WHERE route_id = ? AND lat IS NOT NULL AND lng IS NOT NULL ORDER BY sequence LIMIT 1');
            $sstmt->execute([$targetRouteId]);
            $best = $sstmt->fetch(PDO::FETCH_ASSOC);
            if ($best) {
                $best['route_id'] = $assignedRoute['id'];
                $best['short_name'] = $assignedRoute['short_name'];
                $best['route_name'] = $assignedRoute['name'];
            }
        } else {
            $rows = $pdo->query('SELECT s.id as stop_id, s.route_id, s.name, s.lat, s.lng, s.sequence, r.short_name, r.name as route_name FROM stops s JOIN routes r ON r.id = s.route_id')->fetchAll(PDO::FETCH_ASSOC);
            $bestDist = INF;
            foreach ($rows as $row) {
                if ($row['lat'] === null || $row['lng'] === null) {
                    continue;
                }
                $d = haversine_km($lat, $lng, (float) $row['lat'], (float) $row['lng']);
                if ($d < $bestDist) {
                    $bestDist = $d;
                    $best = $row;
                }
            }
        }

        if ($best === null) {
            jsonResponse(['error' => 'No routes available for reroute'], 400);
            exit;
        }

        // Persist reassignment (avoid touching non-existent columns)
        $upd = $pdo->prepare('UPDATE buses SET route_id = :route_id WHERE id = :bus_id');
        $upd->execute([':route_id' => (int) $best['route_id'], ':bus_id' => (int) $busId]);

        // Compute ETA from current bus position to nearest stop of assigned route
        $busPosStmt = $pdo->prepare('SELECT last_lat, last_lng FROM buses WHERE id = ?');
        $busPosStmt->execute([(int) $busId]);
        $busPos = $busPosStmt->fetch(PDO::FETCH_ASSOC) ?: ['last_lat' => null, 'last_lng' => null];
        $eta = null;
        if (!empty($busPos['last_lat']) && !empty($busPos['last_lng']) && isset($best['lat']) && isset($best['lng'])) {
            if ($busPos['last_lat'] !== null && $busPos['last_lng'] !== null && $best['lat'] !== null && $best['lng'] !== null) {
                $distKm = haversine_km((float) $busPos['last_lat'], (float) $busPos['last_lng'], (float) $best['lat'], (float) $best['lng']);
                $eta = estimate_eta_minutes($distKm);
            }
        }

        $rerouteCommand = [
            'id' => 'reroute-' . uniqid(),
            'bus_id' => $busId,
            'destination' => [
                'name' => ($destination['name'] ?? null) ?: ($best['name'] ?? null),
                'lat' => $lat,
                'lng' => $lng,
            ],
            'assigned_route' => [
                'id' => (int) $best['route_id'],
                'short_name' => $best['short_name'],
                'name' => $best['route_name'],
                'nearest_stop' => [
                    'id' => (int) $best['stop_id'],
                    'name' => $best['name'],
                    'sequence' => (int) $best['sequence'],
                ]
            ],
            'reason' => $reason,
            'priority' => $priority,
            'status' => 'assigned',
            'created_at' => date('Y-m-d H:i:s'),
            'estimated_arrival_minutes' => $eta,
        ];

        jsonResponse([
            'success' => true,
            'message' => 'Bus reassigned to nearest existing route',
            'command' => $rerouteCommand
        ]);

    } catch (Throwable $e) {
        jsonResponse(['error' => 'Failed to send reroute command: ' . $e->getMessage()], 500);
    }
    exit;
}

// Fleet Management: Get congestion predictions (mock AI data)
if ($path === '/fleet/congestion' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Mock AI congestion predictions
        $congestionData = [
            [
                'area' => 'Meskel Square',
                'lng' => 38.7756,
                'lat' => 9.0192,
                'intensity' => 0.9,
                'passengers' => 150,
                'prediction_confidence' => 0.85,
                'timestamp' => date('Y-m-d H:i:s')
            ],
            [
                'area' => 'CMC',
                'lng' => 38.7600,
                'lat' => 9.0100,
                'intensity' => 0.7,
                'passengers' => 120,
                'prediction_confidence' => 0.78,
                'timestamp' => date('Y-m-d H:i:s')
            ],
            [
                'area' => 'Bole',
                'lng' => 38.7900,
                'lat' => 9.0300,
                'intensity' => 0.8,
                'passengers' => 140,
                'prediction_confidence' => 0.82,
                'timestamp' => date('Y-m-d H:i:s')
            ],
            [
                'area' => 'Piazza',
                'lng' => 38.7500,
                'lat' => 9.0000,
                'intensity' => 0.6,
                'passengers' => 100,
                'prediction_confidence' => 0.75,
                'timestamp' => date('Y-m-d H:i:s')
            ],
            [
                'area' => 'Kazanchis',
                'lng' => 38.7800,
                'lat' => 9.0400,
                'intensity' => 0.5,
                'passengers' => 80,
                'prediction_confidence' => 0.70,
                'timestamp' => date('Y-m-d H:i:s')
            ],
            [
                'area' => 'Merkato',
                'lng' => 38.7400,
                'lat' => 8.9900,
                'intensity' => 0.4,
                'passengers' => 60,
                'prediction_confidence' => 0.68,
                'timestamp' => date('Y-m-d H:i:s')
            ],
            [
                'area' => 'Airport',
                'lng' => 38.8000,
                'lat' => 9.0500,
                'intensity' => 0.3,
                'passengers' => 40,
                'prediction_confidence' => 0.65,
                'timestamp' => date('Y-m-d H:i:s')
            ],
            [
                'area' => 'Arat Kilo',
                'lng' => 38.7200,
                'lat' => 8.9800,
                'intensity' => 0.2,
                'passengers' => 30,
                'prediction_confidence' => 0.62,
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ];

        jsonResponse([
            'success' => true,
            'data' => $congestionData,
            'generated_at' => date('Y-m-d H:i:s'),
            'ai_model_version' => 'v1.2.3'
        ]);

    } catch (Throwable $e) {
        jsonResponse(['error' => 'Failed to fetch congestion data: ' . $e->getMessage()], 500);
    }
    exit;
}

// Fleet Management: Route-level congestion from DB (based on bus fullness)
if ($path === '/fleet/congestion/routes' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        if (!table_exists($pdo, 'routes') || !table_exists($pdo, 'buses')) {
            jsonResponse(['error' => 'Required tables not found (routes/buses)'], 500);
            exit;
        }

        $sql = "
            SELECT 
                r.id as route_id,
                r.short_name,
                r.name,
                r.color,
                COUNT(b.id) as buses,
                COALESCE(SUM(b.current_passenger_count), 0) as passengers,
                COALESCE(SUM(b.max_capacity), 0) as capacity,
                CASE WHEN COALESCE(SUM(b.max_capacity),0) > 0 
                    THEN ROUND((COALESCE(SUM(b.current_passenger_count),0)::NUMERIC / SUM(b.max_capacity)::NUMERIC) * 100, 1)
                    ELSE 0 END as load_percentage
            FROM routes r
            LEFT JOIN buses b ON b.route_id = r.id
            GROUP BY r.id, r.short_name, r.name, r.color
            ORDER BY load_percentage DESC, buses DESC
            LIMIT 5
        ";

        $rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse([
            'success' => true,
            'routes' => $rows
        ]);
    } catch (Throwable $e) {
        jsonResponse(['error' => 'Failed to compute route congestion', 'details' => $e->getMessage()], 500);
    }
    exit;
}

// Admin: list recent user feedbacks
if ($path === '/feedbacks' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $limit = isset($_GET['limit']) ? max(1, min((int) $_GET['limit'], 500)) : 200;
        $stmt = $pdo->prepare('select id, created_at, route, bus_number, plate_number, feedback, submitter_ip, user_agent, locale from bus_feedback order by created_at desc limit ?');
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Throwable $e) {
        jsonResponse(['error' => 'Failed to fetch feedbacks'], 500);
    }
    exit;
}

// Submit user feedback: POST /feedback
// Body: { route, busNumber, plateNumber, feedback, ip, userAgent, locale }
if ($path === '/feedback' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $body = json_decode(file_get_contents('php://input') ?: 'null', true);
        if (!is_array($body)) {
            jsonResponse(['error' => 'Invalid JSON body'], 400);
            exit;
        }

        $route = isset($body['route']) ? trim((string) $body['route']) : '';
        $busNumber = isset($body['busNumber']) ? trim((string) $body['busNumber']) : '';
        $plateNumber = isset($body['plateNumber']) ? trim((string) $body['plateNumber']) : '';
        $feedback = isset($body['feedback']) ? trim((string) $body['feedback']) : '';
        $ip = isset($body['ip']) ? trim((string) $body['ip']) : ($_SERVER['REMOTE_ADDR'] ?? '');
        $userAgent = isset($body['userAgent']) ? (string) $body['userAgent'] : ($_SERVER['HTTP_USER_AGENT'] ?? '');
        $locale = isset($body['locale']) ? (string) $body['locale'] : '';

        if ($route === '' || $busNumber === '' || $plateNumber === '' || $feedback === '') {
            jsonResponse(['error' => 'Missing required fields'], 400);
            exit;
        }

        $stmt = $pdo->prepare('insert into bus_feedback (route, bus_number, plate_number, feedback, submitter_ip, user_agent, locale, created_at) values (:route, :bus_number, :plate_number, :feedback, :submitter_ip::inet, :user_agent, :locale, now())');
        $stmt->execute([
            ':route' => $route,
            ':bus_number' => $busNumber,
            ':plate_number' => $plateNumber,
            ':feedback' => $feedback,
            ':submitter_ip' => $ip,
            ':user_agent' => $userAgent,
            ':locale' => $locale,
        ]);

        jsonResponse(['ok' => true]);
        exit;
    } catch (Throwable $e) {
        jsonResponse(['error' => 'Failed to save feedback'], 500);
        exit;
    }
}

// Admin login: POST /admin/login { email, password }
if ($path === '/admin/login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $body = json_decode(file_get_contents('php://input') ?: 'null', true);
        if (!is_array($body)) {
            jsonResponse(['error' => 'Invalid JSON body'], 400);
            exit;
        }
        $email = isset($body['email']) ? trim((string) $body['email']) : '';
        $password = isset($body['password']) ? (string) $body['password'] : '';
        if ($email === '' || $password === '') {
            jsonResponse(['error' => 'Email and password are required'], 400);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id, email, password_hash, role, is_active FROM admins WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        $ok = false;
        if ($user && (bool) $user['is_active'] === true) {
            $ok = password_verify($password, $user['password_hash']);
        }

        if (!$ok) {
            jsonResponse(['error' => 'Invalid credentials'], 401);
            exit;
        }

        // Optional rehash
        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $upd = $pdo->prepare('UPDATE admins SET password_hash = :h, updated_at = NOW() WHERE id = :id');
            $upd->execute([':h' => $newHash, ':id' => $user['id']]);
        }

        $header = rtrim(strtr(base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'])), '+/', '-_'), '=');
        $exp = time() + 60 * 60 * 8; // 8 hours
        $payload = rtrim(strtr(base64_encode(json_encode(['sub' => (int) $user['id'], 'email' => $user['email'], 'role' => $user['role'], 'exp' => $exp])), '+/', '-_'), '=');
        $sig = rtrim(strtr(base64_encode(hash_hmac('sha256', "$header.$payload", $jwtSecret, true)), '+/', '-_'), '=');
        $token = "$header.$payload.$sig";
        jsonResponse([
            'token' => $token,
            'user' => [
                'id' => (int) $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
            ],
        ]);
        exit;
    } catch (Throwable $e) {
        jsonResponse(['error' => 'Login failed'], 500);
        exit;
    }
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

// Get bus status with passenger load data
if ($path === '/buses/status' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $routeId = isset($_GET['routeId']) ? $_GET['routeId'] : null;
        $plateNumber = isset($_GET['plateNumber']) ? $_GET['plateNumber'] : null;

        $sql = "
            SELECT 
                b.id as bus_id,
                b.plate_number,
                b.route_id,
                r.route_number,
                r.short_name as route_short_name,
                r.name as route_name,
                r.color as route_color,
                b.current_passenger_count as passengers,
                b.max_capacity,
                ROUND((b.current_passenger_count::NUMERIC / b.max_capacity::NUMERIC) * 100, 1) as fullness_percentage,
                CASE 
                    WHEN b.current_passenger_count < (b.max_capacity * 0.5) THEN 'green'
                    WHEN b.current_passenger_count < (b.max_capacity * 0.8) THEN 'yellow'
                    ELSE 'red'
                END as status,
                CASE 
                    WHEN b.current_passenger_count < (b.max_capacity * 0.5) THEN '🟢'
                    WHEN b.current_passenger_count < (b.max_capacity * 0.8) THEN '🟡'
                    ELSE '🔴'
                END as status_emoji,
                b.last_lat,
                b.last_lng,
                b.last_updated,
                tc.ticket_count,
                tc.last_ticket_time
            FROM public.buses b
            JOIN public.routes r ON b.route_id = r.id
            LEFT JOIN public.ticket_count tc ON b.id = tc.bus_id
            WHERE 1=1
        ";

        $params = [];
        if ($routeId) {
            $sql .= " AND b.route_id = ?";
            $params[] = $routeId;
        }
        if ($plateNumber) {
            $sql .= " AND b.plate_number = ?";
            $params[] = $plateNumber;
        }

        $sql .= " ORDER BY r.route_number, b.plate_number";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $buses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Compute next stop and ETA per-bus (nearest stop on the current route)
        foreach ($buses as &$bus) {
            $busLat = isset($bus['last_lat']) ? (float) $bus['last_lat'] : 0.0;
            $busLng = isset($bus['last_lng']) ? (float) $bus['last_lng'] : 0.0;
            $routeIdForBus = isset($bus['route_id']) ? (int) $bus['route_id'] : null;

            $nextStopName = null;
            $nextStopSeq = null;
            $etaMinutes = null;

            if ($routeIdForBus && $busLat !== 0.0 && $busLng !== 0.0) {
                $stopStmt = $pdo->prepare('SELECT id, name, lat, lng, sequence FROM stops WHERE route_id = ? ORDER BY sequence ASC');
                $stopStmt->execute([$routeIdForBus]);
                $stops = $stopStmt->fetchAll(PDO::FETCH_ASSOC);

                $minDist = INF;
                $closest = null;
                foreach ($stops as $s) {
                    if ($s['lat'] === null || $s['lng'] === null) {
                        continue;
                    }
                    $d = haversine_km($busLat, $busLng, (float) $s['lat'], (float) $s['lng']);
                    if ($d < $minDist) {
                        $minDist = $d;
                        $closest = $s;
                    }
                }

                if ($closest !== null) {
                    $nextStopName = $closest['name'];
                    $nextStopSeq = (int) $closest['sequence'];
                    $etaMinutes = estimate_eta_minutes($minDist);
                }
            }

            $bus['next_stop'] = $nextStopName;
            $bus['next_stop_sequence'] = $nextStopSeq;
            $bus['eta_minutes'] = $etaMinutes;
        }

        jsonResponse($buses);
    } catch (Throwable $e) {
        error_log('Bus status error: ' . $e->getMessage());
        jsonResponse(['error' => 'Failed to fetch bus status', 'details' => $e->getMessage()], 500);
    }
    exit;
}

// Add ticket endpoint
if ($path === '/buses/add-ticket' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $body = json_decode(file_get_contents('php://input') ?: 'null', true);
        if (!is_array($body) || !isset($body['plateNumber'])) {
            jsonResponse(['error' => 'Plate number is required'], 400);
            exit;
        }

        $plateNumber = trim($body['plateNumber']);
        $stmt = $pdo->prepare("SELECT public.add_ticket(?)");
        $stmt->execute([$plateNumber]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        $data = json_decode($result['add_ticket'], true);
        jsonResponse($data);
    } catch (Throwable $e) {
        error_log('Add ticket error: ' . $e->getMessage());
        jsonResponse(['error' => 'Failed to add ticket', 'details' => $e->getMessage()], 500);
    }
    exit;
}

// Reset bus count endpoint
if ($path === '/buses/reset' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $body = json_decode(file_get_contents('php://input') ?: 'null', true);
        if (!is_array($body) || !isset($body['plateNumber'])) {
            jsonResponse(['error' => 'Plate number is required'], 400);
            exit;
        }

        $plateNumber = trim($body['plateNumber']);
        $stmt = $pdo->prepare("SELECT public.reset_bus_count(?)");
        $stmt->execute([$plateNumber]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        $data = json_decode($result['reset_bus_count'], true);
        jsonResponse($data);
    } catch (Throwable $e) {
        error_log('Reset bus error: ' . $e->getMessage());
        jsonResponse(['error' => 'Failed to reset bus', 'details' => $e->getMessage()], 500);
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

// If no API route matches, serve the React app
$indexFile = __DIR__ . '/index.html';
if (file_exists($indexFile)) {
    header('Content-Type: text/html');
    readfile($indexFile);
} else {
    jsonResponse(['error' => 'Not found'], 404);
}