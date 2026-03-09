<?php


define('DB_HOST', 'localhost');
define('DB_USER', 'root');        
define('DB_PASS', '');           
define('DB_NAME', 'furniture_db');


function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
        exit;
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}


function setJsonHeaders() {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

function startSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

?>