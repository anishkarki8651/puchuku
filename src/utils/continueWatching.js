// continueWatching.js
import { 
    apiGetContinueWatching, 
    apiUpdateContinueWatching, 
    apiRemoveFromContinueWatching 
} from '../api/backend';

// Local storage fallback for guest users
const getProfileKey = () => {
    const profile = localStorage.getItem('puchuku_active_profile');
    if (profile) {
        const profileData = JSON.parse(profile);
        return `puchuku_continue_watching_${profileData.id}`;
    }
    return 'puchuku_continue_watching_guest';
};

const MAX_ITEMS = 20;

// Check if user is logged in
const isLoggedIn = () => {
    const token = localStorage.getItem('puchuku_token');
    return !!token;
};

// Local storage fallback functions
const getContinueWatchingLocal = () => {
    try {
        const key = getProfileKey();
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting continue watching (local):', error);
        return [];
    }
};

const addToContinueWatchingLocal = (item, type, season = null, episode = null, currentTime = 0) => {
    if (!item || !item.id) return;

    try {
        const currentList = getContinueWatchingLocal();

        const newItem = {
            id: item.id,
            title: item.title || item.name,
            poster_path: item.poster_path,
            media_type: type,
            vote_average: item.vote_average,
            release_date: item.release_date || item.first_air_date,
            last_watched: Date.now(),
            season,
            episode,
            currentTime
        };

        const filteredList = currentList.filter(i => i.id !== item.id);
        const updatedList = [newItem, ...filteredList].slice(0, MAX_ITEMS);

        const key = getProfileKey();
        localStorage.setItem(key, JSON.stringify(updatedList));
    } catch (error) {
        console.error('Error adding to continue watching (local):', error);
    }
};

const removeFromContinueWatchingLocal = (id, mediaType) => {
    try {
        const currentList = getContinueWatchingLocal();
        const updatedList = currentList.filter(item => !(item.id === id && item.media_type === mediaType));
        const key = getProfileKey();
        localStorage.setItem(key, JSON.stringify(updatedList));
    } catch (error) {
        console.error('Error removing from continue watching (local):', error);
    }
};

// ── Public API ────────────────────────────────────

export const getContinueWatching = async () => {
    if (!isLoggedIn()) {
        return getContinueWatchingLocal();
    }

    try {
        const items = await apiGetContinueWatching();
        return items || [];
    } catch (error) {
        console.error('Error fetching continue watching:', error);
        // Fallback to local storage on error
        return getContinueWatchingLocal();
    }
};

export const addToContinueWatching = async (
    item,
    type,
    season = null,
    episode = null,
    currentTime = 0
) => {
    if (!item || !item.id) return;

    // 🚫 CRITICAL FIX: Prevent overwriting with 0 or invalid time
    if (!currentTime || currentTime < 5) {
        console.log('Skipping update: currentTime too small:', currentTime);
        return;
    }

    const watchItem = {
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        media_type: type,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        season,
        episode,
        currentTime
    };

    if (!isLoggedIn()) {
        addToContinueWatchingLocal(item, type, season, episode, currentTime);
        return;
    }

    try {
        // 🧠 OPTIONAL SMART CHECK: prevent overwriting higher progress
        const existingTime = await getResumePosition(item.id, type, season, episode);

        if (existingTime && currentTime <= existingTime) {
            console.log('Skipping update: lower progress than existing');
            return;
        }

        console.log('Updating continue watching:', watchItem);
        await apiUpdateContinueWatching(watchItem);

    } catch (error) {
        console.error('Error updating continue watching:', error);
        addToContinueWatchingLocal(item, type, season, episode, currentTime);
    }
};

export const getResumePosition = async (id, type, season = null, episode = null) => {
    console.log('getResumePosition called:', id, type, season, episode);
    
    // 1. For logged in users, prioritize the Database API first
    if (isLoggedIn()) {
        try {
            console.log('Checking API for logged in user');
            const response = await apiGetContinueWatching();
            
            // Handle both direct array or PHP's { items: [...] } response wrapper
            const items = Array.isArray(response) ? response : (response?.items || []);
            console.log('API returned items:', items);
            
            const item = items.find(i => 
                String(i.id) === String(id) && 
                i.media_type === type &&
                (type !== 'tv' || (String(i.season) === String(season) && String(i.episode) === String(episode)))
            );
            
            if (item?.currentTime) {
                console.log('Found item in API:', item);
                return item.currentTime;
            }
        } catch (error) {
            console.error('Error fetching resume position from API:', error);
        }
    }
    
    // 2. Fallback to local storage (or if guest)
    const list = getContinueWatchingLocal();
    const localItem = list.find(i => 
        String(i.id) === String(id) && 
        i.media_type === type &&
        (type !== 'tv' || (String(i.season) === String(season) && String(i.episode) === String(episode)))
    );
    
    if (localItem?.currentTime) {
        console.log('Returning local position:', localItem.currentTime);
        return localItem.currentTime;
    }
    
    return 0;
};

export const removeFromContinueWatching = async (id, mediaType) => {
    if (!isLoggedIn()) {
        removeFromContinueWatchingLocal(id, mediaType);
        return;
    }

    try {
        await apiRemoveFromContinueWatching(id, mediaType);
    } catch (error) {
        console.error('Error removing from continue watching:', error);
        // Fallback to local on error
        removeFromContinueWatchingLocal(id, mediaType);
    }
};
