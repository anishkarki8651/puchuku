<?php
// ============================================
// Puchuku API - Get Current User Profile
// GET /api/me.php (requires Authorization header)
// ============================================

require_once __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method not allowed', 405);
}

$authUser = getAuthUser();
$db = getDB();

$stmt = $db->prepare("SELECT id, name, email, avatar, auth_provider, created_at FROM users WHERE id = ?");
$stmt->execute([$authUser['sub']]);
$user = $stmt->fetch();

if (!$user) {
    jsonError('User not found', 404);
}

jsonResponse([
    'user' => [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'avatar' => $user['avatar'],
        'auth_provider' => $user['auth_provider'],
        'created_at' => $user['created_at']
    ]
]);
