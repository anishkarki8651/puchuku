import { useState, useEffect, useMemo } from 'react';
import Hero from '../components/Hero';
import ContentRow from '../components/ContentRow';
import {
  getTrending,
  getPopular,
  getTopRated,
  getNowPlaying,
  getOnTheAir,
  getByGenre,
  getHiddenGems
} from '../api/tmdb';
import { GENRES } from '../api/config';
import { getContinueWatching } from '../utils/continueWatching';
import { useAuth } from '../contexts/AuthContext';
import { apiGetMyList } from '../api/backend';
import './Home.css';

function Home() {
  const { isAuthenticated } = useAuth();
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [topRatedTV, setTopRatedTV] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [onTheAir, setOnTheAir] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [horrorMovies, setHorrorMovies] = useState([]);
  const [scifiMovies, setScifiMovies] = useState([]);
  const [hiddenGemsMovies, setHiddenGemsMovies] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myListIds, setMyListIds] = useState(null);

  // Build Set of "{id}-{mediaType}" keys for O(1) lookups in ContentRow
  const myListIdsSet = useMemo(() => {
    if (!myListIds) return null;
    return new Set(myListIds.map(item => `${item.id}-${item.media_type}`));
  }, [myListIds]);

  // Fetch My List once on mount (optimization - was calling API per card)
  useEffect(() => {
    if (!isAuthenticated) return;
    apiGetMyList()
      .then(list => setMyListIds(list))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);

      const [
        trendingData,
        popularMoviesData,
        popularTVData,
        topRatedMoviesData,
        topRatedTVData,
        nowPlayingData,
        onTheAirData,
        actionData,
        comedyData,
        horrorData,
        scifiData,
        hiddenGemsData
      ] = await Promise.all([
        getTrending('all', 'week'),
        getPopular('movie'),
        getPopular('tv'),
        getTopRated('movie'),
        getTopRated('tv'),
        getNowPlaying(),
        getOnTheAir(),
        getByGenre('movie', GENRES.movie.action),
        getByGenre('movie', GENRES.movie.comedy),
        getByGenre('movie', GENRES.movie.horror),
        getByGenre('movie', GENRES.movie.scifi),
        getHiddenGems('movie')
      ]);

      const continueWatchingData = await getContinueWatching();

      setTrending(trendingData);
      setPopularMovies(popularMoviesData);
      setPopularTV(popularTVData);
      setTopRatedMovies(topRatedMoviesData);
      setTopRatedTV(topRatedTVData);
      setNowPlaying(nowPlayingData);
      setOnTheAir(onTheAirData);
      setActionMovies(actionData);
      setComedyMovies(comedyData);
      setHorrorMovies(horrorData);
      setScifiMovies(scifiData);
      setHiddenGemsMovies(hiddenGemsData);
      setContinueWatching(continueWatchingData);
      setLoading(false);
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="puchuku-loader">
          <div className="loader-glow"></div>
          <div className="loader-ring"></div>
          <div className="loader-text">P</div>
        </div>
        <div className="loading-bar-container">
          <div className="loading-bar-fill"></div>
        </div>
      </div>
    );
  }

  const featured = trending.length > 0 ? trending[Math.floor(Math.random() * Math.min(5, trending.length))] : null;

  return (
    <main className="home">
      <Hero featured={featured} />

      <div className="content-rows">
        {continueWatching.length > 0 && (
          <ContentRow title="Continue Watching" items={continueWatching} isContinueWatching={true} myListIds={myListIdsSet} />
        )}
        
        <ContentRow title="Trending Now" items={trending} categoryId="trending" myListIds={myListIdsSet} />
        <ContentRow title="Popular Movies" items={popularMovies} categoryId="movie-popular" myListIds={myListIdsSet} />
        <ContentRow title="Popular TV Shows" items={popularTV} categoryId="tv-popular" myListIds={myListIdsSet} />
        <ContentRow title="Top Rated Movies" items={topRatedMovies} categoryId="movie-top_rated" myListIds={myListIdsSet} />
        <ContentRow title="Top Rated TV Shows" items={topRatedTV} categoryId="tv-top_rated" myListIds={myListIdsSet} />
        <ContentRow title="Hidden Gems" items={hiddenGemsMovies} categoryId="hidden-gems" myListIds={myListIdsSet} />
        <ContentRow title="Now Playing" items={nowPlaying} categoryId="movie-now_playing" myListIds={myListIdsSet} />
        <ContentRow title="TV Shows On Air" items={onTheAir} categoryId="tv-on_the_air" myListIds={myListIdsSet} />
        <ContentRow title="Action Movies" items={actionMovies} categoryId="movie-genre-28" myListIds={myListIdsSet} />
        <ContentRow title="Comedy Movies" items={comedyMovies} categoryId="movie-genre-35" myListIds={myListIdsSet} />
        <ContentRow title="Horror Movies" items={horrorMovies} categoryId="movie-genre-27" myListIds={myListIdsSet} />
        <ContentRow title="Sci-Fi Movies" items={scifiMovies} categoryId="movie-genre-878" myListIds={myListIdsSet} />
      </div>
    </main>
  );
}

export default Home;
