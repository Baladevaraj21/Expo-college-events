import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export default function StudentDashboard({ searchQuery = '', showFilter = false }) {
    const { token } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // New States
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedEventForModal, setSelectedEventForModal] = useState(null);
    const [applicationNotes, setApplicationNotes] = useState('');

    const fetchData = async () => {
        try {
            const [eventsRes, appsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/student/events', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/student/profile', { headers: { Authorization: `Bearer ${token}` } }) // Ideally a separate endpoint for My Applications, but keeping it simple
            ]);
            setEvents(eventsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const handleApply = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await axios.post('http://localhost:5000/api/student/applications', {
                eventId: selectedEventForModal._id,
                notes: applicationNotes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Successfully applied to the event!');
            setSelectedEventForModal(null);
            setApplicationNotes('');
            fetchData();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to apply.');
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Events...</div>;

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 className="outfit-font" style={{ fontSize: '2.5rem', color: 'var(--accent-primary)' }}>Student Dashboard</h1>
            </div>

            {showFilter && (
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', overflowX: 'auto' }}>
                    {['all', 'technical', 'non-technical', 'sports', 'workshop'].map(cat => (
                        <button
                            key={cat}
                            className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setSelectedCategory(cat)}
                            style={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}
                        >
                            {cat === 'all' ? 'All Events' : cat}
                        </button>
                    ))}
                </div>
            )}

            {message && <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', marginBottom: '2rem', borderRadius: '0.5rem' }}>{message}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {filteredEvents.map(event => (
                    <div key={event._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', display: 'flex', alignItems: 'flex-end', padding: '1rem' }}>
                            <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                                {event.category.toUpperCase()}
                            </span>
                        </div>
                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h3 className="outfit-font" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{event.title}</h3>
                            <p style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>By {event.organizer?.name || 'Unknown College'}</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', flex: 1 }}>{event.description}</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                <div><span style={{ color: 'var(--text-tertiary)' }}>Date:</span> {new Date(event.startDate).toLocaleDateString()}</div>
                                <div><span style={{ color: 'var(--text-tertiary)' }}>Fee:</span> ₹{event.entryFee}</div>
                                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-tertiary)' }}>Location:</span> {event.address}</div>
                            </div>

                            <button onClick={() => setSelectedEventForModal(event)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                Apply Now
                            </button>
                        </div>
                    </div>
                ))}
                {filteredEvents.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No events found matching your search.</p>}
            </div>

            {/* Application Form Modal */}
            {selectedEventForModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setSelectedEventForModal(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>
                        <h2 className="outfit-font" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Apply for {selectedEventForModal.title}</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Organized by {selectedEventForModal.organizer?.name}</p>

                        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Any notes or questions for the organizer? (Optional)</label>
                                <textarea
                                    className="input-field"
                                    rows="3"
                                    placeholder="e.g. I need accommodation..."
                                    value={applicationNotes}
                                    onChange={(e) => setApplicationNotes(e.target.value)}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setSelectedEventForModal(null)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Application</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
