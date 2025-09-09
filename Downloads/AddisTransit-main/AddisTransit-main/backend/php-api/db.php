<?php
declare(strict_types=1);

$DB_HOST = getenv('DB_HOST') ?: '127.0.0.1';
$DB_NAME = getenv('DB_NAME') ?: 'transit';
$DB_USER = getenv('DB_USER') ?: 'postgres';
$DB_PASS = getenv('DB_PASS') ?: 'felonynumber1';
$DB_PORT = getenv('DB_PORT') ?: '5432';

try {
    $pdo = new PDO("pgsql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_NAME", $DB_USER, $DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'DB connection failed', 'details' => $e->getMessage()]);
    exit;
}
