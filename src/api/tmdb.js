import axios from 'axios';
import { ENDPOINTS } from './config';

const api = axios.create({
  timeout: 10000
});

// Fetch trending content
export const getTrending = async (mediaType = 'all', timeWindow = 'week', page = 1) => {
  try {
    const response = await api.get(ENDPOINTS.trending(mediaType, timeWindow, page));
    return response.data.results;
  } catch (error) {
    console.error('Error fetching trending:', error);
    return [];
  }
};

// Fetch popular movies or TV shows
export const getPopular = async (mediaType, page = 1) => {
  try {
    const response = await api.get(ENDPOINTS.popular(mediaType, page));
    return response.data.results;
  } catch (error) {
    console.error('Error fetching popular:', error);
    return [];
  }
};

// Fetch top rated
export const getTopRated = async (mediaType, page = 1) => {
  try {
    const response = await api.get(ENDPOINTS.topRated(mediaType, page));
    return response.data.results;
  } catch (error) {
    console.error('Error fetching top rated:', error);
    return [];
  }
};

// Fetch now playing movies
export const getNowPlaying = async (page = 1) => {
  try {
    const response = await api.get(ENDPOINTS.nowPlaying(page));
    return response.data.results;
  } catch (error) {
    console.error('Error fetching now playing:', error);
    return [];
  }
};

// Fetch TV shows on the air
export const getOnTheAir = async (page = 1) => {
  try {
    const response = await api.get(ENDPOINTS.onTheAir(page));
    return response.data.results;
  } catch (error) {
    console.error('Error fetching on the air:', error);
    return [];
  }
};

// Fetch upcoming movies
export const getUpcoming = async (page = 1) => {
  try {
    const response = await api.get(ENDPOINTS.upcoming(page));
    return response.data.results;
  } catch (error) {
    console.error('Error fetching upcoming:', error);
    return [];
  }
};

// Fetch movie/TV details
export const getDetails = async (mediaType, id) => {
  try {
    const response = await api.get(ENDPOINTS.details(mediaType, id));
    return response.data;
  } catch (error) {
    console.error('Error fetching details:', error);
    return null;
  }
};

// Fetch TV show details with seasons
export const getTVDetails = async (id) => {
  try {
    const response = await api.get(ENDPOINTS.tvDetails(id));
    return response.data;
  } catch (error) {
    console.error('Error fetching TV details:', error);
    return null;
  }
};

// Fetch specific episode details
export const getEpisodeDetails = async (id, season, episode) => {
  try {
    const response = await api.get(ENDPOINTS.episodeDetails(id, season, episode));
    return response.data;
  } catch (error) {
    console.error('Error fetching episode details:', error);
    return null;
  }
};

// Fetch TV season details (with all episodes)
export const getTVSeasonDetails = async (id, season) => {
  try {
    const response = await api.get(ENDPOINTS.seasonDetails(id, season));
    return response.data;
  } catch (error) {
    console.error('Error fetching season details:', error);
    return null;
  }
};

// Search content
export const searchContent = async (query, page = 1) => {
  try {
    const response = await api.get(ENDPOINTS.search(query, page));
    return response.data.results;
  } catch (error) {
    console.error('Error searching:', error);
    return [];
  }
};

// Fetch content by genre
export const getByGenre = async (mediaType, genreId, page = 1) => {
  try {
    const response = await api.get(ENDPOINTS.genre(mediaType, genreId, page));
    return response.data.results;
  } catch (error) {
    console.error('Error fetching by genre:', error);
    return [];
  }
};

// Fetch genres list
export const getGenres = async (mediaType) => {
  try {
    const response = await api.get(ENDPOINTS.genres(mediaType));
    return response.data.genres;
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
};

// Fetch videos (trailers, clips, etc.)
export const getVideos = async (mediaType, id) => {
  try {
    const response = await api.get(ENDPOINTS.videos(mediaType, id));
    return response.data.results;
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
};

// Fetch hidden gems - underrated but good movies
export const getHiddenGems = async (mediaType = 'movie', page = 1) => {
  try {
    const response = await api.get(ENDPOINTS.hiddenGems(mediaType, page));
    return response.data.results;
  } catch (error) {
    console.error('Error fetching hidden gems:', error);
    return [];
  }
};

// Fetch hidden gems for TV shows
export const getHiddenGemsTV = async (page = 1) => {
  try {
    const response = await api.get(ENDPOINTS.hiddenGemsTV(page));
    return response.data.results;
  } catch (error) {
    console.error('Error fetching hidden gems TV:', error);
    return [];
  }
};

// Discover with filters (year, genre, rating)
export const discoverMedia = async (mediaType = 'movie', options = {}, page = 1) => {
  try {
    const response = await api.get(ENDPOINTS.discover(mediaType, options, page));
    return response.data.results;
  } catch (error) {
    console.error('Error discovering media:', error);
    return [];
  }
};

// Fetch images
export const getImages = async (mediaType, id) => {
  try {
    const response = await api.get(ENDPOINTS.images(mediaType, id));
    return response.data;
  } catch (error) {
    console.error('Error fetching images:', error);
    return null;
  }
};

// Helper to get full image URL
export const getImageUrl = (path, size = 'original', type = 'poster') => {
  if (!path) return null;
  const baseUrl = 'https://image.tmdb.org/t/p';
  return `${baseUrl}${size}${path}`;
};