import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Monitor, Palette, Trophy, Wrench, Calendar, MapPin, Clock, IndianRupee, Search, User, FileText, Phone, Mail, Building2, Eye, X, ChevronDown, ChevronUp, Users, Bus, Pencil, History } from 'lucide-react';

const CATEGORY_ICONS = {
    Symposium: { icon: Users, color: '#8b5cf6', label: 'Symposium' },
    Sports: { icon: Trophy, color: '#f59e0b', label: 'Sports' },
    Events: { icon: Calendar, color: '#14b8a6', label: 'Events' },
    Technical: { icon: Monitor, color: '#6366f1', label: 'Technical' },
    'Non-Technical': { icon: Palette, color: '#ec4899', label: 'Non-Technical' },
    Workshop: { icon: Wrench, color: '#10b981', label: 'Workshop' },
};

export default function CollegeDashboard({ searchQuery: searchQueryProp = '' }) {
    const { token, user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const isEventFinished = (event) => {
        if (!event?.endDate) return false;
        return new Date() > new Date(event.endDate);
    };

    const activeEvents = events.filter(e => !isEventFinished(e));

    // Search and Modal State — driven by Header via prop
    const [searchQuery, setSearchQuery] = useState(searchQueryProp);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showApplications, setShowApplications] = useState(false);

    // Sync searchQuery from Header prop
    useEffect(() => {
        setSearchQuery(searchQueryProp);
        setSearchCollegeQuery(searchQueryProp);
    }, [searchQueryProp]);

    // College Search State
    const [searchCollegeQuery, setSearchCollegeQuery] = useState('');
    const [collegeResults, setCollegeResults] = useState([]);
    // Track followed colleges
    const [followingIds, setFollowingIds] = useState(new Set());
    const [followLoading, setFollowLoading] = useState(new Set());

    const handleSearchColleges = async () => {
        if (!searchCollegeQuery) { setCollegeResults([]); return; }
        try {
            const res = await axios.get(`http://localhost:5000/api/college/search?query=${searchCollegeQuery}`, { headers: { Authorization: `Bearer ${token}` } });
            setCollegeResults(res.data);
        } catch (err) { console.error(err) }
    };

    // Debounce college search
    useEffect(() => {
        const t = setTimeout(() => handleSearchColleges(), 500);
        return () => clearTimeout(t);
    }, [searchCollegeQuery]);

    // Sync following status from global user state
    useEffect(() => {
        if (user?.following) {
            setFollowingIds(new Set(user.following));
        }
    }, [user?.following]);

    const handleFollowToggle = async (collegeId) => {
        setFollowLoading(prev => new Set(prev).add(collegeId));
        try {
            const isFollowing = followingIds.has(collegeId);
            if (isFollowing) {
                const res = await axios.delete(`http://localhost:5000/api/college/unfollow/${collegeId}`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.user) updateUser(res.data.user);
            } else {
                const res = await axios.post(`http://localhost:5000/api/college/follow/${collegeId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.user) updateUser(res.data.user);
            }
        } catch (err) { console.error(err); }
        finally { setFollowLoading(prev => { const next = new Set(prev); next.delete(collegeId); return next; }); }
    };

    // Old alias
    const handleFollowCollege = handleFollowToggle;

    // New Event Form State
    const [showEventForm, setShowEventForm] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '', category: 'Symposium', type: '',
        startTime: '', endTime: '', startDate: '', endDate: '', address: '', entryFee: 0,
        qrCode: null, poster: null, collegeBusRoutes: '', localBusRoutes: '', contactNumber: '', email: '',
        registrationEndDate: '', mapLink: '',
        technicalEvents: '', nonTechnicalEvents: '', workshopEvents: ''
    });
    const [creating, setCreating] = useState(false);

    // Edit Event State
    const [editingEvent, setEditingEvent] = useState(null);
    const [selectedEventDetailsModal, setSelectedEventDetailsModal] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [updating, setUpdating] = useState(false);

    const openEditModal = (event) => {
        const fmt = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
        setEditForm({
            title: event.title || '',
            category: event.category || 'Symposium',
            subCategory: event.subCategory || 'Technical',
            type: event.type || '',
            address: event.address || '',
            mapLink: event.mapLink || '',
            startDate: fmt(event.startDate),
            endDate: fmt(event.endDate),
            registrationEndDate: fmt(event.registrationEndDate),
            startTime: event.startTime || '',
            endTime: event.endTime || '',
            contactNumber: event.contactNumber || '',
            email: event.email || '',
            foodProvided: event.foodProvided || false,
            entryFee: event.entryFee ?? 0,
            collegeBusRoutes: event.collegeBusRoutes || '',
            localBusRoutes: event.localBusRoutes || '',
            qrCode: null,
            poster: null,
            technicalEvents: event.technicalEvents?.join(', ') || '',
            nonTechnicalEvents: event.nonTechnicalEvents?.join(', ') || '',
            workshopEvents: event.workshopEvents?.join(', ') || '',
        });
        setEditingEvent(event);
    };

    const handleEditEvent = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const formData = new FormData();
            for (const key in editForm) {
                if (editForm[key] !== null && editForm[key] !== undefined) {
                    if (['technicalEvents', 'nonTechnicalEvents', 'workshopEvents'].includes(key)) {
                        const arr = editForm[key].split(',').map(s => s.trim()).filter(s => s);
                        formData.append(key, JSON.stringify(arr));
                    } else {
                        formData.append(key, editForm[key]);
                    }
                }
            }
            if (editForm.category !== 'Symposium') formData.delete('subCategory');
            await axios.put(`http://localhost:5000/api/college/events/${editingEvent._id}`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            setEditingEvent(null);
            fetchDashboardData();
        } catch (err) {
            console.error('Failed to update event', err);
            alert(err.response?.data?.message || 'Failed to update event.');
        } finally {
            setUpdating(false);
        }
    };

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
                    if (['technicalEvents', 'nonTechnicalEvents', 'workshopEvents'].includes(key)) {
                        const arr = newEvent[key].split(',').map(s => s.trim()).filter(s => s);
                        formData.append(key, JSON.stringify(arr));
                    } else {
                        formData.append(key, newEvent[key]);
                    }
                }
            }

            await axios.post('http://localhost:5000/api/college/events', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowEventForm(false);
            setNewEvent({
                title: '', category: 'Symposium', type: '',
                startTime: '', endTime: '', startDate: '', endDate: '', address: '', entryFee: 0,
                qrCode: null, poster: null, collegeBusRoutes: '', localBusRoutes: '', contactNumber: '', email: '',
                registrationEndDate: '', mapLink: '',
                technicalEvents: '', nonTechnicalEvents: '', workshopEvents: ''
            });
            fetchDashboardData();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to publish event. Please check all required fields.');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
        try {
            await axios.delete(`http://localhost:5000/api/college/events/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDashboardData();
        } catch (err) {
            console.error("Failed to delete event", err);
            alert("Failed to delete event.");
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Dashboard...</div>;

    const getCategoryIcon = (category, subCategory) => {
        const catKey = category === 'Symposium' && subCategory ? subCategory.toLowerCase() : category?.toLowerCase();
        const cat = CATEGORY_ICONS[catKey] || CATEGORY_ICONS['events'];
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
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button className="btn btn-outline" onClick={() => navigate('/history')} style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'var(--accent-secondary)' }}>
                        <History size={18} /> Event History
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowEventForm(!showEventForm)}>
                        {showEventForm ? 'Cancel Form' : '+ Post New Event'}
                    </button>
                </div>
            </div>


            {showEventForm && (
                <form onSubmit={handleCreateEvent} className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h2 className="outfit-font" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Create New Event</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Event Title</label>
                            <input type="text" required className="input-field" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                        </div>
                        <div className="input-group" style={{ gridColumn: newEvent.category === 'Symposium' ? 'auto' : '1 / -1' }}>
                            <label className="input-label">Category</label>
                            <select className="input-field" value={newEvent.category} onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}>
                                <option value="Symposium">Symposium</option>
                                <option value="Sports">Sports</option>
                                <option value="Events">General Events</option>
                            </select>
                        </div>
                        {newEvent.category === 'Symposium' ? (
                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <h4 className="outfit-font" style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>Event Type Boxes (Add multiple names separated by commas)</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                        <label className="input-label">Technical Events Box</label>
                                        <textarea className="input-field" rows="4" placeholder="e.g. Paper Presentation, Debugging" value={newEvent.technicalEvents} onChange={e => setNewEvent({ ...newEvent, technicalEvents: e.target.value })}></textarea>
                                    </div>
                                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                        <label className="input-label">Non-Technical Events Box</label>
                                        <textarea className="input-field" rows="4" placeholder="e.g. Photography, Treasure Hunt" value={newEvent.nonTechnicalEvents} onChange={e => setNewEvent({ ...newEvent, nonTechnicalEvents: e.target.value })}></textarea>
                                    </div>
                                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                        <label className="input-label">Workshop Box</label>
                                        <textarea className="input-field" rows="4" placeholder="e.g. AI/ML, Blockchain" value={newEvent.workshopEvents} onChange={e => setNewEvent({ ...newEvent, workshopEvents: e.target.value })}></textarea>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="input-label" style={{ color: 'var(--accent-primary)' }}>Specific Events / Categories (Comma separated)</label>
                                <textarea
                                    className="input-field"
                                    rows="3"
                                    placeholder={newEvent.category === 'Sports' ? "e.g. Cricket, Football, Chess, Athletics (100m)" : "e.g. Singing, Dancing, Drama, Magic Show"}
                                    value={newEvent.technicalEvents}
                                    onChange={e => setNewEvent({ ...newEvent, technicalEvents: e.target.value })}
                                ></textarea>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>These will be shown as checkboxes for students to select during registration.</p>
                            </div>
                        )}
                        <div className="input-group">
                            <label className="input-label">Type (Workshop, Symposium, etc)</label>
                            <input type="text" required className="input-field" value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Address / Location</label>
                            <input type="text" required className="input-field" value={newEvent.address} onChange={e => setNewEvent({ ...newEvent, address: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Map URL (Google Maps Link)</label>
                            <input type="url" placeholder="https://maps.google.com/..." className="input-field" value={newEvent.mapLink} onChange={e => setNewEvent({ ...newEvent, mapLink: e.target.value })} />
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
                            <label className="input-label">Registration End Date</label>
                            <input type="date" required className="input-field" value={newEvent.registrationEndDate} onChange={e => setNewEvent({ ...newEvent, registrationEndDate: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Contact Number</label>
                            <input type="text" className="input-field" value={newEvent.contactNumber} onChange={e => setNewEvent({ ...newEvent, contactNumber: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Contact Email</label>
                            <input type="email" className="input-field" value={newEvent.email} onChange={e => setNewEvent({ ...newEvent, email: e.target.value })} />
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
                            <label className="input-label">Event Poster Image (Optional)</label>
                            <input type="file" className="input-field" accept="image/*" onChange={e => setNewEvent({ ...newEvent, poster: e.target.files[0] })} />
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

            {/* College search results driven by the Header search bar */}
            {collegeResults.length > 0 && searchQuery && (
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 className="outfit-font" style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <Building2 size={18} /> Colleges matching &ldquo;{searchQuery}&rdquo;
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {collegeResults.map(c => {
                            const isFollowed = followingIds.has(c._id);
                            const isLoadingThis = followLoading.has(c._id);
                            return (
                                <div key={c._id} className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                        {c.profilePic ? (
                                            <img src={`http://localhost:5000/${c.profilePic}`} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: isFollowed ? '2px solid #10b981' : '2px solid transparent', transition: 'border-color 0.3s' }} alt="College Logo" />
                                        ) : (
                                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isFollowed ? '2px solid #10b981' : '2px solid var(--border-color)', transition: 'border-color 0.3s' }}>
                                                <Building2 size={20} />
                                            </div>
                                        )}
                                        <div>
                                            <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'block' }}>{c.name}</span>
                                            {isFollowed && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Followed</span>}
                                        </div>
                                    </div>
                                    {c._id !== user?._id && (
                                        <button
                                            onClick={() => handleFollowToggle(c._id)}
                                            disabled={isLoadingThis}
                                            style={{
                                                padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 600,
                                                cursor: isLoadingThis ? 'wait' : 'pointer', transition: 'all 0.3s', border: 'none',
                                                background: isFollowed ? 'linear-gradient(135deg, #10b981, #34d399)' : 'var(--accent-primary)',
                                                color: 'white', minWidth: '90px',
                                                boxShadow: isFollowed ? '0 4px 12px rgba(16,185,129,0.4)' : '0 4px 12px rgba(99,102,241,0.3)'
                                            }}
                                        >
                                            {isLoadingThis ? '...' : isFollowed ? 'Unfollow' : 'Follow'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div className="glass-card animate-fade-in" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <h3 className="outfit-font" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Total Active Events</h3>
                    <p style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{activeEvents.length}</p>
                </div>
                <div
                    className="glass-card animate-fade-in animate-delay-1"
                    onClick={() => setShowApplications(!showApplications)}
                    style={{
                        padding: '2rem',
                        cursor: 'pointer',
                        background: showApplications ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.15) 100%)' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(52, 211, 153, 0.05) 100%)',
                        transition: 'all 0.3s ease',
                        border: showApplications ? '2px solid var(--success)' : '1px solid rgba(16, 185, 129, 0.2)',
                        transform: showApplications ? 'scale(1.02)' : 'scale(1)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.15)'; }}
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
                    {activeEvents.filter(e => {
                        if (!searchQuery) return true;
                        return e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || e.applicationNumber === searchQuery;
                    }).map(event => {
                        const catKey = event.subCategory && event.category === 'Symposium' ? event.subCategory : event.category;
                        const cat = CATEGORY_ICONS[catKey] || { icon: Calendar, color: '#14b8a6', label: catKey };
                        const IconComp = cat?.icon || Calendar;
                        return (
                            <div key={event._id} className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div
                                    onClick={() => setSelectedEventDetailsModal(event)}
                                    style={{ cursor: 'pointer', flexShrink: 0 }}
                                >
                                    {event.posterUrl ? (
                                        <div style={{ height: '140px', background: `url(http://localhost:5000/${event.posterUrl}) center/cover no-repeat`, transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                                    ) : (
                                        <div style={{ height: '8px', background: cat ? cat.color : 'var(--accent-primary)' }} />
                                    )}
                                </div>
                                <div style={{ padding: '1.5rem', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <IconComp size={18} style={{ color: cat ? cat.color : 'var(--accent-primary)' }} />
                                            <span style={{ background: `${cat?.color || 'var(--accent-primary)'}15`, color: cat?.color || 'var(--accent-primary)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{event.category} {event.subCategory ? `- ${event.subCategory}` : ''}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button onClick={() => openEditModal(event)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '0.25rem' }} title="Edit Event">
                                                <Pencil size={18} />
                                            </button>
                                            <button onClick={() => handleDeleteEvent(event._id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem' }} title="Delete Event">
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="outfit-font" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>{event.title}</h3>
                                    <p style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>🏫 {event.collegeName || user?.name}</p>
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

            {/* ===== Event Details Modal (Shows full poster) ===== */}
            {selectedEventDetailsModal && (
                <div className="modal-overlay" style={{ zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-card modal-content" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: 0 }}>
                        <button onClick={() => setSelectedEventDetailsModal(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#5f6368', background: 'white', borderRadius: '50%', padding: '0.2rem', zIndex: 10, cursor: 'pointer', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                            <X size={24} />
                        </button>
                        {selectedEventDetailsModal.posterUrl ? (
                            <img src={`http://localhost:5000/${selectedEventDetailsModal.posterUrl}`} alt="Event Poster" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }} />
                        ) : (
                            <div style={{ padding: '3rem', background: CATEGORY_ICONS[selectedEventDetailsModal.category]?.bg || 'var(--accent-primary)', color: 'white', textAlign: 'center' }}>
                                <h1 style={{ fontSize: '2rem', margin: 0 }}>{selectedEventDetailsModal.title}</h1>
                            </div>
                        )}
                        <div style={{ padding: '2rem' }}>
                            <h2 className="outfit-font" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{selectedEventDetailsModal.title}</h2>
                            <p style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Building2 size={18} /> {selectedEventDetailsModal.collegeName || selectedEventDetailsModal.organizer?.name || 'Unknown College'}
                            </p>

                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem', whiteSpace: 'pre-line' }}>{selectedEventDetailsModal.description}</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem', background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '1rem' }}>
                                <div>
                                    <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>DATE & TIME</strong>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginTop: '0.25rem' }}>{new Date(selectedEventDetailsModal.startDate).toLocaleDateString()} at {selectedEventDetailsModal.startTime}</div>
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ENTRY FEE</strong>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginTop: '0.25rem' }}>₹{selectedEventDetailsModal.entryFee || 0}</div>
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>LOCATION</strong>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginTop: '0.25rem' }}>{selectedEventDetailsModal.address}</div>
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>LAST DATE TO APPLY</strong>
                                    <div style={{ color: 'var(--error)', fontWeight: 600, marginTop: '0.25rem' }}>{new Date(selectedEventDetailsModal.endDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Edit Event Modal ===== */}
            {editingEvent && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '820px', padding: '2rem', position: 'relative', maxHeight: '92vh', overflowY: 'auto' }}>
                        <button onClick={() => setEditingEvent(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        <h2 className="outfit-font" style={{ fontSize: '1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Pencil size={22} style={{ color: 'var(--accent-primary)' }} /> Edit Event
                        </h2>
                        <form onSubmit={handleEditEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Event Title</label>
                                    <input type="text" required className="input-field" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ gridColumn: editForm.category === 'Symposium' ? 'auto' : '1 / -1' }}>
                                    <label className="input-label">Category</label>
                                    <select className="input-field" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                                        <option value="Symposium">Symposium</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Events">General Events</option>
                                    </select>
                                </div>
                                {editForm.category === 'Symposium' ? (
                                    <>
                                        <div className="input-group">
                                            <label className="input-label">Subcategory</label>
                                            <select className="input-field" value={editForm.subCategory} onChange={e => setEditForm({ ...editForm, subCategory: e.target.value })}>
                                                <option value="Technical">Technical</option>
                                                <option value="Non-Technical">Non-Technical</option>
                                                <option value="Workshop">Workshop</option>
                                            </select>
                                        </div>
                                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="input-label">Technical Events (comma separated)</label>
                                            <textarea className="input-field" rows="3" value={editForm.technicalEvents} onChange={e => setEditForm({ ...editForm, technicalEvents: e.target.value })} />
                                        </div>
                                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="input-label">Non-Technical Events (comma separated)</label>
                                            <textarea className="input-field" rows="3" value={editForm.nonTechnicalEvents} onChange={e => setEditForm({ ...editForm, nonTechnicalEvents: e.target.value })} />
                                        </div>
                                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="input-label">Workshop Events (comma separated)</label>
                                            <textarea className="input-field" rows="3" value={editForm.workshopEvents} onChange={e => setEditForm({ ...editForm, workshopEvents: e.target.value })} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">Specific Events / Categories (Comma separated)</label>
                                        <textarea
                                            className="input-field"
                                            rows="3"
                                            placeholder={editForm.category === 'Sports' ? "e.g. Cricket, Football, Chess" : "e.g. Singing, Dancing"}
                                            value={editForm.technicalEvents}
                                            onChange={e => setEditForm({ ...editForm, technicalEvents: e.target.value })}
                                        ></textarea>
                                    </div>
                                )}
                                <div className="input-group">
                                    <label className="input-label">Type (Workshop, Symposium, etc)</label>
                                    <input type="text" required className="input-field" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Address / Location</label>
                                    <input type="text" required className="input-field" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Google Maps Link (Optional)</label>
                                    <input type="url" placeholder="https://maps.google.com/..." className="input-field" value={editForm.mapLink} onChange={e => setEditForm({ ...editForm, mapLink: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Start Date</label>
                                    <input type="date" required className="input-field" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">End Date</label>
                                    <input type="date" required className="input-field" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Registration End Date</label>
                                    <input type="date" className="input-field" value={editForm.registrationEndDate} onChange={e => setEditForm({ ...editForm, registrationEndDate: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Contact Number</label>
                                    <input type="text" className="input-field" value={editForm.contactNumber} onChange={e => setEditForm({ ...editForm, contactNumber: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Contact Email</label>
                                    <input type="email" className="input-field" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Start Time</label>
                                    <input type="time" required className="input-field" value={editForm.startTime} onChange={e => setEditForm({ ...editForm, startTime: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">End Time</label>
                                    <input type="time" required className="input-field" value={editForm.endTime} onChange={e => setEditForm({ ...editForm, endTime: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Entry Fee (₹)</label>
                                    <input type="number" required className="input-field" value={editForm.entryFee} onChange={e => setEditForm({ ...editForm, entryFee: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="input-label">Replace Event Poster Image (Optional)</label>
                                    <input type="file" className="input-field" accept="image/*" onChange={e => setEditForm({ ...editForm, poster: e.target.files[0] })} />
                                    {editingEvent?.posterUrl && !editForm.poster && (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>Current poster on file — upload a new one to replace it.</p>
                                    )}
                                </div>
                                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="input-label">Replace Payment QR Code Image (Optional)</label>
                                    <input type="file" className="input-field" accept="image/*" onChange={e => setEditForm({ ...editForm, qrCode: e.target.files[0] })} />
                                    {editingEvent?.qrCode && !editForm.qrCode && (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>Current QR code on file — upload a new one to replace it.</p>
                                    )}
                                </div>
                                <div className="input-group">
                                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bus size={16} /> College Bus Routes</label>
                                    <textarea className="input-field" rows="3" value={editForm.collegeBusRoutes} onChange={e => setEditForm({ ...editForm, collegeBusRoutes: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bus size={16} /> Local Bus Routes (Bus Stop Names)</label>
                                    <textarea className="input-field" rows="3" value={editForm.localBusRoutes} onChange={e => setEditForm({ ...editForm, localBusRoutes: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                <button type="button" onClick={() => setEditingEvent(null)} className="btn btn-outline" style={{ padding: '0.75rem 2rem' }}>Cancel</button>
                                <button type="submit" disabled={updating} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                                    {updating ? 'Saving...' : '💾 Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Student Applications Modal */}
            {showApplications && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '1000px', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setShowApplications(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-secondary)', zIndex: 10 }}>
                            <X size={24} />
                        </button>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className="outfit-font" style={{ fontSize: '2rem', margin: 0 }}>Student List</h2>
                        </div>

                        <div style={{ overflowX: 'auto', padding: '1px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>Student details</th>
                                        <th style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>Contact Info</th>
                                        <th style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>Event</th>
                                        <th style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications
                                        .filter(app => {
                                            if (!searchQuery) return true;
                                            const q = searchQuery.toLowerCase();
                                            return (
                                                app.name?.toLowerCase().includes(q) ||
                                                app.student?.name?.toLowerCase().includes(q) ||
                                                app.student?.college?.toLowerCase().includes(q) ||
                                                app.event?.title?.toLowerCase().includes(q) ||
                                                app.applicationNumber?.toLowerCase().includes(q)
                                            );
                                        })
                                        .map(app => (
                                            <tr key={app._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div
                                                        onClick={() => navigate(`/student/${app.student?._id || app.student}`)}
                                                        style={{ fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                                                    >
                                                        {app.name || app.student?.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>🏫 {app.collegeName || app.student?.college}</div>
                                                    {app.degree && <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Degree: {app.degree} {app.year ? `(${app.year})` : ''}</div>}
                                                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', padding: '0.2rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', display: 'inline-block' }}>Total Apps: {app.studentApplyCount || 1}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>App No: {app.applicationNumber || 'N/A'}</div>
                                                    <div style={{ fontSize: '0.875rem' }}>📧 {app.email || app.student?.email}</div>
                                                    {app.phoneNumber && <div style={{ fontSize: '0.875rem' }}>📞 {app.phoneNumber || app.student?.mobile}</div>}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {getCategoryIcon(app.event?.category, app.event?.subCategory)}
                                                        {app.event?.title}
                                                    </div>
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
                    <div className="glass-card modal-content" style={{ maxWidth: '640px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setSelectedApplication(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div className="category-icon-circle" style={{ background: 'rgba(99, 102, 241, 0.1)', borderColor: '#6366f1', width: '64px', height: '64px' }}>
                                <User size={32} style={{ color: '#6366f1' }} />
                            </div>
                            <div>
                                <h2 className="outfit-font" style={{ fontSize: '1.75rem', margin: 0 }}>{selectedApplication.name || selectedApplication.student?.name}</h2>
                                <p style={{ color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                                    <Building2 size={16} /> {selectedApplication.collegeName || selectedApplication.student?.college}
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-tertiary)' }}>Department:</span> <span style={{ fontWeight: 500 }}>{selectedApplication.department || selectedApplication.student?.department || 'N/A'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-tertiary)' }}>Year:</span> <span style={{ fontWeight: 500 }}>{selectedApplication.year || selectedApplication.student?.year || 'N/A'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-tertiary)' }}>Roll No:</span> <span style={{ fontWeight: 500 }}>{selectedApplication.rollNo || selectedApplication.student?.rollNo || 'N/A'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-tertiary)' }}>Reg No:</span> <span style={{ fontWeight: 500 }}>{selectedApplication.regNo || selectedApplication.student?.regNo || 'N/A'}</span></div>
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
                                        <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Mail size={14} /> {selectedApplication.email || selectedApplication.student?.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <span style={{ color: 'var(--text-tertiary)' }}>Mobile Number:</span>
                                        <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Phone size={14} /> {selectedApplication.phoneNumber || selectedApplication.student?.mobile || 'N/A'}</span>
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
                                    <MapPin size={16} style={{ color: 'var(--text-secondary)' }} /> Extra Details
                                </h3>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>Food Preference:</strong> {selectedApplication.foodPreference || 'N/A'}
                                </p>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>College Address:</strong> {selectedApplication.student?.collegeAddress || 'No detailed address provided.'}
                                </p>
                                {selectedApplication.selectedEvents?.length > 0 && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                        <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>Selected Events:</strong>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {selectedApplication.selectedEvents.map(ev => (
                                                <span key={ev} style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>{ev}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedApplication.paymentScreenshot && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>Payment Screenshot:</strong>
                                        <img src={`http://localhost:5000/${selectedApplication.paymentScreenshot}`} alt="Payment Screenshot" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                    </div>
                                )}
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
