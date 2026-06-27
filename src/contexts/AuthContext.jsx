import { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiRegister, apiGetMe } from '../api/backend';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [activeProfile, setActiveProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Rehydrate session on mount
    useEffect(() => {
        const token = localStorage.getItem('puchuku_token');
        if (token) {
            apiGetMe()
                .then((data) => {
                    setUser(data.user);
                    // Rehydrate Profile if exists
                    const savedProfile = localStorage.getItem('puchuku_active_profile');
                    if (savedProfile) {
                        setActiveProfile(JSON.parse(savedProfile));
                    }
                })
                .catch(() => {
                    localStorage.removeItem('puchuku_token');
                    localStorage.removeItem('puchuku_active_profile');
                    setUser(null);
                    setActiveProfile(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const selectProfile = (profile) => {
        setActiveProfile(profile);
        localStorage.setItem('puchuku_active_profile', JSON.stringify(profile));
    };

    const clearProfile = () => {
        setActiveProfile(null);
        localStorage.removeItem('puchuku_active_profile');
    };

    const login = async (email, password) => {
        const data = await apiLogin(email, password);
        localStorage.setItem('puchuku_token', data.token);
        setUser(data.user);
        return data.user;
    };

    const register = async (name, email, password) => {
        const data = await apiRegister(name, email, password);
        localStorage.setItem('puchuku_token', data.token);
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem('puchuku_token');
        localStorage.removeItem('puchuku_active_profile');
        setUser(null);
        setActiveProfile(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            profiles,
            setProfiles,
            activeProfile,
            selectProfile,
            clearProfile,
            loading,
            isAuthenticated: !!user,
            login,
            register,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
