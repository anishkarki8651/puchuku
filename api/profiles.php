<?php
// ============================================
// Puchuku API - Profile Management
// GET    /api/profiles.php         — Fetch all profiles
// POST   /api/profiles.php         — Create profile
// DELETE /api/profiles.php?id=123  — Delete profile
// ============================================

require_once __DIR__ . '/auth.php';

$authUser = getAuthUser();
$userId = $authUser['sub'];
$db = getDB();

// ensure database schema for profiles exists (migration safety)
function ensureProfilesSchema($db) {
    // create profiles table if it doesn't exist
    $db->exec(
        "CREATE TABLE IF NOT EXISTS profiles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(50) NOT NULL,
            avatar VARCHAR(255) DEFAULT NULL,
            is_kids BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB"
    );

    // add profile_id column and foreign key to my_list if missing
    $col = $db->query("SHOW COLUMNS FROM my_list LIKE 'profile_id'")->fetch();
    if (!$col) {
        $db->exec("ALTER TABLE my_list ADD COLUMN profile_id INT DEFAULT NULL AFTER user_id");
        $db->exec("ALTER TABLE my_list ADD CONSTRAINT fk_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE");
    }
}

try {
    ensureProfilesSchema($db);
} catch (PDOException $e) {
    // if migration fails for any reason just continue; the later
    // requests will surface the actual database error
}


// ---- GET: Fetch profiles ----
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("SELECT * FROM profiles WHERE user_id = ? ORDER BY created_at ASC");
        $stmt->execute([$userId]);
        $profiles = $stmt->fetchAll();

        jsonResponse(['profiles' => $profiles]);
    } catch (PDOException $e) {
        jsonError('Database error: ' . $e->getMessage(), 500);
    }
}

// ---- POST: Create profile ----
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $name = trim($input['name'] ?? '');
        $avatar = $input['avatar'] ?? 'avatar1.png'; // Updated for custom avatars
        // ensure boolean value is converted to integer 0/1 for the database
        $isKids = isset($input['is_kids']) ? ($input['is_kids'] ? 1 : 0) : 0;

        if (empty($name)) {
            jsonError('Profile name is required');
        }

        // Check profile limit
        $stmt = $db->prepare("SELECT COUNT(*) FROM profiles WHERE user_id = ?");
        $stmt->execute([$userId]);
        if ($stmt->fetchColumn() >= 5) {
            jsonError('Maximum of 5 profiles reached');
        }

        $stmt = $db->prepare("INSERT INTO profiles (user_id, name, avatar, is_kids) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $name, $avatar, (int)$isKids]);

        jsonResponse([
            'message' => 'Profile created',
            'profile' => [
                'id' => (int)$db->lastInsertId(),
                'name' => $name,
                'avatar' => $avatar,
                'is_kids' => $isKids
            ]
        ], 201);
    } catch (PDOException $e) {
        jsonError('Database error: ' . $e->getMessage(), 500);
    }
}

// ---- PUT: Update profile ----
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $profileId = (int)($input['id'] ?? 0);
        $name = trim($input['name'] ?? '');
        $avatar = $input['avatar'] ?? '';
        // when present convert to int; keep null if omitted so we won't update it
        $isKids = isset($input['is_kids']) ? ($input['is_kids'] ? 1 : 0) : null;

        if (!$profileId) {
            jsonError('Profile ID is required');
        }

        // Check ownership
        $stmt = $db->prepare("SELECT id FROM profiles WHERE id = ? AND user_id = ?");
        $stmt->execute([$profileId, $userId]);
        if (!$stmt->fetch()) {
            jsonError('Profile not found', 404);
        }

        $updates = [];
        $params = [];

        if (!empty($name)) {
            $updates[] = "name = ?";
            $params[] = $name;
        }
        if (!empty($avatar)) {
            $updates[] = "avatar = ?";
            $params[] = $avatar;
        }
        if ($isKids !== null) {
            $updates[] = "is_kids = ?";
            $params[] = (int)$isKids; // bind as integer
        }

        if (empty($updates)) {
            jsonError('No fields to update');
        }

        $sql = "UPDATE profiles SET " . implode(", ", $updates) . " WHERE id = ? AND user_id = ?";
        $params[] = $profileId;
        $params[] = $userId;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        jsonResponse(['message' => 'Profile updated']);
    } catch (PDOException $e) {
        jsonError('Database error: ' . $e->getMessage(), 500);
    }
}

// ---- DELETE: Remove profile ----
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $profileId = (int)($_GET['id'] ?? 0);

        if (!$profileId) {
            jsonError('Profile ID is required');
        }

        $stmt = $db->prepare("DELETE FROM profiles WHERE id = ? AND user_id = ?");
        $stmt->execute([$profileId, $userId]);

        if ($stmt->rowCount() === 0) {
            jsonError('Profile not found', 404);
        }

        jsonResponse(['message' => 'Profile deleted']);
    } catch (PDOException $e) {
        jsonError('Database error: ' . $e->getMessage(), 500);
    }
}

jsonError('Method not allowed', 405);
