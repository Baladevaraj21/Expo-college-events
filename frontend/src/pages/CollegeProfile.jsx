import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Building2, MapPin, Phone, Lock, CheckCircle, AlertCircle,
    Eye, EyeOff, Settings, Users, Calendar, Grid3x3, IndianRupee,
    Clock, ArrowLeft, Edit2, Camera
} from 'lucide-react';

function AlertBar({ type, message }) {
    if (!message) return null;
    const isSuccess = type === 'success';
    return (
        <div style={{
            padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem',
            background: isSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: isSuccess ? '#10b981' : '#ef4444',
            border: `1px solid ${isSuccess ? '#10b981' : '#ef4444'}40`,
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem'
        }}>
            {isSuccess ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message}
        </div>
    );
}

const CATEGORY_COLOR = { Symposium: '#8b5cf6', Sports: '#f59e0b', Events: '#14b8a6' };

export default function CollegeProfile() {
    const { id } = useParams();
    const { token, user, updateUser } = useAuth();
    const navigate = useNavigate();

    const isOwnProfile = !id || id === user?.id;
    const targetId = id || user?.id;

    // Profile data
    const [profile, setProfile] = useState({ name: '', collegeAddress: '', mobile: '' });
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [profilePicUrl, setProfilePicUrl] = useState('');
    const [myEvents, setMyEvents] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);

    // UI state
    const [activeView, setActiveView] = useState('profile'); // 'profile' | 'settings'
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('events'); // 'events' | 'followers' | 'following'

    // Settings tabs
    const [settingsTab, setSettingsTab] = useState('info'); // 'info' | 'username' | 'password'
    const [newCollegeName, setNewCollegeName] = useState('');
    const [usernameMsg, setUsernameMsg] = useState({ type: '', text: '' });
    const [usernameLoading, setUsernameLoading] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            if (!targetId || !token) return;
            try {
                const profileUrl = isOwnProfile 
                    ? 'http://localhost:5000/api/college/profile'
                    : `http://localhost:5000/api/common/profile/${targetId}`;
                
                const eventsUrl = isOwnProfile
                    ? 'http://localhost:5000/api/college/events'
                    : `http://localhost:5000/api/common/college-events/${targetId}`;

                const [profileRes, eventsRes] = await Promise.all([
                    axios.get(profileUrl, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(eventsUrl, { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                const p = profileRes.data;
                setProfile({ name: p.name || '', collegeAddress: p.collegeAddress || '', mobile: p.mobile || '' });
                if (isOwnProfile) setNewCollegeName(p.name || '');
                setProfilePicUrl(p.profilePic || '');
                setMyEvents(eventsRes.data);
                setFollowers(p.followers || []);
                setFollowing(p.following || []);
            } catch (err) {
                console.error('Failed to load profile data', err);
            } finally {
                setPageLoading(false);
            }
        };
        fetchAll();
    }, [targetId, token, isOwnProfile]);

    // ── Handlers (Only for Own Profile) ──
    const handleSaveInfo = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        const formData = new FormData();
        Object.keys(profile).forEach(k => formData.append(k, profile[k]));
        if (profilePicFile) formData.append('profilePic', profilePicFile);
        try {
            const res = await axios.put('http://localhost:5000/api/college/profile', formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            updateUser(res.data);
            if (profilePicFile) setProfilePicUrl(res.data.profilePic || profilePicUrl);
            setProfilePicFile(null);
            setProfile({ name: res.data.name, collegeAddress: res.data.collegeAddress || '', mobile: res.data.mobile || '' });
            setMessage({ type: 'success', text: 'College info updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update college info.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangeCollegeName = async (e) => {
        e.preventDefault();
        setUsernameLoading(true);
        setUsernameMsg({ type: '', text: '' });
        try {
            const res = await axios.put('http://localhost:5000/api/college/change-username',
                { name: newCollegeName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            updateUser(res.data.user);
            setProfile(prev => ({ ...prev, name: newCollegeName }));
            setUsernameMsg({ type: 'success', text: res.data.message });
        } catch (err) {
            setUsernameMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update college name.' });
        } finally {
            setUsernameLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPass !== passwords.confirm) {
            setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setPasswordLoading(true);
        setPasswordMsg({ type: '', text: '' });
        try {
            const res = await axios.put('http://localhost:5000/api/college/change-password',
                { currentPassword: passwords.current, newPassword: passwords.newPass },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPasswordMsg({ type: 'success', text: res.data.message });
            setPasswords({ current: '', newPass: '', confirm: '' });
        } catch (err) {
            setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const previewPic = profilePicFile
        ? URL.createObjectURL(profilePicFile)
        : profilePicUrl
            ? `http://localhost:5000/${profilePicUrl}`
            : null;

    if (pageLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
                </div>
            </div>
        );
    }

    // ── SETTINGS VIEW ──
    if (activeView === 'settings' && isOwnProfile) {
        const TAB_STYLE = (active) => ({
            padding: '0.6rem 1.25rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600,
            cursor: 'pointer', border: 'none', transition: 'all 0.2s',
            background: active ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: active ? 'white' : 'var(--text-secondary)'
        });

        return (
            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => setActiveView('profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={20} /> Back to Profile
                    </button>
                </div>
                <h2 className="outfit-font" style={{ fontSize: '2rem', marginBottom: '2rem' }}>⚙️ Account Settings</h2>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <button style={TAB_STYLE(settingsTab === 'info')} onClick={() => setSettingsTab('info')}>📋 College Info</button>
                    <button style={TAB_STYLE(settingsTab === 'username')} onClick={() => setSettingsTab('username')}>✏️ Change Name</button>
                    <button style={TAB_STYLE(settingsTab === 'password')} onClick={() => setSettingsTab('password')}>🔒 Change Password</button>
                </div>

                {settingsTab === 'info' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 className="outfit-font" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>College Information</h3>
                        <AlertBar type={message.type} message={message.text} />
                        <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Profile Picture */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-primary)', flexShrink: 0 }}>
                                    {previewPic
                                        ? <img src={previewPic} alt="College Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={40} style={{ color: 'var(--text-tertiary)' }} /></div>
                                    }
                                    <label style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', color: 'white', textAlign: 'center', padding: '0.3rem 0', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                                        <Camera size={12} /> Edit
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setProfilePicFile(e.target.files[0])} />
                                    </label>
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{profile.name}</p>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Click the photo to change your college logo</p>
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={15} /> College Name</label>
                                <input type="text" required className="input-field" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={15} /> Contact / Mobile</label>
                                <input type="text" className="input-field" value={profile.mobile} onChange={e => setProfile({ ...profile, mobile: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={15} /> Full College Address</label>
                                <textarea className="input-field" rows="3" value={profile.collegeAddress} onChange={e => setProfile({ ...profile, collegeAddress: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }} disabled={loading}>
                                {loading ? 'Saving...' : '💾 Save College Info'}
                            </button>
                        </form>
                    </div>
                )}

                {settingsTab === 'username' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 className="outfit-font" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Change College Name</h3>
                        <form onSubmit={handleChangeCollegeName} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <AlertBar type={usernameMsg.type} message={usernameMsg.text} />
                            <div className="input-group">
                                <label className="input-label">Current College Name</label>
                                <p style={{ color: 'var(--text-secondary)', paddingLeft: '0.25rem', marginBottom: '0.5rem' }}>{user?.name}</p>
                                <label className="input-label">New College Name</label>
                                <input type="text" required className="input-field" value={newCollegeName} onChange={e => setNewCollegeName(e.target.value)} placeholder="Enter new college name" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }} disabled={usernameLoading}>
                                {usernameLoading ? 'Updating...' : 'Update College Name'}
                            </button>
                        </form>
                    </div>
                )}

                {settingsTab === 'password' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 className="outfit-font" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Change Password</h3>
                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <AlertBar type={passwordMsg.type} message={passwordMsg.text} />
                            {[
                                { label: 'Current Password', key: 'current', field: 'current' },
                                { label: 'New Password', key: 'new', field: 'newPass' },
                                { label: 'Confirm New Password', key: 'confirm', field: 'confirm' }
                            ].map(({ label, key, field }) => (
                                <div key={key} className="input-group" style={{ position: 'relative' }}>
                                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Lock size={14} /> {label}
                                    </label>
                                    <input
                                        type={showPass[key] ? 'text' : 'password'}
                                        required className="input-field"
                                        value={passwords[field]}
                                        onChange={e => setPasswords({ ...passwords, [field]: e.target.value })}
                                        placeholder={label}
                                        style={{ paddingRight: '3rem' }}
                                    />
                                    <button type="button" onClick={() => setShowPass(p => ({ ...p, [key]: !p[key] }))}
                                        style={{ position: 'absolute', right: '0.75rem', top: '2.3rem', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        {showPass[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            ))}
                            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }} disabled={passwordLoading}>
                                {passwordLoading ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    // ── INSTAGRAM-STYLE PROFILE VIEW ──
    const activeEvents = myEvents.filter(e => new Date() <= new Date(e.endDate));
    const pastEvents = myEvents.filter(e => new Date() > new Date(e.endDate));

    return (
        <div style={{ maxWidth: '935px', margin: '0 auto', padding: '2rem 1rem' }}>

            {/* ── Header Banner ── */}
            <div style={{ position: 'relative', height: '220px', borderRadius: '1.5rem', overflow: 'hidden', marginBottom: '0', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 50%, #14b8a6 100%)' }}>
                {profilePicUrl && (
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(http://localhost:5000/${profilePicUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(18px) brightness(0.45)', transform: 'scale(1.1)' }} />
                )}
                {/* Settings button */}
                {isOwnProfile && (
                    <button
                        onClick={() => setActiveView('settings')}
                        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '0.75rem', padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                        <Settings size={16} /> Settings
                    </button>
                )}
                {/* Dashboard/Back button */}
                <button
                    onClick={() => isOwnProfile ? navigate('/college-dashboard') : navigate(-1)}
                    style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '0.75rem', padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}
                >
                    <ArrowLeft size={16} /> {isOwnProfile ? 'Dashboard' : 'Back'}
                </button>
            </div>

            {/* ── Avatar + Name Row ── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', padding: '0 1rem', marginTop: '-60px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--bg-primary)', overflow: 'hidden', background: 'var(--bg-secondary)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                        {previewPic
                            ? <img src={previewPic} alt="College Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={48} style={{ color: 'var(--text-tertiary)' }} /></div>
                        }
                    </div>
                    {isOwnProfile && (
                        <button
                            onClick={() => setActiveView('settings')}
                            style={{ position: 'absolute', bottom: 4, right: 4, width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', border: '2px solid var(--bg-primary)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Edit photo"
                        >
                            <Edit2 size={13} />
                        </button>
                    )}
                </div>

                {/* Name & Meta */}
                <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <h1 className="outfit-font" style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{profile.name}</h1>
                        <span style={{ background: 'linear-gradient(135deg, var(--accent-primary), #7c3aed)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.7rem', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            🏛 College
                        </span>
                        {!isOwnProfile && (
                            <button 
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const isFollowing = followers.includes(user.id);
                                        const endpoint = user.role === 'student' 
                                            ? `http://localhost:5000/api/student/${isFollowing ? 'unfollow' : 'follow'}/${targetId}`
                                            : `http://localhost:5000/api/college/${isFollowing ? 'unfollow' : 'follow'}/${targetId}`;
                                        
                                        const method = isFollowing ? 'delete' : 'post';
                                        const res = await axios[method](endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
                                        if (res.data.user) updateUser(res.data.user);
                                        
                                        setFollowers(prev => isFollowing 
                                            ? prev.filter(id => id !== user.id) 
                                            : [...prev, user.id]
                                        );
                                    } catch (err) {
                                        console.error("Follow error", err);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                                className={followers.includes(user.id) ? "btn btn-outline" : "btn btn-primary"}
                                style={{ padding: '0.4rem 1.25rem', fontSize: '0.85rem', borderRadius: '9999px' }}
                            >
                                {loading ? '...' : followers.includes(user.id) ? 'Unfollow' : 'Follow'}
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {profile.mobile && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Phone size={13} /> {profile.mobile}
                            </span>
                        )}
                        {profile.collegeAddress && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <MapPin size={13} /> {profile.collegeAddress}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="glass-card" style={{ padding: '1.25rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-around', gap: '1rem', textAlign: 'center' }}>
                <div>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{myEvents.length}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Events</p>
                </div>
                <div style={{ width: '1px', background: 'var(--border-color)' }} />
                <div>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{activeEvents.length}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Active</p>
                </div>
                <div style={{ width: '1px', background: 'var(--border-color)' }} />
                <div style={{ cursor: 'pointer' }} onClick={() => setActiveTab('followers')}>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--accent-primary)' }}>{followers.length}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Followers</p>
                </div>
                <div style={{ width: '1px', background: 'var(--border-color)' }} />
                <div style={{ cursor: 'pointer' }} onClick={() => setActiveTab('following')}>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{following.length}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Following</p>
                </div>
            </div>

            {/* ── Tab Nav ── */}
            <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', marginBottom: '2rem' }}>
                {[
                    { id: 'events', icon: <Grid3x3 size={16} />, label: 'Events' },
                    { id: 'followers', icon: <Users size={16} />, label: `Followers (${followers.length})` },
                    { id: 'following', icon: <Building2 size={16} />, label: `Following (${following.length})` },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1, padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                            borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            marginBottom: '-2px', color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            transition: 'all 0.2s', fontSize: '0.875rem'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            {activeTab === 'events' && (
                <div>
                    {activeEvents.length > 0 && (
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h3 className="outfit-font" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                                Active Events
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {activeEvents.map(event => (
                                    <EventCard key={event._id} event={event} onClick={() => setSelectedEvent(event)} />
                                ))}
                            </div>
                        </div>
                    )}
                    {pastEvents.length > 0 && (
                        <div>
                            <h3 className="outfit-font" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--text-tertiary)', display: 'inline-block' }} />
                                Past Events
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', opacity: 0.7 }}>
                                {pastEvents.map(event => (
                                    <EventCard key={event._id} event={event} onClick={() => setSelectedEvent(event)} past />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'followers' && <UserList list={followers} emptyMsg="No followers yet." navigate={navigate} />}
            {activeTab === 'following' && <UserList list={following} emptyMsg="No following yet." navigate={navigate} />}

            {/* ── Detail Modal ── */}
            {selectedEvent && (
                <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="glass-card modal-content" style={{ maxWidth: '640px', padding: '2rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
                        <h2 className="outfit-font">{selectedEvent.title}</h2>
                        <p>{selectedEvent.description}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <InfoRow icon={<Calendar size={14} />} label="Date" value={new Date(selectedEvent.startDate).toLocaleDateString()} />
                            <InfoRow icon={<IndianRupee size={14} />} label="Fee" value={`₹${selectedEvent.entryFee}`} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function EventCard({ event, onClick, past }) {
    const color = CATEGORY_COLOR[event.category] || '#6366f1';
    return (
        <div className="glass-card" onClick={onClick} style={{ cursor: 'pointer', padding: '1.25rem' }}>
            <span style={{ color, fontSize: '0.7rem', fontWeight: 700 }}>{event.category}</span>
            <h3 style={{ margin: '0.5rem 0' }}>{event.title}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{event.description?.slice(0, 60)}...</p>
        </div>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>{icon} {label}</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
    );
}

function UserList({ list, emptyMsg, navigate }) {
    if (list.length === 0) return <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{emptyMsg}</p>;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {list.map(u => (
                <div 
                    key={u._id} 
                    className="glass-panel" 
                    onClick={() => navigate(u.role === 'college' ? `/college/${u._id}` : `/student/${u._id}`)}
                    style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                        {u.profilePic ? <img src={`http://localhost:5000/${u.profilePic}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} />}
                    </div>
                    <div>
                        <p style={{ fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{u.name}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0 }}>{u.role}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
