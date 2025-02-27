<?php
header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

require 'vendor/autoload.php'; // Include JWT library
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// CORS preflight request handling
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection
$host = "localhost"; 
$user = "root"; 
$password = ""; 
$database = "routesync";

$conn = new mysqli($host, $user, $password, $database);
if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]));
}

$secret_key = "vaishak"; // Use the same secret key as in login.php

// Fetch headers
$headers = getallheaders();

// Debugging: Log received headers
file_put_contents("debug_headers.txt", json_encode($headers, JSON_PRETTY_PRINT));

// Handle missing Authorization header
$authorization = $headers["Authorization"] ?? $headers["authorization"] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER["REDIRECT_HTTP_AUTHORIZATION"] ?? null;

if (!$authorization) {
    echo json_encode(["status" => "error", "message" => "Missing Authorization Token"]);
    exit;
}

// Extract and decode JWT token
$token = str_replace("Bearer ", "", $authorization);

try {
    $decoded = JWT::decode($token, new Key($secret_key, 'HS256'));
    $user_data = (array)$decoded->data;

    // Get user email from token data
    $email = $conn->real_escape_string($user_data["email"]);

    // Fetch all student details from database
    $query = "SELECT id, name, email, roll_no, year, course, bus_stop, phone_number, route_no FROM students WHERE email = '$email'";
    $result = $conn->query($query);

    if ($result->num_rows > 0) {
        $student = $result->fetch_assoc();
        echo json_encode(["status" => "success", "student" => $student]);
    } else {
        echo json_encode(["status" => "error", "message" => "Student not found"]);
    }
} catch (Exception $e) {
    echo json_encode([
        "status" => "error", 
        "message" => "Invalid or expired token", 
        "details" => $e->getMessage()
    ]);
}

$conn->close();
