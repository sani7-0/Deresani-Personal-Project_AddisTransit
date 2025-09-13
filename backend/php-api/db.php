<?php
// Database connection for PostgreSQL
// Update these values to match your PostgreSQL setup

$host = 'localhost';
$port = '5432';
$dbname = 'transit';
$username = 'postgres';
$password = 'felonynumber1'; // Change this to your PostgreSQL password

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    error_log('Database connection failed: ' . $e->getMessage());
    throw new Exception('Database connection failed: ' . $e->getMessage());
}