<?php
require_once __DIR__ . '/db.php';
$db = getDB();
try {
    $stmt = $db->query("DESCRIBE profiles");
    echo json_encode($stmt->fetchAll());
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
