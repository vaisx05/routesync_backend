<?php
header("Content-Type: application/json");
require 'vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$secret_key = "vaishak"; // Use the same key as login.php

$headers = getallheaders();
if (!isset($headers["Authorization"])) {
    echo json_encode(["status" => "error", "message" => "Missing Authorization Token"]);
    exit;
}

$token = str_replace("Bearer ", "", $headers["Authorization"]);

try {
    $decoded = JWT::decode($token, new Key($secret_key, 'HS256'));
    echo json_encode(["status" => "success", "user" => $decoded->data]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Invalid or expired token"]);
}
?>
