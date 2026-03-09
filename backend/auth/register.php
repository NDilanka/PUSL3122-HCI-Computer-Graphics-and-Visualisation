<?php

require_once '../config/db.php';
setJsonHeaders();
startSession();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input    = json_decode(file_get_contents('php://input'), true);
$fullname = trim($input['fullname'] ?? '');
$username = trim($input['username'] ?? '');
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$role     = $input['role'] ?? 'user';

// Validate
if (empty($fullname) || empty($username) || empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}
if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
    exit;
}
if (!in_array($role, ['admin', 'user'])) {
    $role = 'user';
}

$db = getDB();

// Check if username or email already exists
$check = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1");
$check->bind_param('ss', $username, $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Username or email already exists.']);
    $check->close();
    $db->close();
    exit;
}
$check->close();

// Hash password and insert
$hashed = password_hash($password, PASSWORD_DEFAULT);
$stmt   = $db->prepare("INSERT INTO users (full_name, username, email, password, role) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param('sssss', $fullname, $username, $email, $hashed, $role);

if ($stmt->execute()) {
    $newId = $db->insert_id;
    $_SESSION['user_id']   = $newId;
    $_SESSION['username']  = $username;
    $_SESSION['role']      = $role;
    $_SESSION['full_name'] = $fullname;

    echo json_encode([
        'success' => true,
        'message' => 'Account created successfully.',
        'user'    => [
            'id'        => $newId,
            'username'  => $username,
            'full_name' => $fullname,
            'role'      => $role
        ]
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
}

$stmt->close();
$db->close();
?>