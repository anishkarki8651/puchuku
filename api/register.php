<?php
// ============================================
// Puchuku API - User Registration
// POST /api/register.php
// Body: { name, email, password }
// ============================================

require_once __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

// Validation
if (empty($name) || strlen($name) < 2) {
    jsonError('Name must be at least 2 characters');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Invalid email address');
}
if (strlen($password) < 6) {
    jsonError('Password must be at least 6 characters');
}

$db = getDB();

// Check if email exists
$stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    jsonError('Email already registered');
}

// Create user
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);
$stmt = $db->prepare("INSERT INTO users (name, email, password, auth_provider) VALUES (?, ?, ?, 'local')");
$stmt->execute([$name, $email, $hashedPassword]);
$userId = $db->lastInsertId();

// Generate JWT
$token = generateJWT($userId, $email, $name);

// Auto-create default profile for new user
$stmt = $db->prepare("INSERT INTO profiles (user_id, name, avatar) VALUES (?, ?, ?)");
$stmt->execute([$userId, 'Primary', 'https://occ-0-1168-299.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABdpkabKqQAxyWzo6QW_HUmqdyyz_p_9s7N9vAnBye90fWpX8XN7hB60WJkGvId-K3f4pT4O6Lio2L7YshQu6sptV8859944.png']);

jsonResponse([
    'token' => $token,
    'user' => [
        'id' => (int)$userId,
        'name' => $name,
        'email' => $email,
        'avatar' => null,
        'auth_provider' => 'local'
    ]
], 201);
