import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Share2, FileText, UploadCloud } from 'lucide-react';

export default function StudentProfile() {
    const { token, user } = useAuth();
    const [profile, setProfile] = useState({ college: '', department: '', year: '', place: '', age: '', gender: '', collegeAddress: '', mobile: '' });
    const [certificates, setCertificates] = useState([]);
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [profilePicUrl, setProfilePicUrl] = useState('');
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

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
        if (frontImage) formData.append('idCardFront', frontImage);
        if (backImage) formData.append('idCardBack', backImage);

        try {
            await axios.put('http://localhost:5000/api/student/profile', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage('Profile updated successfully!');
        } catch (err) {
            setMessage('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleCertificateUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF format file.');
            return;
        }

        setMessage('Uploading document...');
        const formData = new FormData();
        formData.append('certificate', file);

        try {
            const res = await axios.post('http://localhost:5000/api/student/upload-certificate', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCertificates(res.data.certificates);
            setMessage('Certificate PDF uploaded successfully!');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to upload certificate');
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${user?.name}'s CampusConnect Profile`,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert("Profile link copied to clipboard!");
            }
        } catch (err) {
            console.error("Error sharing", err);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="outfit-font" style={{ fontSize: '2rem' }}>Student Profile</h2>
                <button type="button" onClick={handleShare} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Share2 size={18} /> Share Profile
                </button>
            </div>

            {message && <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', marginBottom: '2rem', borderRadius: '0.5rem' }}>{message}</div>}

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
                    <h3 className="outfit-font" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>ID Card Upload (Front & Back)</h3>
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
