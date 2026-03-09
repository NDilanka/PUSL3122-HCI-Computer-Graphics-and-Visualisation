<?php

require_once '../config/db.php';
setJsonHeaders();
startSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

$input     = json_decode(file_get_contents('php://input'), true);
$userId    = $_SESSION['user_id'] ?? 0;
$designId  = $input['id'] ?? null;
$name      = trim($input['name'] ?? 'Untitled');
$roomData  = json_encode(['shape' => $input['roomShape'] ?? '', 'color' => $input['roomColor'] ?? '']);
$furniData = json_encode($input['furniture'] ?? []);

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

$db = getDB();

// Check if design exists for this user
$check = $db->prepare("SELECT id FROM designs WHERE design_id = ? AND user_id = ? LIMIT 1");
$check->bind_param('si', $designId, $userId);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    // Update
    $stmt = $db->prepare("UPDATE designs SET design_name=?, room_data=?, furniture_data=? WHERE design_id=? AND user_id=?");
    $stmt->bind_param('ssssi', $name, $roomData, $furniData, $designId, $userId);
} else {
    // Insert
    $stmt = $db->prepare("INSERT INTO designs (design_id, user_id, design_name, room_data, furniture_data) VALUES (?,?,?,?,?)");
    $stmt->bind_param('sisss', $designId, $userId, $name, $roomData, $furniData);
}

$check->close();

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Design saved.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to save design.']);
}
$stmt->close();
$db->close();
?>