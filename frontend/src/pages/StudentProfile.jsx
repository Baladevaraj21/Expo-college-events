import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Share2, FileText, UploadCloud, User, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

// Helper alert bar
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

export default function StudentProfile() {
    const { token, user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState({ college: '', department: '', year: '', place: '', age: '', gender: '', collegeAddress: '', mobile: '' });
    const [certificates, setCertificates] = useState([]);
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [profilePicUrl, setProfilePicUrl] = useState('');
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Account Settings
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'username' | 'password'
    const [newUsername, setNewUsername] = useState('');
    const [usernameMsg, setUsernameMsg] = useState({ type: '', text: '' });
    const [usernameLoading, setUsernameLoading] = useState(false);

    const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/student/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile({
                    college: res.data.college || '',
                    department: res.data.department || '',
                    year: res.data.year || '',
                    place: res.data.place || '',
                    age: res.data.age || '',
                    gender: res.data.gender || '',
                    collegeAddress: res.data.collegeAddress || '',
                    mobile: res.data.mobile || ''
                });
                setProfilePicUrl(res.data.profilePic || '');
                setCertificates(res.data.certificates || []);
                setNewUsername(res.data.name || '');
            } catch (err) {
                console.error("Failed to fetch profile", err);
            }
        };
        if (token) fetchProfile();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        Object.keys(profile).forEach(key => formData.append(key, profile[key]));
        if (profilePicFile) formData.append('profilePic', profilePicFile);
        if (frontImage) formData.append('idCardFront', frontImage);
        if (backImage) formData.append('idCardBack', backImage);

        try {
            const res = await axios.put('http://localhost:5000/api/student/profile', formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            updateUser(res.data);
            setMessage({ type: 'success', text: 'Profile updated successfully! Redirecting...' });
            setTimeout(() => navigate('/student-dashboard'), 1500);
        } catch (err) {
            console.error("Update profile error", err);
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangeUsername = async (e) => {
        e.preventDefault();
        setUsernameLoading(true);
        setUsernameMsg({ type: '', text: '' });
        try {
            const res = await axios.put('http://localhost:5000/api/student/change-username',
                { name: newUsername },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            updateUser(res.data.user);
            setUsernameMsg({ type: 'success', text: res.data.message });
        } catch (err) {
            setUsernameMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update username.' });
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
            const res = await axios.put('http://localhost:5000/api/student/change-password',
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

    const handleCertificateUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') { alert('Please upload a PDF format file.'); return; }
        setMessage({ type: '', text: 'Uploading document...' });
        const formData = new FormData();
        formData.append('certificate', file);
        try {
            const res = await axios.post('http://localhost:5000/api/student/upload-certificate', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCertificates(res.data.certificates);
            setMessage({ type: 'success', text: 'Certificate PDF uploaded successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload certificate' });
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: `${user?.name}'s Expo-College Events Profile`, url: window.location.href });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert("Profile link copied to clipboard!");
            }
        } catch (err) { console.error("Error sharing", err); }
    };

    const TAB_STYLE = (active) => ({
        padding: '0.6rem 1.25rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600,
        cursor: 'pointer', border: 'none', transition: 'all 0.2s',
        background: active ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
        color: active ? 'white' : 'var(--text-secondary)'
    });

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="outfit-font" style={{ fontSize: '2rem' }}>Student Profile</h2>
                <button type="button" onClick={handleShare} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Share2 size={18} /> Share Profile
                </button>
            </div>

            {/* ── Account Settings Section ── */}
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3 className="outfit-font" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={20} /> Account Settings
                </h3>

                {/* Tab switcher */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <button style={TAB_STYLE(activeTab === 'username')} onClick={() => setActiveTab('username')}>✏️ Change Username</button>
                    <button style={TAB_STYLE(activeTab === 'password')} onClick={() => setActiveTab('password')}>🔒 Change Password</button>
                </div>

                {activeTab === 'username' && (
                    <form onSubmit={handleChangeUsername} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <AlertBar type={usernameMsg.type} message={usernameMsg.text} />
                        <div className="input-group">
                            <label className="input-label">Current Display Name</label>
                            <p style={{ color: 'var(--text-secondary)', paddingLeft: '0.25rem', marginBottom: '0.5rem' }}>{user?.name}</p>
                            <label className="input-label">New Display Name</label>
                            <input
                                type="text" required className="input-field"
                                value={newUsername} onChange={e => setNewUsername(e.target.value)}
                                placeholder="Enter new username"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }} disabled={usernameLoading}>
                            {usernameLoading ? 'Updating...' : 'Update Username'}
                        </button>
                    </form>
                )}

                {activeTab === 'password' && (
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
                )}
            </div>

            {/* ── Profile Details Section ── */}
            <AlertBar type={message.type} message={message.text} />

            <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>

                {/* Profile Picture Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-primary)', cursor: 'pointer', background: 'var(--bg-tertiary)' }}>
                        <img
                            src={profilePicFile ? URL.createObjectURL(profilePicFile) : (profilePicUrl ? `http://localhost:5000/${profilePicUrl}` : 'https://via.placeholder.com/120?text=Upload')}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <label style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', textAlign: 'center', padding: '0.25rem 0', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                            Change
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setProfilePicFile(e.target.files[0])} />
                        </label>
                    </div>
                </div>

                <h3 className="outfit-font" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Personal Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="input-group">
                        <label className="input-label">Age</label>
                        <input type="number" className="input-field" value={profile.age} onChange={e => setProfile({ ...profile, age: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Gender</label>
                        <select className="input-field" value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })}>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Mobile Number</label>
                        <input type="text" className="input-field" value={profile.mobile} onChange={e => setProfile({ ...profile, mobile: e.target.value })} />
                    </div>
                </div>

                <h3 className="outfit-font" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '1rem' }}>Academic Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="input-group">
                        <label className="input-label">College Name</label>
                        <input type="text" className="input-field" value={profile.college} onChange={e => setProfile({ ...profile, college: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Department</label>
                        <input type="text" className="input-field" value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Year of Study</label>
                        <input type="text" className="input-field" value={profile.year} onChange={e => setProfile({ ...profile, year: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Place/City</label>
                        <input type="text" className="input-field" value={profile.place} onChange={e => setProfile({ ...profile, place: e.target.value })} />
                    </div>
                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="input-label">College Address</label>
                        <textarea className="input-field" rows="2" value={profile.collegeAddress} onChange={e => setProfile({ ...profile, collegeAddress: e.target.value })}></textarea>
                    </div>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <h3 className="outfit-font" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>ID Card Upload (Front &amp; Back)</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Required for college event verification.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div style={{ border: '2px dashed var(--border-color)', padding: '2rem', textAlign: 'center', borderRadius: '1rem' }}>
                            <label style={{ display: 'block', cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                Upload Front Side
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFrontImage(e.target.files[0])} />
                            </label>
                            {frontImage && <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>{frontImage.name}</p>}
                        </div>
                        <div style={{ border: '2px dashed var(--border-color)', padding: '2rem', textAlign: 'center', borderRadius: '1rem' }}>
                            <label style={{ display: 'block', cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                Upload Back Side
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setBackImage(e.target.files[0])} />
                            </label>
                            {backImage && <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>{backImage.name}</p>}
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '1rem 2rem', marginTop: '1rem' }} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Profile Details'}
                </button>
            </form>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <h3 className="outfit-font" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>My Certificates</h3>
                    <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UploadCloud size={18} /> Upload PDF
                        <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleCertificateUpload} />
                    </label>
                </div>
                {certificates.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No certificates uploaded yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {certificates.map((cert, index) => (
                            <div key={index} className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '0.5rem' }}>
                                <FileText size={24} style={{ color: 'var(--accent-primary)' }} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600 }}>Certificate {index + 1}</p>
                                    <a href={`http://localhost:5000/${cert.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'underline' }}>View PDF Document</a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
