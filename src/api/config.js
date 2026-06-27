// TMDB API Configuration
export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Image sizes
export const IMAGE_SIZES = {
  poster: {
    small: '/w185',
    medium: '/w342',
    large: '/w500',
    original: '/original'
  },
  backdrop: {
    small: '/w300',
    medium: '/w780',
    large: '/w1280',
    original: '/original'
  },
  profile: {
    small: '/w45',
    medium: '/w185',
    large: '/h632',
    original: '/original'
  }
};

// Embed sources for streaming
export const EMBED_SOURCES = {
  vidlink: (type, id, season = 1, episode = 1) => {
    if (type === 'movie') {
      return `https://vidlink.pro/movie/${id}?primaryColor=ffffff&secondaryColor=aaaaaa&iconColor=ffffff&autoplay=false`;
    }
    return `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=ffffff&secondaryColor=aaaaaa&iconColor=ffffff&autoplay=false&nextbutton=true`;
  },
  // HLS stream using custom player (handled separately in Watch.jsx)
  'vidlink-hls': () => '',
  superembed: (type, id, season = 1, episode = 1) => {
    if (type === 'movie') {
      return `https://multiembed.mov/?video_id=${id}&tmdb=1`;
    }
    return `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;
  },
  autoembed: (type, id, season = 1, episode = 1) => {
    if (type === 'movie') {
      return `https://autoembed.cc/embed/movie/${id}`;
    }
    return `https://autoembed.cc/embed/tv/${id}/${season}/${episode}`;
  },
  embedsu: (type, id, season = 1, episode = 1) => {
    if (type === 'movie') {
      return `https://embed.su/embed/movie/${id}`;
    }
    return `https://embed.su/embed/tv/${id}/${season}/${episode}`;
  },
  // 2embed: (type, id, season = 1, episode = 1) => {
  //   if (type === 'movie') {
  //     return `https://www.2embed.cc/embed/${id}`;
  //   }
  //   return `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;
  // }
};

// Default embed source
export const DEFAULT_EMBED = 'vidlink-hls';

// API Endpoints
export const ENDPOINTS = {
  trending: (mediaType = 'all', timeWindow = 'week', page = 1) =>
    `${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}?api_key=${TMDB_API_KEY}&page=${page}`,

  popular: (mediaType, page = 1) =>
    `${TMDB_BASE_URL}/${mediaType}/popular?api_key=${TMDB_API_KEY}&page=${page}`,

  topRated: (mediaType, page = 1) =>
    `${TMDB_BASE_URL}/${mediaType}/top_rated?api_key=${TMDB_API_KEY}&page=${page}`,

  nowPlaying: (page = 1) =>
    `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&page=${page}`,

  onTheAir: (page = 1) =>
    `${TMDB_BASE_URL}/tv/on_the_air?api_key=${TMDB_API_KEY}&page=${page}`,

  upcoming: (page = 1) =>
    `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&page=${page}`,

  details: (mediaType, id) =>
    `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos,similar,recommendations`,

  tvDetails: (id) =>
    `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos,similar,recommendations`,

  search: (query, page = 1) =>
    `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`,

  genre: (mediaType, genreId, page = 1) =>
    `${TMDB_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${page}`,

  genres: (mediaType) =>
    `${TMDB_BASE_URL}/genre/${mediaType}/list?api_key=${TMDB_API_KEY}`,

  videos: (mediaType, id) =>
    `${TMDB_BASE_URL}/${mediaType}/${id}/videos?api_key=${TMDB_API_KEY}`,

  images: (mediaType, id) =>
    `${TMDB_BASE_URL}/${mediaType}/${id}/images?api_key=${TMDB_API_KEY}`,

  episodeDetails: (id, season, episode) =>
    `${TMDB_BASE_URL}/tv/${id}/season/${season}/episode/${episode}?api_key=${TMDB_API_KEY}`,

  seasonDetails: (id, season) =>
    `${TMDB_BASE_URL}/tv/${id}/season/${season}?api_key=${TMDB_API_KEY}`,

  // Hidden gems - underrated movies (vote 6.5-7.5, min 200 votes)
  hiddenGems: (mediaType = 'movie', page = 1) =>
    `${TMDB_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&page=${page}&vote_average.gte=6.5&vote_average.lte=7.5&vote_count.gte=200&sort_by=vote_count.desc`,

  // Hidden gems for TV
  hiddenGemsTV: (page = 1) =>
    `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&page=${page}&vote_average.gte=6.5&vote_average.lte=7.5&vote_count.gte=150&sort_by=vote_count.desc`,

  // Advanced search/discover with filters
  discover: (mediaType, options = {}, page = 1) => {
    const params = new URLSearchParams()
    params.append('api_key', TMDB_API_KEY)
    params.append('page', page)
    
    if (options.genre) params.append('with_genres', options.genre)
    if (options.year) params.append('primary_release_year', options.year)
    if (options.ratingFrom) params.append('vote_average.gte', options.ratingFrom)
    if (options.ratingTo) params.append('vote_average.lte', options.ratingTo)
    if (options.sortBy) params.append('sort_by', options.sortBy)
    
    return `${TMDB_BASE_URL}/discover/${mediaType}?${params.toString()}`
  }
};

// Genre IDs for filtering
export const GENRES = {
  movie: {
    action: 28,
    adventure: 12,
    animation: 16,
    comedy: 35,
    crime: 80,
    documentary: 99,
    drama: 18,
    family: 10751,
    fantasy: 14,
    history: 36,
    horror: 27,
    music: 10402,
    mystery: 9648,
    romance: 10749,
    scifi: 878,
    thriller: 53,
    war: 10752,
    western: 37
  },
  tv: {
    action: 10759,
    animation: 16,
    comedy: 35,
    crime: 80,
    documentary: 99,
    drama: 18,
    family: 10751,
    mystery: 9648,
    news: 10763,
    reality: 10764,
    scifi: 10765,
    talk: 10767,
    war: 10768,
    western: 37
  }
};