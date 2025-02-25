<?php
header("Content-Type: application/json");

$host = "localhost"; // Change if needed
$user = "root"; // Your database username
$password = ""; // Your database password
$database = "routesync"; // Replace with your actual database name

// Create connection
$conn = new mysqli($host, $user, $password, $database);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Read JSON input from Flutter
$data = json_decode(file_get_contents("php://input"), true);

if (isset($data["email"]) && isset($data["password"])) {
    $email = $conn->real_escape_string($data["email"]);
    $input_password = $data["password"]; // Raw password from user input

    // Query to get the hashed password from the database
    $query = "SELECT id, name, email, roll_no, year, course, bus_stop, phone_number, route_no, password FROM students WHERE email = '$email'";
    $result = $conn->query($query);

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        $stored_hashed_password = $user["password"];

        // Verify the hashed password
        if (password_verify($input_password, $stored_hashed_password)) {
            unset($user["password"]); // Remove password field before sending response
            echo json_encode(["status" => "success", "user" => $user]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Missing email or password"]);
}

$conn->close();
?>