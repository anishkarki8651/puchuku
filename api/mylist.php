<?php
// ============================================
// Puchuku API - My List CRUD
// GET    /api/mylist.php         — Fetch user's list
// POST   /api/mylist.php         — Add item to list
// DELETE /api/mylist.php?id=123  — Remove item from list
// ============================================

require_once __DIR__ . '/auth.php';

$authUser = getAuthUser();
$userId = $authUser['sub'];
$db = getDB();

// Profile Context
$profileId = (int)($_SERVER['HTTP_X_PROFILE_ID'] ?? 0);
if (!$profileId) {
    jsonError('Profile context (X-Profile-ID) is required');
}

// Verify profile ownership
$stmt = $db->prepare("SELECT id FROM profiles WHERE id = ? AND user_id = ?");
$stmt->execute([$profileId, $userId]);
if (!$stmt->fetch()) {
    jsonError('Invalid profile context', 403);
}

// ---- GET: Fetch list ----
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare("SELECT * FROM my_list WHERE user_id = ? AND profile_id = ? ORDER BY added_at DESC");
    $stmt->execute([$userId, $profileId]);
    $items = $stmt->fetchAll();

    // Format for frontend
    $formatted = array_map(function($item) {
        return [
            'id' => (int)$item['tmdb_id'],
            'list_id' => (int)$item['id'],
            'media_type' => $item['media_type'],
            'title' => $item['title'],
            'poster_path' => $item['poster_path'],
            'vote_average' => (float)$item['vote_average'],
            'release_date' => $item['release_date'],
            'added_at' => $item['added_at']
        ];
    }, $items);

    jsonResponse(['items' => $formatted]);
}

// ---- POST: Add item ----
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $tmdbId = (int)($input['tmdb_id'] ?? 0);
    $mediaType = $input['media_type'] ?? '';
    $title = trim($input['title'] ?? '');
    $posterPath = $input['poster_path'] ?? null;
    $voteAverage = $input['vote_average'] ?? null;
    $releaseDate = $input['release_date'] ?? null;

    if (!$tmdbId || !in_array($mediaType, ['movie', 'tv']) || empty($title)) {
        jsonError('tmdb_id, media_type, and title are required');
    }

    try {
        $stmt = $db->prepare("INSERT INTO my_list (user_id, profile_id, tmdb_id, media_type, title, poster_path, vote_average, release_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $profileId, $tmdbId, $mediaType, $title, $posterPath, $voteAverage, $releaseDate]);

        jsonResponse(['message' => 'Added to My List', 'list_id' => (int)$db->lastInsertId()], 201);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            jsonError('Item already in your list');
        }
        jsonError('Failed to add item');
    }
}

// ---- DELETE: Remove item ----
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $tmdbId = (int)($_GET['tmdb_id'] ?? 0);
    $mediaType = $_GET['media_type'] ?? '';

    if (!$tmdbId || empty($mediaType)) {
        jsonError('tmdb_id and media_type query parameters are required');
    }

    $stmt = $db->prepare("DELETE FROM my_list WHERE user_id = ? AND profile_id = ? AND tmdb_id = ? AND media_type = ?");
    $stmt->execute([$userId, $profileId, $tmdbId, $mediaType]);

    if ($stmt->rowCount() === 0) {
        jsonError('Item not found in your list', 404);
    }

    jsonResponse(['message' => 'Removed from My List']);
}

jsonError('Method not allowed', 405);
