import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ArrowLeft, Settings, Bell, User as UserIcon, Menu, Filter, Moon, Sun, Clock, Building2, UserCircle, History, HelpCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Header({ onSearch, onFilterToggle, onSelectNotifEvent }) {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [showMenu, setShowMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Notification Data
    const [notifications, setNotifications] = useState([]);
    const [hasNewNotifications, setHasNewNotifications] = useState(false);

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
                let currentNotifs = [];
                if (user.role === 'student') {
                    const res = await axios.get('http://localhost:5000/api/student/events', { headers: { Authorization: `Bearer ${token}` } });
                    currentNotifs = res.data.slice(0, 5);
                } else if (user.role === 'college') {
                    const res = await axios.get('http://localhost:5000/api/college/applications', { headers: { Authorization: `Bearer ${token}` } });
                    currentNotifs = res.data.slice(0, 5);
                }

                setNotifications(currentNotifs);

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
                console.error("Failed to fetch notifications");
            }
        };
        fetchInitialNotifications();
    }, [token, user]);

    // Re-fetch when dropdown opens, and mark as read
    useEffect(() => {
        if (!showNotifications || !token || !user) return;

        // Mark as read when opened
        setHasNewNotifications(false);
        localStorage.setItem(`lastViewedNotif_${user._id}`, new Date().toISOString());

        const fetchNotifications = async () => {
            try {
                if (user.role === 'student') {
                    const res = await axios.get('http://localhost:5000/api/student/events', { headers: { Authorization: `Bearer ${token}` } });
                    setNotifications(res.data.slice(0, 5));
                } else if (user.role === 'college') {
                    const res = await axios.get('http://localhost:5000/api/college/applications', { headers: { Authorization: `Bearer ${token}` } });
                    setNotifications(res.data.slice(0, 5));
                }
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
                    CampusConnect
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
                    {user?.role === 'student' && location.pathname === '/student-dashboard' && (
                        <button onClick={onFilterToggle} className="btn btn-outline" style={{ height: '40px', padding: '0 0.75rem' }}>
                            <Filter size={18} />
                        </button>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', position: 'relative' }}>
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
                        <div className="glass-card" style={{ position: 'absolute', right: 0, top: '40px', width: '320px', maxHeight: '400px', overflowY: 'auto', padding: '1rem', zIndex: 101, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <h3 className="outfit-font" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>Notifications</h3>

                            {notifications.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No new notifications.</p>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', cursor: 'pointer' }} onClick={() => {
                                        setShowNotifications(false);
                                        if (user.role === 'student' && onSelectNotifEvent) {
                                            onSelectNotifEvent(notif);
                                        }
                                        navigate(user.role === 'college' ? '/college-dashboard' : '/student-dashboard');
                                    }}>
                                        {user.role === 'student' ? (
                                            <>
                                                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>New Event: {notif.title}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Building2 size={12} /> {notif.collegeName || notif.organizer?.name}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>New Applicant: {notif.student?.name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Event: {notif.event?.title}</p>
                                            </>
                                        )}
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.25rem' }}><Clock size={10} /> {new Date(notif.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <button style={{ color: 'var(--text-secondary)' }} onClick={() => navigate(user.role === 'college' ? '/college-profile' : '/student-profile')}><UserIcon size={20} /></button>

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

                <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowMenu(!showMenu)} style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                        <Menu size={24} />
                    </button>
                    {showMenu && (
                        <div className="glass-card" style={{ position: 'absolute', right: 0, top: '40px', padding: '0.5rem', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 101 }}>
                            <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                                <b>{user.name}</b><br />
                                <span style={{ color: 'var(--text-secondary)' }}>{user.role}</span>
                            </div>
                            <button onClick={() => { setShowMenu(false); navigate(user.role === 'college' ? '/college-profile' : '/student-profile'); }} style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.875rem', width: '100%', color: 'var(--text-primary)' }}>Profile</button>
                            <button onClick={() => { setShowMenu(false); logout(); }} style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.875rem', color: 'var(--error)', width: '100%' }}>Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
