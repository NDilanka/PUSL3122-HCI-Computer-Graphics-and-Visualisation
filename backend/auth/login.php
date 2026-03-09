<?php

require_once '../config/db.php';
setJsonHeaders();
startSession();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// Get Json Input
$input = json_decode(file_get_contents('php://input'), true);

$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';
$role     = $input['role'] ?? 'user';


// Basic Validation
if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit;
}

$db   = getDB();
$stmt = $db->prepare("SELECT id, username, full_name, password, role FROM users WHERE username = ? AND role = ? LIMIT 1");
$stmt->bind_param('ss', $username, $role);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid username, password, or account type.']);
    $stmt->close();
    $db->close();
    exit;
}

$user = $result->fetch_assoc();


// Create session
$_SESSION['user_id']   = $user['id'];
$_SESSION['username']  = $user['username'];
$_SESSION['role']      = $user['role'];
$_SESSION['full_name'] = $user['full_name'];

echo json_encode([
    'success' => true,
    'message' => 'Login successful.',
    'user'    => [
        'id'        => $user['id'],
        'username'  => $user['username'],
        'full_name' => $user['full_name'],
        'role'      => $user['role']
    ]
]);

$stmt->close();
$db->close();

?>