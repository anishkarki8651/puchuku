import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token and Profile ID to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('puchuku_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const profile = localStorage.getItem('puchuku_active_profile');
    if (profile) {
        const profileData = JSON.parse(profile);
        config.headers['X-Profile-ID'] = profileData.id;
    }
    return config;
});

// ── Auth ──────────────────────────────────────

export const apiRegister = async (name, email, password) => {
    const res = await api.post('/register.php', { name, email, password });
    return res.data;
};

export const apiLogin = async (email, password) => {
    const res = await api.post('/login.php', { email, password });
    return res.data;
};

export const apiGetMe = async () => {
    const res = await api.get('/me.php');
    return res.data;
};

// ── My List ───────────────────────────────────

export const apiGetMyList = async () => {
    const res = await api.get('/mylist.php');
    return res.data.items;
};

export const apiAddToMyList = async (item) => {
    const res = await api.post('/mylist.php', {
        tmdb_id: item.id,
        media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
        title: item.title || item.name,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
    });
    return res.data;
};

export const apiRemoveFromMyList = async (tmdbId, mediaType) => {
    const res = await api.delete(`/mylist.php?tmdb_id=${tmdbId}&media_type=${mediaType}`);
    return res.data;
};

// ── Profiles ──────────────────────────────────

export const apiGetProfiles = async () => {
    const res = await api.get('/profiles.php');
    return res.data.profiles;
};

export const apiCreateProfile = async (name, avatar, isKids = false) => {
    const res = await api.post('/profiles.php', { name, avatar, is_kids: isKids });
    return res.data.profile;
};

export const apiUpdateProfile = async (id, name, avatar) => {
    const res = await api.put('/profiles.php', { id, name, avatar });
    return res.data;
};

export const apiDeleteProfile = async (profileId) => {
    const res = await api.delete(`/profiles.php?id=${profileId}`);
    return res.data;
};

// ── Continue Watching ──────────────────────────

export const apiGetContinueWatching = async () => {
    const res = await api.get('/continue_watching.php');
    return res.data.items;
};

export const apiUpdateContinueWatching = async (item) => {
    const res = await api.post('/continue_watching.php', {
        tmdb_id: item.id,
        media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
        title: item.title || item.name,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        season: item.season || null,
        episode: item.episode || null,
        currentTime: item.currentTime || 0,
    });
    return res.data;
};

export const apiRemoveFromContinueWatching = async (tmdbId, mediaType) => {
    const res = await api.delete(`/continue_watching.php?tmdb_id=${tmdbId}&media_type=${mediaType}`);
    return res.data;
};
