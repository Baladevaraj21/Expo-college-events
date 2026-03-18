import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ArrowLeft, Settings, Bell, User as UserIcon, Menu, Filter, Moon, Sun, Clock, Building2, UserCircle, History, HelpCircle, MessageCircle, Users, UserCheck, UserPlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Header({ onSearch, onSelectNotifEvent }) {
    const { user, token, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [showMenu, setShowMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Notification Data
    const [notifications, setNotifications] = useState([]);
    const [hasNewNotifications, setHasNewNotifications] = useState(false);

    // Follow Data
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [followersList, setFollowersList] = useState([]);
    const [followingList, setFollowingList] = useState([]);
    const [userData, setUserData] = useState(null);

    // Detect outside clicks to close dropdowns
    const navRef = useRef(null);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setShowNotifications(false);
                setShowSettings(false);
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch notifications on mount to show badge
    useEffect(() => {
        if (!token || !user) return;
        const fetchInitialNotifications = async () => {
            try {
                const endpoint = user.role === 'student' ? 'http://localhost:5000/api/student/notifications' : 'http://localhost:5000/api/college/notifications';
                const profileEndpoint = user.role === 'student' ? 'http://localhost:5000/api/student/profile' : 'http://localhost:5000/api/college/profile';
                
                const [notifRes, profileRes] = await Promise.all([
                    axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(profileEndpoint, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                
                const currentNotifs = notifRes.data;
                setNotifications(currentNotifs);
                setUserData(profileRes.data);

                // Determine if there are NEW notifications
                const lastViewed = localStorage.getItem(`lastViewedNotif_${user._id}`);
                if (currentNotifs.length > 0) {
                    if (!lastViewed) {
                        setHasNewNotifications(true);
                    } else {
                        const hasNewer = currentNotifs.some(n => new Date(n.createdAt) > new Date(lastViewed));
                        if (hasNewer) setHasNewNotifications(true);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch notifications or profile");
            }
        };
        fetchInitialNotifications();
    }, [token, user]);

    // Fetch Lists on demand
    const fetchFollowers = async () => {
        try {
            const endpoint = user.role === 'college' ? 'http://localhost:5000/api/college/followers' : 'http://localhost:5000/api/student/followers';
            const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            setFollowersList(res.data);
            setShowFollowers(true);
        } catch(err) { console.error("Error fetching followers", err); }
    };

    const fetchFollowing = async () => {
        try {
            const endpoint = user.role === 'college' ? 'http://localhost:5000/api/college/following' : 'http://localhost:5000/api/student/following';
            const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            setFollowingList(res.data);
            setShowFollowing(true);
        } catch(err) { console.error("Error fetching following", err); }
    };

    const handleUnfollow = async (targetId) => {
        try {
            const endpoint = user.role === 'college' ? `http://localhost:5000/api/college/unfollow/${targetId}` : `http://localhost:5000/api/student/unfollow/${targetId}`;
            const res = await axios.delete(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            setFollowingList(prev => prev.filter(u => u._id !== targetId));
            if (res.data.user) {
                updateUser(res.data.user);
            }
            if (userData) {
                setUserData({ ...userData, following: userData.following.filter(id => id !== targetId) });
            }
        } catch(err) { console.error("Error unfollowing", err); }
    };

    // Re-fetch when dropdown opens, and mark as read
    useEffect(() => {
        if (!showNotifications || !token || !user) return;

        // Mark as read when opened
        setHasNewNotifications(false);

        let lastReadDate = new Date().toISOString();
        if (notifications.length > 0) {
            const newest = notifications.reduce((max, n) => {
                const nDate = new Date(n.createdAt);
                const mDate = new Date(max);
                return nDate > mDate ? n.createdAt : max;
            }, notifications[0].createdAt);
            lastReadDate = newest;
        }
        localStorage.setItem(`lastViewedNotif_${user._id}`, lastReadDate);

        const fetchNotifications = async () => {
            try {
                const endpoint = user.role === 'student' ? 'http://localhost:5000/api/student/notifications' : 'http://localhost:5000/api/college/notifications';
                const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
                setNotifications(res.data);
            } catch (err) {
                console.error("Failed to fetch notifications");
            }
        };
        fetchNotifications();
    }, [showNotifications, token, user]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    if (!user) return null;

    return (
        <nav ref={navRef} className="glass-panel" style={{ padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {location.pathname !== '/student-dashboard' && location.pathname !== '/college-dashboard' && (
                    <button onClick={() => navigate(-1)} style={{ color: 'var(--text-primary)', padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </button>
                )}
                <h1 className="outfit-font" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)', fontWeight: 700, margin: 0, cursor: 'pointer' }} onClick={() => navigate(user.role === 'college' ? '/college-dashboard' : '/student-dashboard')}>
                    Expo-College Events
                </h1>
            </div>

            {(location.pathname === '/student-dashboard' || location.pathname === '/college-dashboard') && (
                <div style={{ flex: 1, maxWidth: '500px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="input-field"
                            style={{ paddingLeft: '2.5rem', marginBottom: 0, height: '40px' }}
                            onChange={(e) => onSearch && onSearch(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', position: 'relative' }}>
                
                {/* Social Counts with icons — navigates to /follow page */}
                {userData && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginRight: '0.5rem' }}>
                        <button
                            onClick={() => navigate('/follow')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.45rem',
                                background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                                borderRadius: '9999px', padding: '0.3rem 0.85rem', cursor: 'pointer',
                                color: 'var(--text-primary)', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-primary)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                        >
                            <Users size={15} style={{ color: 'var(--accent-primary)' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{userData.followers?.length || 0}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Followers</span>
                        </button>
                        <button
                            onClick={() => navigate('/follow')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.45rem',
                                background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                                borderRadius: '9999px', padding: '0.3rem 0.85rem', cursor: 'pointer',
                                color: 'var(--text-primary)', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 2px #10b981'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                        >
                            <UserCheck size={15} style={{ color: '#10b981' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{userData.following?.length || 0}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Following</span>
                        </button>
                    </div>
                )}

                <button onClick={toggleTheme} style={{ color: 'var(--text-secondary)' }}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {/* Notifications Dropdown */}
                <div style={{ position: 'relative' }}>
                    <button onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); setShowMenu(false); }} style={{ color: 'var(--text-secondary)', position: 'relative' }}>
                        <Bell size={20} />
                        {hasNewNotifications && <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: 'var(--error)', borderRadius: '50%' }}></span>}
                    </button>
                    {showNotifications && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', zIndex: 9999, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                                <h1 className="outfit-font" style={{ fontSize: '1.75rem', margin: 0, color: 'var(--text-primary)' }}>Your Notifications</h1>
                                <button onClick={() => setShowNotifications(false)} style={{ color: 'var(--text-primary)', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ArrowLeft size={24} />
                                </button>
                            </div>
                            <div style={{ padding: '2rem 1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                                        <Bell size={48} style={{ opacity: 0.5, margin: '0 0 1rem 0' }} />
                                        <p style={{ fontSize: '1.2rem', margin: 0 }}>You're all caught up!</p>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>When colleges update you, it'll show up here.</p>
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '0.75rem', cursor: 'pointer', border: '1px solid var(--border-color)', transition: 'transform 0.2s' }} onClick={() => {
                                            setShowNotifications(false);
                                            if (notif.relatedUser) {
                                                navigate(notif.relatedUser.role === 'college' ? `/college/${notif.relatedUser._id}` : `/student/${notif.relatedUser._id}`);
                                            }
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                                {notif.relatedUser && notif.relatedUser.profilePic ? (
                                                    <img src={`http://localhost:5000/${notif.relatedUser.profilePic}`} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} alt="Profile" />
                                                ) : (
                                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <UserIcon size={24} style={{ color: 'var(--text-secondary)' }} />
                                                    </div>
                                                )}
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{notif.message}</p>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}><Clock size={12} /> {new Date(notif.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button style={{ color: 'var(--text-secondary)' }} onClick={() => navigate(user.role === 'college' ? '/college-profile' : '/student-profile')}>
                    {user.profilePic ? (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={`http://localhost:5000/${user.profilePic}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ) : (
                        <UserIcon size={20} />
                    )}
                </button>

                {/* Settings Dropdown */}
                <div style={{ position: 'relative' }}>
                    <button onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); setShowMenu(false); }} style={{ color: 'var(--text-secondary)' }}>
                        <Settings size={20} />
                    </button>
                    {showSettings && (
                        <div className="glass-card" style={{ position: 'absolute', right: 0, top: '40px', minWidth: '180px', padding: '0.5rem', zIndex: 101, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Settings</div>

                            <button onClick={() => { setShowSettings(false); navigate(user.role === 'college' ? '/college-profile' : '/student-profile'); }} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.25rem' }} className="hover-bg-tertiary">
                                <UserCircle size={16} /> Edit Profile
                            </button>

                            <button onClick={() => { setShowSettings(false); navigate('/history'); }} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.25rem' }} className="hover-bg-tertiary">
                                <History size={16} /> Event History
                            </button>

                            <button onClick={() => { setShowSettings(false); toggleTheme(); }} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.25rem' }} className="hover-bg-tertiary">
                                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                                Theme: {theme === 'light' ? 'Light' : 'Dark'}
                            </button>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.25rem 0' }} />

                            <button onClick={() => { setShowSettings(false); alert("Help & Support coming soon!"); }} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.25rem' }} className="hover-bg-tertiary">
                                <HelpCircle size={16} /> Help & Support
                            </button>

                            <button onClick={() => { setShowSettings(false); alert("FAQs coming soon!"); }} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.25rem' }} className="hover-bg-tertiary">
                                <MessageCircle size={16} /> FAQs
                            </button>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.25rem 0' }} />

                            <button onClick={() => { setShowSettings(false); logout(); }} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.25rem' }} className="hover-bg-tertiary">
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Followers Modal */}
            {showFollowers && (
                <div className="modal-overlay" onClick={() => setShowFollowers(false)} style={{ zIndex: 9999 }}>
                    <div className="glass-card modal-content" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>Followers</h2>
                            <button onClick={() => setShowFollowers(false)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {followersList.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No followers yet.</p>
                            ) : (
                                followersList.map(follower => (
                                    <div 
                                        key={follower._id} 
                                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem' }}
                                        onClick={() => { setShowFollowers(false); navigate(follower.role === 'college' ? `/college/${follower._id}` : `/student/${follower._id}`); }}
                                        className="hover-bg-tertiary"
                                    >
                                        {follower.profilePic ? (
                                            <img src={`http://localhost:5000/${follower.profilePic}`} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} alt="Profile" />
                                        ) : (
                                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserIcon size={20} /></div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{follower.name}</p>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{follower.role}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Following Modal */}
            {showFollowing && (
                <div className="modal-overlay" onClick={() => setShowFollowing(false)} style={{ zIndex: 9999 }}>
                    <div className="glass-card modal-content" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>Following</h2>
                            <button onClick={() => setShowFollowing(false)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {followingList.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Not following anyone yet.</p>
                            ) : (
                                followingList.map(followingUser => (
                                    <div 
                                        key={followingUser._id} 
                                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem' }}
                                        onClick={() => { setShowFollowing(false); navigate(followingUser.role === 'college' ? `/college/${followingUser._id}` : `/student/${followingUser._id}`); }}
                                        className="hover-bg-tertiary"
                                    >
                                        {followingUser.profilePic ? (
                                            <img src={`http://localhost:5000/${followingUser.profilePic}`} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} alt="Profile" />
                                        ) : (
                                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{followingUser.role === 'college' ? <Building2 size={20} /> : <UserIcon size={20} />}</div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{followingUser.name}</p>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{followingUser.role}</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleUnfollow(followingUser._id); }} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Unfollow</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
