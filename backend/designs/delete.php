<?php

require_once '../config/db.php';
setJsonHeaders();
startSession();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// Get JSON input
$input    = json_decode(file_get_contents('php://input'), true);
$userId   = $_SESSION['user_id'] ?? 0;
$designId = $input['id'] ?? '';

// Check authentication
if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated. Please login.']);
    exit;
}

// Check design ID provided
if (empty($designId)) {
    echo json_encode(['success' => false, 'message' => 'Design ID is required.']);
    exit;
}

$db = getDB();

// Make sure the design belongs to this user before deleting
$check = $db->prepare("SELECT id FROM designs WHERE design_id = ? AND user_id = ? LIMIT 1");
$check->bind_param('si', $designId, $userId);
$check->execute();
$check->store_result();

if ($check->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Design not found or access denied.']);
    $check->close();
    $db->close();
    exit;
}
$check->close();

// Delete the design
$stmt = $db->prepare("DELETE FROM designs WHERE design_id = ? AND user_id = ?");
$stmt->bind_param('si', $designId, $userId);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Design deleted successfully.'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to delete design. Please try again.'
    ]);
}

$stmt->close();
$db->close();
?>