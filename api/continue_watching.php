<?php
// ============================================
// Puchuku API - Continue Watching CRUD
// GET    /api/continue_watching.php         — Fetch continue watching list
// POST   /api/continue_watching.php         — Update/add item to continue watching
// DELETE /api/continue_watching.php?id=123 — Remove item from continue watching
// DELETE /api/continue_watching.php?tmdb_id=123&media_type=movie — Remove by tmdb_id
// ============================================

require_once __DIR__ . '/auth.php';

$authUser = getAuthUser();
$userId = $authUser['sub'];
$db = getDB();

// Profile Context (optional for guests)
$profileId = (int)($_SERVER['HTTP_X_PROFILE_ID'] ?? 0);

// ---- GET: Fetch continue watching list ----
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Guests can use local storage, return empty
    if (!$profileId) {
        jsonResponse(['items' => []]);
    }
    
    // Verify profile ownership
    $stmt = $db->prepare("SELECT id FROM profiles WHERE id = ? AND user_id = ?");
    $stmt->execute([$profileId, $userId]);
    if (!$stmt->fetch()) {
        jsonError('Invalid profile context', 403);
    }
    
    $stmt = $db->prepare("SELECT * FROM continue_watching WHERE user_id = ? AND profile_id = ? ORDER BY last_watched DESC");
    $stmt->execute([$userId, $profileId]);
    $items = $stmt->fetchAll();

    // Format for frontend
    $formatted = array_map(function($item) {
        return [
            'id' => (int)$item['tmdb_id'],
            'watch_id' => (int)$item['id'],
            'media_type' => $item['media_type'],
            'title' => $item['title'],
            'poster_path' => $item['poster_path'],
            'vote_average' => $item['vote_average'] ? (float)$item['vote_average'] : null,
            'release_date' => $item['release_date'],
            'season' => $item['season'] ? (int)$item['season'] : null,
            'episode' => $item['episode'] ? (int)$item['episode'] : null,
            'currentTime' => $item['cur_time'] ? (float)$item['cur_time'] : 0,
            'last_watched' => $item['last_watched']
        ];
    }, $items);

    jsonResponse(['items' => $formatted]);
}

// ---- POST: Add or update item in continue watching ----
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Guests use local storage, no server update needed
    if (!$profileId) {
        jsonResponse(['message' => 'Continue watching updated (guest)']);
    }
    
    // Verify profile ownership
    $stmt = $db->prepare("SELECT id FROM profiles WHERE id = ? AND user_id = ?");
    $stmt->execute([$profileId, $userId]);
    if (!$stmt->fetch()) {
        jsonError('Invalid profile context', 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);

    $tmdbId = (int)($input['tmdb_id'] ?? 0);
    $mediaType = $input['media_type'] ?? '';
    $title = trim($input['title'] ?? '');
    $posterPath = $input['poster_path'] ?? null;
    $voteAverage = $input['vote_average'] ?? null;
    $releaseDate = $input['release_date'] ?? null;
    $season = $input['season'] ?? null;
    $episode = $input['episode'] ?? null;
    $currentTime = $input['currentTime'] ?? 0;

    if (!$tmdbId || !in_array($mediaType, ['movie', 'tv']) || empty($title)) {
        jsonError('tmdb_id, media_type, and title are required');
    }

    try {
        // Use INSERT ... ON DUPLICATE KEY UPDATE to upsert
        $stmt = $db->prepare("
            INSERT INTO continue_watching (user_id, profile_id, tmdb_id, media_type, title, poster_path, vote_average, release_date, season, episode, cur_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                title = VALUES(title),
                poster_path = VALUES(poster_path),
                vote_average = VALUES(vote_average),
                release_date = VALUES(release_date),
                season = VALUES(season),
                episode = VALUES(episode),
                cur_time = VALUES(cur_time),
                last_watched = CURRENT_TIMESTAMP
        ");
        $stmt->execute([$userId, $profileId, $tmdbId, $mediaType, $title, $posterPath, $voteAverage, $releaseDate, $season, $episode, $currentTime]);

        jsonResponse(['message' => 'Continue watching updated']);
    } catch (Exception $e) {
        // Log but don't fail - frontend will use localStorage fallback
        error_log('Continue watching save failed, using localStorage: ' . $e->getMessage());
        jsonResponse(['message' => 'Continue watching updated (fallback)']);
    }
}

// ---- DELETE: Remove item from continue watching ----
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Guests use local storage, no server delete needed
    if (!$profileId) {
        jsonResponse(['message' => 'Removed from Continue Watching (guest)']);
    }
    
    $watchId = (int)($_GET['id'] ?? 0);
    $tmdbId = (int)($_GET['tmdb_id'] ?? 0);
    $mediaType = $_GET['media_type'] ?? '';

    // Allow deletion by watch_id (internal) or tmdb_id + media_type
    if ($watchId) {
        $stmt = $db->prepare("DELETE FROM continue_watching WHERE user_id = ? AND profile_id = ? AND id = ?");
        $stmt->execute([$userId, $profileId, $watchId]);
    } elseif ($tmdbId && $mediaType) {
        $stmt = $db->prepare("DELETE FROM continue_watching WHERE user_id = ? AND profile_id = ? AND tmdb_id = ? AND media_type = ?");
        $stmt->execute([$userId, $profileId, $tmdbId, $mediaType]);
    } else {
        jsonError('Either id or tmdb_id+media_type query parameters are required');
    }

    jsonResponse(['message' => 'Removed from Continue Watching']);
}

jsonError('Method not allowed', 405);