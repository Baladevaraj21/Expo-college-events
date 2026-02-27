import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ArrowLeft, Settings, Bell, User as UserIcon, Menu, Filter, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ onSearch, onFilterToggle }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    if (!user) return null;

    return (
        <nav className="glass-panel" style={{ padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, gap: '1rem' }}>
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

            {user?.role === 'student' && location.pathname === '/student-dashboard' && (
                <div style={{ flex: 1, maxWidth: '500px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder="Search events, symposiums..."
                            className="input-field"
                            style={{ paddingLeft: '2.5rem', marginBottom: 0, height: '40px' }}
                            onChange={(e) => onSearch && onSearch(e.target.value)}
                        />
                    </div>
                    <button onClick={onFilterToggle} className="btn btn-outline" style={{ height: '40px', padding: '0 0.75rem' }}>
                        <Filter size={18} />
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', position: 'relative' }}>
                <button onClick={toggleTheme} style={{ color: 'var(--text-secondary)' }}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <button style={{ color: 'var(--text-secondary)' }}><Bell size={20} /></button>
                <button style={{ color: 'var(--text-secondary)' }} onClick={() => navigate('/student-profile')}><UserIcon size={20} /></button>
                <button style={{ color: 'var(--text-secondary)' }}><Settings size={20} /></button>

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
                            <button onClick={() => { setShowMenu(false); navigate('/student-profile'); }} style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.875rem', width: '100%', color: 'var(--text-primary)' }}>Profile</button>
                            <button onClick={() => { setShowMenu(false); logout(); }} style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.875rem', color: 'var(--error)', width: '100%' }}>Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
