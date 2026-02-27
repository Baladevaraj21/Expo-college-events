import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function StudentApplications() {
    const { token } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadState, setUploadState] = useState({ id: null, url: '', status: '' });

    const fetchApplications = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/student/applications', { headers: { Authorization: `Bearer ${token}` } });
            setApplications(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchApplications();
    }, [token]);

    const handleUploadCertificate = async (e, appId) => {
        e.preventDefault();
        if (!uploadState.url) return;

        setUploadState({ ...uploadState, status: 'uploading' });
        try {
            await axios.put('http://localhost:5000/api/student/applications/certificate',
                { applicationId: appId, certificateUrl: uploadState.url },
                { headers: { Authorization: `Bearer ${token}` } });

            setUploadState({ id: null, url: '', status: 'success' });
            fetchApplications();
        } catch (err) {
            setUploadState({ ...uploadState, status: 'error' });
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="outfit-font animate-pulse" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>Loading Your Journey...</div>
        </div>
    );

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="outfit-font animate-fade-in" style={{ fontSize: '2.5rem', color: 'var(--text-primary)', fontWeight: 800 }}>My Applications</h1>
                <Link to="/student-dashboard" className="btn btn-outline">Back to Events</Link>
            </div>

            <div className="glass-card animate-fade-in animate-delay-1" style={{ padding: '1px', overflow: 'hidden' }}>
                {applications.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>You haven't applied to any events yet.</p>
                        <Link to="/student-dashboard" className="btn btn-primary">Browse Events</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {applications.map((app, i) => (
                            <div key={app._id} style={{ padding: '1.5rem', borderBottom: i !== applications.length - 1 ? '1px solid var(--border-color)' : 'none', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h3 className="outfit-font" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{app.event?.title}</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>🎓 {app.event?.category.toUpperCase()} • 📅 {new Date(app.event?.startDate).toLocaleDateString()}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600, background: app.status === 'confirmed' ? 'rgba(16,185,129,0.1)' : app.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: app.status === 'confirmed' ? 'var(--success)' : app.status === 'rejected' ? 'var(--error)' : 'var(--warning)' }}>
                                            {app.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {app.status === 'confirmed' && (
                                    <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                                        <h4 className="outfit-font" style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Participation Certificate</h4>
                                        {app.certificateUrl ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ color: 'var(--success)' }}>✅ Uploaded</span>
                                                <a href={app.certificateUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline', fontSize: '0.875rem' }}>View Certificate</a>
                                            </div>
                                        ) : (
                                            <form onSubmit={(e) => handleUploadCertificate(e, app._id)} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <input
                                                    type="url"
                                                    required
                                                    placeholder="Paste Google Drive/Dropbox Link..."
                                                    className="input-field"
                                                    style={{ flex: '1', minWidth: '200px' }}
                                                    value={uploadState.id === app._id ? uploadState.url : ''}
                                                    onChange={e => setUploadState({ id: app._id, url: e.target.value, status: '' })}
                                                />
                                                <button type="submit" className="btn btn-primary" disabled={uploadState.status === 'uploading'}>
                                                    {uploadState.id === app._id && uploadState.status === 'uploading' ? 'Saving...' : 'Save Link'}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
