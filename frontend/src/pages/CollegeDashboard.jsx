import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function CollegeDashboard() {
    const { token } = useAuth();
    const [events, setEvents] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    // New Event Form State
    const [showEventForm, setShowEventForm] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', description: '', category: 'technical', type: '', startTime: '', endTime: '', startDate: '', endDate: '', address: '', entryFee: 0 });
    const [creating, setCreating] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const [eventsRes, appsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/college/events', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/college/applications', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setEvents(eventsRes.data);
            setApplications(appsRes.data);
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchDashboardData();
    }, [token]);

    const handleUpdateStatus = async (appId, status) => {
        try {
            await axios.patch(`http://localhost:5000/api/college/applications/${appId}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDashboardData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await axios.post('http://localhost:5000/api/college/events', newEvent, { headers: { Authorization: `Bearer ${token}` } });
            setShowEventForm(false);
            setNewEvent({ title: '', description: '', category: 'technical', type: '', startTime: '', endTime: '', startDate: '', endDate: '', address: '', entryFee: 0 });
            fetchDashboardData();
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Dashboard...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="outfit-font" style={{ fontSize: '2.5rem', color: 'var(--accent-primary)' }}>College Dashboard</h1>
                <button className="btn btn-primary" onClick={() => setShowEventForm(!showEventForm)}>
                    {showEventForm ? 'Cancel Form' : '+ Post New Event'}
                </button>
            </div>

            {showEventForm && (
                <form onSubmit={handleCreateEvent} className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h2 className="outfit-font" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Create New Event</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Event Title</label>
                            <input type="text" required className="input-field" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Category</label>
                            <select className="input-field" value={newEvent.category} onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}>
                                <option value="technical">Technical</option>
                                <option value="non-technical">Non-Technical</option>
                                <option value="sports">Sports</option>
                            </select>
                        </div>
                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label">Description</label>
                            <textarea required className="input-field" rows="3" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}></textarea>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Type (Workshop, Symposium, etc)</label>
                            <input type="text" required className="input-field" value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Address / Location</label>
                            <input type="text" required className="input-field" value={newEvent.address} onChange={e => setNewEvent({ ...newEvent, address: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Start Date</label>
                            <input type="date" required className="input-field" value={newEvent.startDate} onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">End Date</label>
                            <input type="date" required className="input-field" value={newEvent.endDate} onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Start Time</label>
                            <input type="time" required className="input-field" value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">End Time</label>
                            <input type="time" required className="input-field" value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Entry Fee (₹)</label>
                            <input type="number" required className="input-field" value={newEvent.entryFee} onChange={e => setNewEvent({ ...newEvent, entryFee: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" disabled={creating} className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '1rem 2rem' }}>
                        {creating ? 'Publishing...' : 'Publish Event'}
                    </button>
                </form>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 className="outfit-font" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Total Events Posted</h3>
                    <p style={{ fontSize: '3rem', fontWeight: 700 }}>{events.length}</p>
                </div>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 className="outfit-font" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Applications Received</h3>
                    <p style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--info)' }}>{applications.length}</p>
                </div>
            </div>

            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="outfit-font" style={{ fontSize: '2rem' }}>Student Applications Reviews</h2>
                </div>

                <div className="glass-card" style={{ overflowX: 'auto', padding: '1px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1.5rem 1rem', fontWeight: 600 }}>Student & College</th>
                                <th style={{ padding: '1.5rem 1rem', fontWeight: 600 }}>Event</th>
                                <th style={{ padding: '1.5rem 1rem', fontWeight: 600 }}>ID Cards</th>
                                <th style={{ padding: '1.5rem 1rem', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '1.5rem 1rem', fontWeight: 600 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map(app => (
                                <tr key={app._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 500 }}>{app.student?.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{app.student?.college}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{app.event?.title}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {app.student?.idCardFront ? <a href={`http://localhost:5000/${app.student.idCardFront}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '0.875rem' }}>Front ID</a> : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No Front</span>}
                                            {app.student?.idCardBack ? <a href={`http://localhost:5000/${app.student.idCardBack}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '0.875rem' }}>Back ID</a> : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No Back</span>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: app.status === 'confirmed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: app.status === 'confirmed' ? 'var(--success)' : 'var(--warning)' }}>
                                            {app.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        {app.status !== 'confirmed' && <button onClick={() => handleUpdateStatus(app._id, 'confirmed')} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', borderColor: 'var(--success)', color: 'var(--success)' }}>Accept</button>}
                                        {app.status !== 'rejected' && <button onClick={() => handleUpdateStatus(app._id, 'rejected')} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', borderColor: 'var(--error)', color: 'var(--error)' }}>Reject</button>}
                                    </td>
                                </tr>
                            ))}
                            {applications.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No applications received yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
