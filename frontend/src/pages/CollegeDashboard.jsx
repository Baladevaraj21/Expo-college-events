import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Monitor, Palette, Trophy, Wrench, Calendar, MapPin, Clock, IndianRupee, Search, User, FileText, Phone, Mail, Building2, Eye, X, ChevronDown, ChevronUp, Users, Bus } from 'lucide-react';

const CATEGORY_ICONS = {
    technical: { icon: Monitor, color: '#6366f1', label: 'Technical' },
    'non-technical': { icon: Palette, color: '#ec4899', label: 'Non-Technical' },
    sports: { icon: Trophy, color: '#f59e0b', label: 'Sports' },
    workshop: { icon: Wrench, color: '#10b981', label: 'Workshop' },
};

export default function CollegeDashboard() {
    const { token, user } = useAuth();
    const [events, setEvents] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const isEventFinished = (event) => {
        if (!event?.endDate) return false;
        return new Date() > new Date(event.endDate);
    };

    const activeEvents = events.filter(e => !isEventFinished(e));

    // Search and Modal State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showApplications, setShowApplications] = useState(false);

    // New Event Form State
    const [showEventForm, setShowEventForm] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', description: '', category: 'technical', type: '', startTime: '', endTime: '', startDate: '', endDate: '', address: '', entryFee: 0, qrCode: null, collegeBusRoutes: '', localBusRoutes: '' });
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
            const formData = new FormData();
            for (const key in newEvent) {
                if (newEvent[key] !== null) {
                    formData.append(key, newEvent[key]);
                }
            }

            await axios.post('http://localhost:5000/api/college/events', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowEventForm(false);
            setNewEvent({ title: '', description: '', category: 'technical', type: '', startTime: '', endTime: '', startDate: '', endDate: '', address: '', entryFee: 0, qrCode: null, collegeBusRoutes: '', localBusRoutes: '' });
            fetchDashboardData();
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Dashboard...</div>;

    const getCategoryIcon = (category) => {
        const cat = CATEGORY_ICONS[category];
        if (!cat) return null;
        const IconComp = cat.icon;
        return <IconComp size={18} style={{ color: cat.color }} />;
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="outfit-font" style={{ fontSize: '2.5rem', color: 'var(--accent-primary)' }}>College Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
                        🏫 <strong>{user?.name || 'Your College'}</strong>
                    </p>
                </div>
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
                                <option value="workshop">Workshop</option>
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
                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label">Payment QR Code Image (Optional)</label>
                            <input type="file" className="input-field" accept="image/*" onChange={e => setNewEvent({ ...newEvent, qrCode: e.target.files[0] })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bus size={16} /> College Bus Routes</label>
                            <textarea className="input-field" rows="3" placeholder="e.g. Route 1: Campus → Railway Station (8AM, 9AM)&#10;Route 2: Campus → Bus Stand (8:30AM)" value={newEvent.collegeBusRoutes} onChange={e => setNewEvent({ ...newEvent, collegeBusRoutes: e.target.value })}></textarea>
                        </div>
                        <div className="input-group">
                            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bus size={16} /> Local Bus Routes (Bus Stop Names)</label>
                            <textarea className="input-field" rows="3" placeholder="e.g. Central Station, Anna Nagar Stop, Airport Roundabout" value={newEvent.localBusRoutes} onChange={e => setNewEvent({ ...newEvent, localBusRoutes: e.target.value })}></textarea>
                        </div>
                    </div>
                    <button type="submit" disabled={creating} className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '1rem 2rem' }}>
                        {creating ? 'Publishing...' : 'Publish Event'}
                    </button>
                </form>
            )}

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
                    <h3 className="outfit-font" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Total Active Events</h3>
                    <p style={{ fontSize: '3rem', fontWeight: 700 }}>{activeEvents.length}</p>
                </div>
                <div
                    className="glass-card animate-fade-in animate-delay-1"
                    onClick={() => setShowApplications(!showApplications)}
                    style={{
                        padding: '2rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: showApplications ? '2px solid var(--info)' : '2px solid transparent',
                        transform: showApplications ? 'scale(1.02)' : 'scale(1)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = showApplications ? 'scale(1.02)' : 'scale(1)'; e.currentTarget.style.boxShadow = ''; }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="outfit-font" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Student List</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--info)' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <p style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--info)' }}>{applications.length}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                        Click to view all student applications
                    </p>
                </div>
            </div>

            {/* My Posted Events */}
            <div style={{ marginBottom: '3rem' }}>
                <h2 className="outfit-font" style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Ongoing Events</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {activeEvents.map(event => {
                        const cat = CATEGORY_ICONS[event.category];
                        const IconComp = cat?.icon;
                        return (
                            <div key={event._id} className="glass-card" style={{ overflow: 'hidden' }}>
                                <div style={{ height: '8px', background: cat ? cat.color : 'var(--accent-primary)' }} />
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        {IconComp && <IconComp size={18} style={{ color: cat.color }} />}
                                        <span style={{ background: `${cat?.color || 'var(--accent-primary)'}15`, color: cat?.color || 'var(--accent-primary)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{event.category}</span>
                                    </div>
                                    <h3 className="outfit-font" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>{event.title}</h3>
                                    <p style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>🏫 {event.collegeName || user?.name}</p>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.description}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} /> {new Date(event.startDate).toLocaleDateString()}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> {event.startTime}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14} /> {event.address}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><IndianRupee size={14} /> ₹{event.entryFee}</span>
                                    </div>
                                    {(event.collegeBusRoutes || event.localBusRoutes) && (
                                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.35rem' }}>
                                                <Bus size={14} /> Local Bus Routes
                                            </div>
                                            {event.collegeBusRoutes && <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line', marginBottom: '0.25rem' }}><strong>College Bus:</strong> {event.collegeBusRoutes}</p>}
                                            {event.localBusRoutes && <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}><strong>Local Bus Stops:</strong> {event.localBusRoutes}</p>}
                                        </div>
                                    )}
                                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                                        <button
                                            className="btn btn-outline"
                                            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}
                                            onClick={() => {
                                                setSearchQuery(event.title);
                                                setShowApplications(true);
                                            }}
                                        >
                                            <FileText size={16} /> Application List
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {activeEvents.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No active events found. Create your first event above!</p>}
                </div>
            </div>

            {/* Student Applications Modal */}
            {showApplications && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '1000px', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setShowApplications(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-secondary)', zIndex: 10 }}>
                            <X size={24} />
                        </button>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className="outfit-font" style={{ fontSize: '2rem', margin: 0 }}>Student List</h2>

                            {/* Search Bar */}
                            <div className="input-group" style={{ marginBottom: 0, minWidth: '300px' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Search students, colleges, or events..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ paddingLeft: '2.75rem', borderRadius: '9999px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto', padding: '1px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>Student details</th>
                                        <th style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>Contact Info</th>
                                        <th style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>Event</th>
                                        <th style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>Status</th>
                                        <th style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications
                                        .filter(app => {
                                            if (!searchQuery) return true;
                                            const q = searchQuery.toLowerCase();
                                            return (
                                                app.student?.name?.toLowerCase().includes(q) ||
                                                app.student?.college?.toLowerCase().includes(q) ||
                                                app.event?.title?.toLowerCase().includes(q)
                                            );
                                        })
                                        .map(app => (
                                            <tr key={app._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{app.student?.name}</div>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>🏫 {app.student?.college}</div>
                                                    {app.student?.department && <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Dept: {app.student?.department} {app.student?.year ? `(${app.student?.year})` : ''}</div>}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontSize: '0.875rem' }}>📧 {app.student?.email}</div>
                                                    {app.student?.mobile && <div style={{ fontSize: '0.875rem' }}>📞 {app.student?.mobile}</div>}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {getCategoryIcon(app.event?.category)}
                                                        {app.event?.title}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{
                                                        width: '12px', height: '12px', borderRadius: '50%', margin: '0 auto',
                                                        background: app.status === 'confirmed' ? 'var(--success)' : 'var(--warning)',
                                                        boxShadow: `0 0 10px ${app.status === 'confirmed' ? 'var(--success)' : 'var(--warning)'}`
                                                    }} title={app.status.toUpperCase()} />
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button onClick={() => setSelectedApplication(app)} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <Eye size={14} /> View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    {applications.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No applications received yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Details Modal */}
            {selectedApplication && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setSelectedApplication(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div className="category-icon-circle" style={{ background: 'rgba(99, 102, 241, 0.1)', borderColor: '#6366f1', width: '64px', height: '64px' }}>
                                <User size={32} style={{ color: '#6366f1' }} />
                            </div>
                            <div>
                                <h2 className="outfit-font" style={{ fontSize: '1.75rem', margin: 0 }}>{selectedApplication.student?.name}</h2>
                                <p style={{ color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                                    <Building2 size={16} /> {selectedApplication.student?.college}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {/* Personal & Academic Info */}
                            <div className="glass-panel" style={{ padding: '1.25rem' }}>
                                <h3 className="outfit-font" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileText size={16} style={{ color: 'var(--text-secondary)' }} /> Academic Details
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-tertiary)' }}>Department:</span> <span style={{ fontWeight: 500 }}>{selectedApplication.student?.department || 'N/A'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-tertiary)' }}>Year:</span> <span style={{ fontWeight: 500 }}>{selectedApplication.student?.year || 'N/A'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-tertiary)' }}>Age:</span> <span style={{ fontWeight: 500 }}>{selectedApplication.student?.age || 'N/A'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-tertiary)' }}>Gender:</span> <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{selectedApplication.student?.gender || 'N/A'}</span></div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="glass-panel" style={{ padding: '1.25rem' }}>
                                <h3 className="outfit-font" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Phone size={16} style={{ color: 'var(--text-secondary)' }} /> Contact Details
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <span style={{ color: 'var(--text-tertiary)' }}>Email Address:</span>
                                        <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Mail size={14} /> {selectedApplication.student?.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <span style={{ color: 'var(--text-tertiary)' }}>Mobile Number:</span>
                                        <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Phone size={14} /> {selectedApplication.student?.mobile || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <span style={{ color: 'var(--text-tertiary)' }}>Home Location:</span>
                                        <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}><MapPin size={14} /> {selectedApplication.student?.place || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* College Address Info */}
                            <div className="glass-panel" style={{ padding: '1.25rem', gridColumn: '1 / -1' }}>
                                <h3 className="outfit-font" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={16} style={{ color: 'var(--text-secondary)' }} /> College Address
                                </h3>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                                    {selectedApplication.student?.collegeAddress || 'No detailed college address provided.'}
                                </p>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedApplication(null)} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
