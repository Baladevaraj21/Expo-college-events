import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Share2, Building2, MapPin, Phone } from 'lucide-react';

export default function CollegeProfile() {
    const { token, user } = useAuth();
    const [profile, setProfile] = useState({ name: '', collegeAddress: '', mobile: '' });
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [profilePicUrl, setProfilePicUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/college/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile({
                    name: res.data.name || '',
                    collegeAddress: res.data.collegeAddress || '',
                    mobile: res.data.mobile || ''
                });
                setProfilePicUrl(res.data.profilePic || '');
            } catch (err) {
                console.error("Failed to fetch profile");
            }
        };
        if (token) fetchProfile();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const formData = new FormData();
        Object.keys(profile).forEach(key => {
            formData.append(key, profile[key]);
        });

        if (profilePicFile) formData.append('profilePic', profilePicFile);

        try {
            await axios.put('http://localhost:5000/api/college/profile', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage('College profile updated successfully!');
        } catch (err) {
            setMessage('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="outfit-font" style={{ fontSize: '2rem' }}>College Profile</h2>
            </div>

            {message && <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', marginBottom: '2rem', borderRadius: '0.5rem' }}>{message}</div>}

            <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>

                {/* Profile Picture Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-primary)', cursor: 'pointer', background: 'var(--bg-tertiary)' }}>
                        <img
                            src={profilePicFile ? URL.createObjectURL(profilePicFile) : (profilePicUrl ? `http://localhost:5000/${profilePicUrl}` : 'https://via.placeholder.com/120?text=Upload+Logo')}
                            alt="College Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <label style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', textAlign: 'center', padding: '0.25rem 0', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                            Change
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setProfilePicFile(e.target.files[0])} />
                        </label>
                    </div>
                </div>

                <h3 className="outfit-font" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>College Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>

                    <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={16} /> College Name</label>
                        <input type="text" required className="input-field" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={16} /> Contact / Mobile Number</label>
                        <input type="text" className="input-field" value={profile.mobile} onChange={e => setProfile({ ...profile, mobile: e.target.value })} />
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={16} /> Full College Address</label>
                        <textarea className="input-field" rows="3" value={profile.collegeAddress} onChange={e => setProfile({ ...profile, collegeAddress: e.target.value })}></textarea>
                    </div>

                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '1rem 2rem', marginTop: '1rem' }} disabled={loading}>
                    {loading ? 'Saving...' : 'Save College Details'}
                </button>
            </form>
        </div>
    );
}
