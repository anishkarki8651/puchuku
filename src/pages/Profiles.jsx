import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaCheck, FaPencilAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { apiGetProfiles, apiCreateProfile, apiDeleteProfile, apiUpdateProfile } from '../api/backend';
import './Profiles.css';

const AVATAR_BASE = 'https://anishkarki37.com.np/puchuku/avatars/';
const AVATARS = [
    `${AVATAR_BASE}avatar1.png`,
    `${AVATAR_BASE}avatar2.png`,
    `${AVATAR_BASE}avatar3.png`,
    `${AVATAR_BASE}avatar4.png`,
    `${AVATAR_BASE}avatar5.png`,
    `${AVATAR_BASE}avatar6.png`
];

function Profiles() {
    const { user, profiles, setProfiles, selectProfile, activeProfile } = useAuth();
    const [isManageMode, setIsManageMode] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [newProfileName, setNewProfileName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfiles();
        if (searchParams.get('manage') === 'true') {
            setIsManageMode(true);
        }
    }, [searchParams]);

    const fetchProfiles = async () => {
        try {
            const data = await apiGetProfiles();
            setProfiles(data);
        } catch (error) {
            console.error('Failed to fetch profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (profile) => {
        if (isManageMode) {
            setEditingProfile(profile);
            setNewProfileName(profile.name);
            setSelectedAvatar(profile.avatar);
            setShowAddModal(true);
            return;
        }
        selectProfile(profile);
        navigate('/');
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!newProfileName.trim()) return;

        try {
            if (editingProfile) {
                await apiUpdateProfile(editingProfile.id, newProfileName, selectedAvatar);
                setProfiles(profiles.map(p => p.id === editingProfile.id ? { ...p, name: newProfileName, avatar: selectedAvatar } : p));
                // Update active profile if it was the one being edited
                if (activeProfile?.id === editingProfile.id) {
                    selectProfile({ ...activeProfile, name: newProfileName, avatar: selectedAvatar });
                }
            } else {
                const newProfile = await apiCreateProfile(newProfileName, selectedAvatar);
                setProfiles([...profiles, newProfile]);
            }
            handleCloseModal();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to save profile');
        }
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingProfile(null);
        setNewProfileName('');
        setSelectedAvatar(AVATARS[0]);
    };

    const handleDeleteProfile = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this profile?')) return;

        try {
            await apiDeleteProfile(id);
            setProfiles(profiles.filter(p => p.id !== id));
        } catch (error) {
            alert('Failed to delete profile');
        }
    };

    if (loading) return (
        <div className="profiles-loading">
            <div className="puchuku-loader">
                <div className="loader-ring"></div>
                <div className="loader-text">P</div>
            </div>
        </div>
    );

    return (
        <div className="profiles-container">
            <motion.div
                className="profiles-wrapper"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <h1 className="profiles-title">Who's watching?</h1>

                <div className="profiles-list">
                    {profiles.map((profile) => (
                        <motion.div
                            key={profile.id}
                            className={`profile-card ${isManageMode ? 'manage' : ''}`}
                            onClick={() => handleSelect(profile)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="profile-avatar-wrapper">
                                <img src={profile.avatar} alt={profile.name} className="profile-avatar" />
                                {isManageMode && (
                                    <div className="profile-manage-overlay">
                                        <div className="profile-manage-actions">
                                            <div className="profile-edit-badge">
                                                <FaPencilAlt />
                                            </div>
                                            <button className="profile-delete-btn" onClick={(e) => handleDeleteProfile(e, profile.id)}>
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <span className="profile-name">{profile.name}</span>
                        </motion.div>
                    ))}

                    {profiles.length < 5 && (
                        <motion.div
                            className="profile-card add-profile"
                            onClick={() => setShowAddModal(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="profile-avatar-wrapper add">
                                <FaPlus className="add-icon" />
                            </div>
                            <span className="profile-name">Add Profile</span>
                        </motion.div>
                    )}
                </div>

                <button
                    className="manage-profiles-btn"
                    onClick={() => setIsManageMode(!isManageMode)}
                >
                    {isManageMode ? 'Done' : 'Manage Profiles'}
                </button>
            </motion.div>

            {/* Add Profile Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        className="profile-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="profile-modal"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                        >
                            <h2 className="modal-title">{editingProfile ? 'Edit Profile' : 'Add Profile'}</h2>
                            <form onSubmit={handleSaveProfile}>
                                <div className="avatar-selection">
                                    <p>Choose an avatar:</p>
                                    <div className="avatar-grid">
                                        {AVATARS.map((url) => (
                                            <div
                                                key={url}
                                                className={`avatar-option ${selectedAvatar === url ? 'selected' : ''}`}
                                                onClick={() => setSelectedAvatar(url)}
                                            >
                                                <img src={url} alt="Avatar option" />
                                                {selectedAvatar === url && <div className="avatar-check"><FaCheck /></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="Profile Name"
                                        value={newProfileName}
                                        onChange={(e) => setNewProfileName(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                                    <button type="submit" className="save-btn" disabled={!newProfileName.trim()}>
                                        {editingProfile ? 'Save Changes' : 'Add Profile'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Profiles;
