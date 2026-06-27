<?php
// ============================================
// Puchuku API - JWT Authentication Helpers
// ============================================

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function generateJWT($userId, $email, $name) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'sub' => $userId,
        'email' => $email,
        'name' => $name,
        'iat' => time(),
        'exp' => time() + JWT_EXPIRY
    ]);

    $base64Header = base64UrlEncode($header);
    $base64Payload = base64UrlEncode($payload);
    $signature = hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET, true);
    $base64Signature = base64UrlEncode($signature);

    return "$base64Header.$base64Payload.$base64Signature";
}

function verifyJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$base64Header, $base64Payload, $base64Signature] = $parts;

    // Verify signature
    $expectedSig = base64UrlEncode(
        hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET, true)
    );

    if (!hash_equals($expectedSig, $base64Signature)) return null;

    $payload = json_decode(base64UrlDecode($base64Payload), true);

    // Check expiry
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) return null;

    return $payload;
}

function getAuthUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
        jsonError('Authentication required', 401);
    }

    $payload = verifyJWT($matches[1]);
    if (!$payload) {
        jsonError('Invalid or expired token', 401);
    }

    return $payload;
}
