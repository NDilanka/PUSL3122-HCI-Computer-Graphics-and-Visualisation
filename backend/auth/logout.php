<?php

require_once '../config/db.php';
setJsonHeaders();
startSession();

$_SESSION = [];
session_destroy();

echo json_encode(['success' => true, 'message' => 'Logged out successfully.']);
?>