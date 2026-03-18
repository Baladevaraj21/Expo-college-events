import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck, Building2, ArrowLeft, UserMinus, Search } from 'lucide-react';

export default function FollowPage() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(user?.role === 'college' ? 'followers' : 'following');
    
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loadingFollowers, setLoadingFollowers] = useState(false);
    const [loadingFollowing, setLoadingFollowing] = useState(false);
    const [unfollowLoading, setUnfollowLoading] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const isCollege = user?.role === 'college';
    const BASE = 'http://localhost:5000';
    const headers = { Authorization: `Bearer ${token}` };

    const fetchFollowers = async () => {
        setLoadingFollowers(true);
        try {
            const endpoint = isCollege ? `${BASE}/api/college/followers` : `${BASE}/api/student/followers`;
            const res = await axios.get(endpoint, { headers });
            setFollowers(res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingFollowers(false); }
    };

    const fetchFollowing = async () => {
        setLoadingFollowing(true);
        try {
            const endpoint = isCollege ? `${BASE}/api/college/following` : `${BASE}/api/student/following`;
            const res = await axios.get(endpoint, { headers });
            setFollowing(res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingFollowing(false); }
    };

    useEffect(() => {
        if (token) {
            fetchFollowing();
            fetchFollowers();
        }
    }, [token]);

    const handleUnfollow = async (collegeId) => {
        setUnfollowLoading(prev => new Set(prev).add(collegeId));
        try {
            const endpoint = isCollege
                ? `${BASE}/api/college/unfollow/${collegeId}`
                : `${BASE}/api/student/unfollow/${collegeId}`;
            await axios.delete(endpoint, { headers });
            setFollowing(prev => prev.filter(c => c._id !== collegeId));
        } catch (err) { console.error(err); }
        finally { setUnfollowLoading(prev => { const n = new Set(prev); n.delete(collegeId); return n; }); }
    };

    const TAB_STYLE = (active) => ({
        flex: 1, padding: '0.85rem', border: 'none', cursor: 'pointer',
        fontWeight: 700, fontSize: '1rem', transition: 'all 0.25s',
        borderBottom: active ? '3px solid var(--accent-primary)' : '3px solid transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        background: 'none'
    });

    const filteredFollowing = following.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredFollowers = followers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const PersonCard = ({ person, showUnfollow = false, isLoadingUnfollow = false }) => (
        <div 
            className="glass-panel" 
            onClick={() => navigate(person.role === 'college' ? `/college/${person._id}` : `/student/${person._id}`)}
            style={{
                padding: '1rem 1.25rem', display: 'flex', alignItems: 'center',
                gap: '1rem', borderRadius: '1rem', transition: 'all 0.2s',
                animation: 'fadeIn 0.3s ease', cursor: 'pointer'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            {person.profilePic ? (
                <img
                    src={`${BASE}/${person.profilePic}`}
                    alt={person.name}
                    style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }}
                />
            ) : (
                <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                    <Building2 size={24} style={{ color: 'white' }} />
                </div>
            )}
            <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{person.name}</p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', margin: 0 }}>
                    {person.role === 'college' ? '🏛️ College' : '🎓 Student'} • {person.email || ''}
                </p>
                {showUnfollow && (
                    <p style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '0.2rem', fontWeight: 600 }}>✓ Following</p>
                )}
            </div>
            {showUnfollow && (
                <button
                    onClick={(e) => { e.stopPropagation(); handleUnfollow(person._id); }}
                    disabled={isLoadingUnfollow}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.5rem 1rem', borderRadius: '9999px',
                        background: isLoadingUnfollow ? 'var(--bg-tertiary)' : 'rgba(239,68,68,0.1)',
                        color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                        cursor: isLoadingUnfollow ? 'wait' : 'pointer',
                        fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s'
                    }}
                >
                    <UserMinus size={14} />
                    {isLoadingUnfollow ? 'Unfollowing...' : 'Unfollow'}
                </button>
            )}
        </div>
    );

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.75rem', borderRadius: '9999px', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="outfit-font" style={{ fontSize: '1.75rem', margin: 0, color: 'var(--accent-primary)' }}>
                        Your Network
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', margin: 0 }}>
                        {followers.length} followers · {following.length} following
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div 
                    className="glass-card" 
                    onClick={() => setActiveTab('followers')}
                    style={{ flex: 1, padding: '1.25rem', textAlign: 'center', cursor: 'pointer', border: activeTab === 'followers' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', transition: 'all 0.2s' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Users size={20} style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{followers.length}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, fontWeight: 600 }}>Followers</p>
                </div>
                <div 
                    className="glass-card" 
                    onClick={() => setActiveTab('following')}
                    style={{ flex: 1, padding: '1.25rem', textAlign: 'center', cursor: 'pointer', border: activeTab === 'following' ? '2px solid #10b981' : '1px solid var(--border-color)', transition: 'all 0.2s' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <UserCheck size={20} style={{ color: '#10b981' }} />
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{following.length}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, fontWeight: 600 }}>Following</p>
                </div>
            </div>

            {/* Tab Nav */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                    <button style={TAB_STYLE(activeTab === 'followers')} onClick={() => setActiveTab('followers')}>
                        <Users size={16} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'middle' }} />
                        Followers ({followers.length})
                    </button>
                    <button style={TAB_STYLE(activeTab === 'following')} onClick={() => setActiveTab('following')}>
                        <UserCheck size={16} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'middle' }} />
                        Following ({following.length})
                    </button>
                </div>

                {/* Search inside tab */}
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: '2.25rem', marginBottom: 0, height: '38px', fontSize: '0.9rem' }}
                    />
                </div>

                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '200px' }}>
                    {activeTab === 'following' && (
                        loadingFollowing ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>Loading...</div>
                        ) : filteredFollowing.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <UserCheck size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
                                <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    {searchTerm ? 'No results found' : 'Not following anyone yet'}
                                </p>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Search for colleges to follow them</p>
                            </div>
                        ) : (
                            filteredFollowing.map(c => (
                                <PersonCard
                                    key={c._id}
                                    person={c}
                                    showUnfollow={true}
                                    isLoadingUnfollow={unfollowLoading.has(c._id)}
                                />
                            ))
                        )
                    )}
                    {activeTab === 'followers' && (
                        loadingFollowers ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>Loading...</div>
                        ) : filteredFollowers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <Users size={40} style={{ color: 'var(--text-tertiary)', display: 'block', margin: '0 auto 0.75rem' }} />
                                <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    {searchTerm ? 'No results found' : 'No followers yet'}
                                </p>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Students will appear here when they follow you</p>
                            </div>
                        ) : (
                            filteredFollowers.map(c => (
                                <PersonCard key={c._id} person={c} showUnfollow={false} />
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
