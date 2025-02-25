<?php

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "routesync";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]));
}

// Get JSON input and decode it
$data = json_decode(file_get_contents("php://input"), true);

// Debugging: Print received data
header('Content-Type: application/json');
echo json_encode(["received" => $data]);

// Validate input
if (!empty($data["name"]) && !empty($data["email"]) && !empty($data["roll_no"]) &&
    isset($data["year"]) && !empty($data["course"]) && !empty($data["bus_stop"]) &&
    !empty($data["phone_number"]) && !empty($data["password"])) {  // Changed isset to !empty

    $name = $conn->real_escape_string($data["name"]);
    $email = $conn->real_escape_string($data["email"]);
    $roll_no = $conn->real_escape_string($data["roll_no"]);
    $year = intval($data["year"]);
    $course = $conn->real_escape_string($data["course"]);
    $bus_stop = $conn->real_escape_string($data["bus_stop"]);
    $phone_number = $conn->real_escape_string($data["phone_number"]);
    $route_no = !empty($data["route_no"]) ? "'" . $conn->real_escape_string($data["route_no"]) . "'" : "NULL";
    $password = password_hash($data["password"], PASSWORD_BCRYPT);

    // SQL Insert Query
    $sql = "INSERT INTO students (name, email, roll_no, year, course, bus_stop, phone_number, route_no, password) 
            VALUES ('$name', '$email', '$roll_no', '$year', '$course', '$bus_stop', '$phone_number', $route_no, '$password')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Student registered successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Error: " . $conn->error]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
}

$conn->close();

?>
