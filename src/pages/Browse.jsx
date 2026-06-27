import { useState, useEffect, useMemo } from 'react';
import Hero from '../components/Hero';
import ContentRow from '../components/ContentRow';
import {
    getTrending,
    getPopular,
    getTopRated,
    getByGenre,
    getGenres
} from '../api/tmdb';
import { GENRES } from '../api/config';
import { useAuth } from '../contexts/AuthContext';
import { apiGetMyList } from '../api/backend';
import './Home.css'; // Reuse home styles for layout consistency

function Browse({ type }) {
    const { isAuthenticated } = useAuth();
    const [trending, setTrending] = useState([]);
    const [popular, setPopular] = useState([]);
    const [topRated, setTopRated] = useState([]);
    const [genres, setGenres] = useState([]);
    const [genreResults, setGenreResults] = useState({});
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
        const fetchData = async () => {
            setLoading(true);

            const typeGenres = type === 'movie' ? GENRES.movie : GENRES.tv;
            const genreKeys = Object.keys(typeGenres).slice(0, 5); // Just 5 genres to start

            const [
                trendingData,
                popularData,
                topRatedData,
                allGenres
            ] = await Promise.all([
                getTrending(type, 'week'),
                getPopular(type),
                getTopRated(type),
                getGenres(type)
            ]);

            const genrePromises = genreKeys.map(key => getByGenre(type, typeGenres[key]));
            const genreResultsData = await Promise.all(genrePromises);

            const genreMap = {};
            genreKeys.forEach((key, index) => {
                genreMap[key] = genreResultsData[index];
            });

            setTrending(trendingData);
            setPopular(popularData);
            setTopRated(topRatedData);
            setGenres(allGenres);
            setGenreResults(genreMap);
            setLoading(false);
        };

        fetchData();
    }, [type]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
            </div>
        );
    }

    const featured = trending.length > 0 ? trending[Math.floor(Math.random() * Math.min(5, trending.length))] : null;
    const pageTitle = type === 'movie' ? 'Movies' : 'TV Shows';

    return (
        <main className="browse-page">
            <Hero featured={featured} />

            <div className="content-rows">
                <h1 className="page-title-overlay">{pageTitle}</h1>
                <ContentRow title={`Trending ${pageTitle}`} items={trending} categoryId={`${type}-trending`} myListIds={myListIdsSet} />
                <ContentRow title={`Popular ${pageTitle}`} items={popular} categoryId={`${type}-popular`} myListIds={myListIdsSet} />
                <ContentRow title={`Top Rated ${pageTitle}`} items={topRated} categoryId={`${type}-top_rated`} myListIds={myListIdsSet} />

                {Object.keys(genreResults).map(genreKey => (
                    <ContentRow
                        key={genreKey}
                        title={`${genreKey.charAt(0).toUpperCase() + genreKey.slice(1)} ${pageTitle}`}
                        items={genreResults[genreKey]}
                        categoryId={`${type}-genre-${GENRES[type][genreKey]}`}
                        myListIds={myListIdsSet}
                    />
                ))}
            </div>

            <style jsx="true">{`
        .page-title-overlay {
          padding: 0 10vw;
          margin-top: -40px;
          position: relative;
          z-index: 10;
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -2px;
          pointer-events: none;
        }
        
        @media (max-width: 768px) {
          .page-title-overlay {
            font-size: 2.5rem;
            margin-top: -60px;
          }
        }
      `}</style>
        </main>
    );
}

export default Browse;
