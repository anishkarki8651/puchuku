// Torrent streaming service - Hybrid approach
// Uses multiple streaming APIs for reliability

// Get direct streaming URL from various providers
const getStreamUrl = async (imdbId, type, season = 1, episode = 1) => {
  const mediaType = type === 'tv' ? 'tv' : 'movie';
  
  // Try multiple streaming APIs
  const providers = [
    // SuperEmbed - reliable direct links
    async () => {
      const url = `https://multiembed.mov/?video_id=${imdbId}&tmdb=1${type === 'tv' ? `&s=${season}&e=${episode}` : ''}`;
      const response = await fetch(url);
      const text = await response.text();
      // Extract source URL from the response
      const match = text.match(/src="([^"]+)"/);
      if (match) return match[1];
      return null;
    },
    
    // VidLink (most reliable)
    async () => {
      const baseUrl = type === 'tv' 
        ? `https://vidlink.pro/tv/${imdbId}/${season}/${episode}?primaryColor=ffffff&secondaryColor=aaaaaa&iconColor=ffffff&autoplay=false`
        : `https://vidlink.pro/movie/${imdbId}?primaryColor=ffffff&secondaryColor=aaaaaa&iconColor=ffffff&autoplay=false`;
      return baseUrl;
    },
    
    // Embed su
    async () => {
      const baseUrl = type === 'tv'
        ? `https://embed.su/embed/tv/${imdbId}/${season}/${episode}`
        : `https://embed.su/embed/movie/${imdbId}`;
      return baseUrl;
    },
    
    // Autoembed
    async () => {
      const baseUrl = type === 'tv'
        ? `https://autoembed.co/tv/tmdb-${imdbId}-${season}-${episode}`
        : `https://autoembed.co/movie/tmdb-${imdbId}`;
      return baseUrl;
    }
  ];

  for (const provider of providers) {
    try {
      const url = await provider();
      if (url) return { url, provider: 'direct' };
    } catch (e) {
      console.log('Provider failed:', e.message);
    }
  }

  return null;
};

// Search for movie/TV show torrents (for manual torrent streaming)
export const searchMedia = async (query, type = 'movie') => {
  try {
    // Use a public API to search
    const response = await fetch(
      `https://api.themoviedb.org/3/search/${type}?api_key=9626c6d085e0e9acd174cb2563728ed1&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    
    if (data.results) {
      return data.results.slice(0, 10).map(item => ({
        id: item.id,
        title: item.title || item.name,
        year: (item.release_date || item.first_air_date || '').split('-')[0],
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : null,
        overview: item.overview,
        type: item.media_type,
        imdbId: null // Would need another API call to get IMDB ID
      }));
    }
  } catch (error) {
    console.error('Search error:', error);
  }
  
  return [];
};

// Get streaming URL for a TMDB item
export const getStreamingUrl = async (tmdbId, type, season, episode) => {
  return await getStreamUrl(tmdbId, type, season, episode);
};

// Get embed sources list
export const getEmbedSources = () => [
  { 
    name: 'VidLink', 
    id: 'vidlink',
    url: (id, type, s, e) => type === 'tv' 
      ? `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=ffffff&secondaryColor=aaaaaa&iconColor=ffffff&autoplay=false`
      : `https://vidlink.pro/movie/${id}?primaryColor=ffffff&secondaryColor=aaaaaa&iconColor=ffffff&autoplay=false`
  },
  { 
    name: 'Embed Su', 
    id: 'embedsu',
    url: (id, type, s, e) => type === 'tv'
      ? `https://embed.su/embed/tv/${id}/${s}/${e}`
      : `https://embed.su/embed/movie/${id}`
  },
  { 
    name: 'SuperEmbed', 
    id: 'superembed',
    url: (id, type, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1${type === 'tv' ? `&s=${s}&e=${e}` : ''}`
  },
  { 
    name: 'AutoEmbed', 
    id: 'autoembed',
    url: (id, type, s, e) => type === 'tv'
      ? `https://autoembed.co/tv/tmdb-${id}-${s}-${e}`
      : `https://autoembed.co/movie/tmdb-${id}`
  },
  { 
    name: '2Embed', 
    id: '2embed',
    url: (id, type, s, e) => type === 'tv'
      ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
      : `https://www.2embed.cc/embed/${id}`
  }
];

// Check if a source is working
export const checkSource = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

export default {
  searchMedia,
  getStreamingUrl,
  getEmbedSources,
  checkSource
};
