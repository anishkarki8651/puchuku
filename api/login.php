<?php
// ============================================
// Puchuku API - User Login
// POST /api/login.php
// Body: { email, password }
// ============================================

require_once __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    jsonError('Email and password are required');
}

$db = getDB();

$stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !$user['password'] || !password_verify($password, $user['password'])) {
    jsonError('Invalid email or password', 401);
}

$token = generateJWT($user['id'], $user['email'], $user['name']);

// Auto-create default profile if none exists
$stmt = $db->prepare("SELECT id FROM profiles WHERE user_id = ?");
$stmt->execute([$user['id']]);
if (!$stmt->fetch()) {
    $stmt = $db->prepare("INSERT INTO profiles (user_id, name, avatar) VALUES (?, ?, ?)");
    $stmt->execute([$user['id'], 'Primary', 'https://occ-0-1168-299.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABdpkabKqQAxyWzo6QW_HUmqdyyz_p_9s7N9vAnBye90fWpX8XN7hB60WJkGvId-K3f4pT4O6Lio2L7YshQu6sptV8859944.png']);
}

jsonResponse([
    'token' => $token,
    'user' => [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'avatar' => $user['avatar'],
        'auth_provider' => $user['auth_provider']
    ]
]);
