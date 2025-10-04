<?php
require_once __DIR__ . '/db.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

$requestUri = strtok($requestUri, '?');

switch ($requestUri) {
    case '/auth/send-otp':
    case '/auth/verify-otp':
    case '/auth/resend-otp':
    case '/auth/debug':
        require_once 'auth.php';
        break;

    default:
        require_once 'public/index.php';
        break;
}
?>