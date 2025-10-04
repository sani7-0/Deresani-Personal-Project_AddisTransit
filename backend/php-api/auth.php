<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';

function generateOTP()
{
    return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

function sendOTP($phoneNumber, $otp)
{
    $sid = getenv('TWILIO_ACCOUNT_SID') ?: 'ACf63070c2e796d9f359f93f43699cfdce';
    $token = getenv('TWILIO_AUTH_TOKEN') ?: '7ec4d5122a452619e43b01ceafae7136';
    $from = getenv('TWILIO_FROM_NUMBER') ?: '(817) 893-6372';
    if ($from && $from[0] !== '+') {
        $digits = preg_replace('/\D/', '', $from);
        if (strlen($digits) === 10) {
            $from = '+1' . $digits;
        } elseif (strlen($digits) === 11 && $digits[0] === '1') {
            $from = '+' . $digits;
        } elseif ($digits) {
            $from = '+' . $digits;
        }
    }

    if ($sid && $token && $from) {
        $body = "Your AddisTransit OTP is {$otp}. It expires in 5 minutes.";
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json";
        $postFields = http_build_query([
            'From' => $from,
            'To' => $phoneNumber,
            'Body' => $body,
        ]);

        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERPWD, $sid . ':' . $token);
            curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
            $response = curl_exec($ch);
            if ($response === false) {
                $err = curl_error($ch);
                curl_close($ch);
                error_log('Twilio cURL error: ' . $err);
                return ['success' => false, 'error' => 'Twilio request failed'];
            }
            $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            $data = json_decode($response, true);
            if ($status >= 200 && $status < 300) {
                return [
                    'success' => true,
                    'message_id' => $data['sid'] ?? null,
                    'provider' => 'twilio'
                ];
            }
            $msg = is_array($data) ? ($data['message'] ?? 'Twilio error') : 'Twilio error';
            error_log('Twilio cURL error: HTTP ' . $status . ' ' . $msg . ' Response: ' . $response);
            return ['success' => false, 'error' => $msg, 'status' => $status];
        }

        $auth = base64_encode($sid . ':' . $token);
        $opts = [
            'http' => [
                'method' => 'POST',
                'header' => "Authorization: Basic {$auth}\r\n" .
                    "Content-Type: application/x-www-form-urlencoded\r\n",
                'content' => $postFields,
                'timeout' => 15,
            ]
        ];
        $ctx = stream_context_create($opts);
        $resp = @file_get_contents($url, false, $ctx);
        $status = 0;
        if (isset($http_response_header) && is_array($http_response_header)) {
            foreach ($http_response_header as $h) {
                if (preg_match('#^HTTP/\S+\s+(\d{3})#', $h, $m)) {
                    $status = (int) $m[1];
                    break;
                }
            }
        }
        if ($resp === false) {
            error_log('Twilio stream error: request failed');
            return ['success' => false, 'error' => 'Twilio request failed'];
        }
        $data = json_decode($resp, true);
        if ($status >= 200 && $status < 300) {
            return [
                'success' => true,
                'message_id' => $data['sid'] ?? null,
                'provider' => 'twilio'
            ];
        }
        $msg = is_array($data) ? ($data['message'] ?? 'Twilio error') : 'Twilio error';
        error_log('Twilio stream error: HTTP ' . $status . ' ' . $msg . ' Response: ' . $resp);
        return ['success' => false, 'error' => $msg, 'status' => $status];
    }

    error_log("OTP for {$phoneNumber}: {$otp}");
    return [
        'success' => true,
        'message_id' => 'mock_' . time(),
        'provider' => 'mock'
    ];
}

function validateEthiopianPhone($phone)
{
    $cleaned = preg_replace('/\D/', '', $phone);
    if (preg_match('/^(251|0)?[79]\d{8}$/', $cleaned)) {
        if (strpos($cleaned, '251') === 0) {
            return '+' . $cleaned;
        } elseif (strpos($cleaned, '0') === 0) {
            return '+251' . substr($cleaned, 1);
        }
        return '+251' . $cleaned;
    }
    return false;
}

function normalizePhoneGlobal($phone)
{
    $trimmed = trim($phone);
    if (preg_match('/^\+[1-9]\d{7,14}$/', $trimmed)) {
        return $trimmed;
    }
    $et = validateEthiopianPhone($trimmed);
    return $et ?: false;
}

function generateMengedId($phoneNumber)
{
    $phoneDigits = preg_replace('/\D/', '', $phoneNumber);
    $lastSix = substr($phoneDigits, -6);
    $timestamp = time() % 1000;
    return 'MNG-' . $lastSix . '-' . $timestamp;
}

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

$requestUri = strtok($requestUri, '?');

if (basename($_SERVER['SCRIPT_NAME']) === 'auth.php') {
    if (!in_array($requestUri, ['/auth/send-otp', '/auth/verify-otp', '/auth/resend-otp', '/auth/debug'])) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
        exit;
    }
}

if ($requestMethod === 'POST' && (strpos($requestUri, '/auth/send-otp') !== false || $requestUri === '/auth/send-otp')) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['phone_number'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Phone number is required']);
        exit;
    }

    $phoneNumber = normalizePhoneGlobal($input['phone_number']);
    if (!$phoneNumber) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid Ethiopian phone number']);
        exit;
    }

    if (!isset($pdo) || !$pdo) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database connection failed']);
        exit;
    }

    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS otp_verifications (
                id SERIAL PRIMARY KEY,
                phone_number VARCHAR(20) NOT NULL,
                otp_code VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                is_used BOOLEAN DEFAULT false,
                attempts INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                session_token VARCHAR(64) NOT NULL UNIQUE,
                phone_number VARCHAR(20) NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        ");

        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN phone_number VARCHAR(20)");
        } catch (PDOException $e) {
        }

        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN menged_id VARCHAR(50)");
        } catch (PDOException $e) {
        }

        $otp = generateOTP();

        $stmt = $pdo->prepare("SELECT id, menged_id FROM users WHERE phone_number = ?");
        $stmt->execute([$phoneNumber]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $mengedId = generateMengedId($phoneNumber);
            $stmt = $pdo->prepare("INSERT INTO users (phone_number, menged_id, password_hash, created_at) VALUES (?, ?, ?, NOW())");
            $stmt->execute([$phoneNumber, $mengedId, password_hash('temp_password', PASSWORD_DEFAULT)]);
            $userId = $pdo->lastInsertId();
        } else {
            $userId = $user['id'];
        }

        $stmt = $pdo->prepare("INSERT INTO otp_verifications (phone_number, otp_code, expires_at, created_at) VALUES (?, ?, NOW() + INTERVAL '5 minutes', NOW())");
        $stmt->execute([$phoneNumber, $otp]);

        $smsResult = sendOTP($phoneNumber, $otp);

        if ($smsResult['success']) {
            echo json_encode([
                'success' => true,
                'message' => 'OTP sent successfully',
                'expires_in' => 300,
                'phone_number' => $phoneNumber,
                'provider' => $smsResult['provider'] ?? 'unknown'
            ]);
        } else {
            error_log("SMS send failed: " . json_encode($smsResult));
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to send OTP: ' . ($smsResult['error'] ?? 'Unknown error'),
                'details' => $smsResult
            ]);
        }

    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error occurred']);
    }
}

elseif ($requestMethod === 'POST' && (strpos($requestUri, '/auth/verify-otp') !== false || $requestUri === '/auth/verify-otp')) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['phone_number']) || !isset($input['otp_code'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Phone number and OTP code are required']);
        exit;
    }

    $phoneNumber = normalizePhoneGlobal($input['phone_number']);
    $otpCode = $input['otp_code'];

    if (!$phoneNumber || strlen($otpCode) !== 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid phone number or OTP code']);
        exit;
    }

    if (!isset($pdo) || !$pdo) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database connection failed']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT id, otp_code, expires_at, attempts 
            FROM otp_verifications 
            WHERE phone_number = ? 
            AND expires_at > NOW() 
            AND is_used = false 
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$phoneNumber]);
        $otpRecord = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$otpRecord) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No valid OTP found for this phone number']);
            exit;
        }

        if ($otpRecord['attempts'] >= 3) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Too many failed attempts. Please request a new OTP']);
            exit;
        }

        if ($otpRecord['otp_code'] !== $otpCode) {
            $stmt = $pdo->prepare("UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?");
            $stmt->execute([$otpRecord['id']]);

            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid OTP code']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE otp_verifications SET is_used = true WHERE id = ?");
        $stmt->execute([$otpRecord['id']]);

        $stmt = $pdo->prepare("SELECT id, menged_id FROM users WHERE phone_number = ?");
        $stmt->execute([$phoneNumber]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'User not found']);
            exit;
        }

        $sessionToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + (30 * 24 * 60 * 60));

        $stmt = $pdo->prepare("
            INSERT INTO user_sessions (user_id, session_token, phone_number, expires_at, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$user['id'], $sessionToken, $phoneNumber, $expiresAt]);

        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'menged_id' => $user['menged_id'],
            'phone_number' => $phoneNumber,
            'session_token' => $sessionToken,
            'expires_at' => $expiresAt
        ]);

    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error occurred']);
    }
}

elseif ($requestMethod === 'POST' && (strpos($requestUri, '/auth/resend-otp') !== false || $requestUri === '/auth/resend-otp')) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['phone_number'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Phone number is required']);
        exit;
    }

    $phoneNumber = normalizePhoneGlobal($input['phone_number']);
    if (!$phoneNumber) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid Ethiopian phone number']);
        exit;
    }

    if (!isset($pdo) || !$pdo) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database connection failed']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM otp_verifications 
            WHERE phone_number = ? 
            AND created_at > NOW() - INTERVAL '1 minute'
        ");
        $stmt->execute([$phoneNumber]);
        $recentCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        if ($recentCount > 0) {
            http_response_code(429);
            echo json_encode(['success' => false, 'error' => 'Please wait before requesting another OTP']);
            exit;
        }

        $otp = generateOTP();

        $stmt = $pdo->prepare("INSERT INTO otp_verifications (phone_number, otp_code, expires_at, created_at) VALUES (?, ?, NOW() + INTERVAL '5 minutes', NOW())");
        $stmt->execute([$phoneNumber, $otp]);

        $smsResult = sendOTP($phoneNumber, $otp);

        if ($smsResult['success']) {
            echo json_encode([
                'success' => true,
                'message' => 'OTP resent successfully',
                'expires_in' => 300,
                'phone_number' => $phoneNumber,
                'provider' => $smsResult['provider'] ?? 'unknown'
            ]);
        } else {
            error_log("SMS resend failed: " . json_encode($smsResult));
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to resend OTP: ' . ($smsResult['error'] ?? 'Unknown error'),
                'details' => $smsResult
            ]);
        }

    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error occurred']);
    }
}

elseif ($requestMethod === 'GET' && $requestUri === '/auth/debug') {
    try {
        $tables = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('otp_verifications', 'user_sessions', 'users')")->fetchAll(PDO::FETCH_COLUMN);

        $otpCount = 0;
        $recentOtps = [];
        if (in_array('otp_verifications', $tables)) {
            $otpCount = $pdo->query("SELECT COUNT(*) FROM otp_verifications")->fetchColumn();

            $stmt = $pdo->query("
                SELECT phone_number, otp_code, expires_at, is_used, attempts, created_at 
                FROM otp_verifications 
                ORDER BY created_at DESC 
                LIMIT 5
            ");
            $recentOtps = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode([
            'success' => true,
            'tables_exist' => $tables,
            'otp_records_count' => $otpCount,
            'recent_otps' => $recentOtps,
            'db_connected' => $pdo ? true : false
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

else {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
}
?>