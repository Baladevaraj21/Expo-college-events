import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { X, Monitor, Palette, Trophy, Wrench, Calendar, MapPin, Clock, IndianRupee, Building2, ChevronRight, User, Bus, Edit3, Star, MessageSquare, Send, FileText, LayoutList } from 'lucide-react';

const CATEGORY_ICONS = {
    technical: { icon: Monitor, color: '#6366f1', bg: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', label: 'Technical' },
    'non-technical': { icon: Palette, color: '#ec4899', bg: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', label: 'Non-Technical' },
    sports: { icon: Trophy, color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', label: 'Sports' },
    workshop: { icon: Wrench, color: '#10b981', bg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', label: 'Workshop' },
};

export default function StudentDashboard({ searchQuery = '', showFilter = false, notifEvent = null, clearNotifEvent }) {
    const { token } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Filter & Category
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedEventForModal, setSelectedEventForModal] = useState(null);
    const [studentProfile, setStudentProfile] = useState(null);

    // Category → College listing
    const [categoryBrowseModal, setCategoryBrowseModal] = useState(null);
    const [collegeList, setCollegeList] = useState([]);
    const [collegeListLoading, setCollegeListLoading] = useState(false);

    // Edit Profile Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editProfile, setEditProfile] = useState(null);
    const [editLoading, setEditLoading] = useState(false);

    // My Applied Events + Feedback
    const [myApplications, setMyApplications] = useState([]);
    const [feedbackModal, setFeedbackModal] = useState(null); // event object
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    const fetchData = async () => {
        try {
            const eventsRes = await axios.get('http://localhost:5000/api/student/events', { headers: { Authorization: `Bearer ${token}` } });
            setEvents(eventsRes.data);
        } catch (err) {
            console.error("Failed to fetch events", err);
        }

        try {
            const profileRes = await axios.get('http://localhost:5000/api/student/profile', { headers: { Authorization: `Bearer ${token}` } });
            setStudentProfile(profileRes.data);
        } catch (err) {
            console.error("Failed to fetch profile", err);
        }

        try {
            const appsRes = await axios.get('http://localhost:5000/api/student/my-applications', { headers: { Authorization: `Bearer ${token}` } });
            setMyApplications(appsRes.data);
        } catch (err) {
            console.error("Failed to fetch applications", err);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    // Auto-open apply form when notification event is clicked
    useEffect(() => {
        if (notifEvent && studentProfile) {
            setSelectedEventForModal(notifEvent);
            if (clearNotifEvent) clearNotifEvent();
        }
    }, [notifEvent, studentProfile]);

    const handleApply = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await axios.post('http://localhost:5000/api/student/applications', {
                eventId: selectedEventForModal._id,
                studentDetails: studentProfile // Send the potentially modified details
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Successfully applied to the event & updated profile!');
            setSelectedEventForModal(null);
            fetchData();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to apply.');
        }
    };

    const handleCategoryBrowse = async (category) => {
        setCategoryBrowseModal(category);
        setCollegeListLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/student/events-by-category/${category}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCollegeList(res.data);
        } catch (err) {
            console.error(err);
            setCollegeList([]);
        } finally {
            setCollegeListLoading(false);
        }
    };

    const handleEditProfile = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            const formData = new FormData();
            Object.keys(editProfile).forEach(key => {
                if (key !== '_id' && key !== 'email' && key !== 'password' && key !== '__v' && key !== 'role' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'certificates' && key !== 'idCardFront' && key !== 'idCardBack' && key !== 'profilePic') {
                    formData.append(key, editProfile[key] || '');
                }
            });
            await axios.put('http://localhost:5000/api/student/profile', formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            setMessage('Profile updated successfully!');
            setShowEditModal(false);
            fetchData();
        } catch (err) {
            setMessage('Failed to update profile.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        setFeedbackLoading(true);
        try {
            await axios.post('http://localhost:5000/api/student/feedback', {
                eventId: feedbackModal._id,
                rating: feedbackRating,
                comment: feedbackComment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Feedback submitted successfully!');
            setFeedbackModal(null);
            setFeedbackRating(0);
            setFeedbackComment('');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to submit feedback.');
        } finally {
            setFeedbackLoading(false);
        }
    };

    const openEditModal = () => {
        setEditProfile({ ...studentProfile });
        setShowEditModal(true);
    };

    const isEventFinished = (event) => {
        if (!event?.endDate) return false;
        return new Date() > new Date(event.endDate);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="outfit-font" style={{ fontSize: '2.5rem', color: 'var(--accent-primary)' }}>Student Dashboard</h1>
                <button onClick={openEditModal} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Edit3 size={18} /> Edit My Details
                </button>
            </div>

            {/* ── Stats Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="outfit-font" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Total Events Available</h3>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-primary)' }}>
                            <LayoutList size={24} />
                        </div>
                    </div>
                    <p style={{ fontSize: '3rem', fontWeight: 700, marginTop: '0.5rem' }}>{events.length}</p>
                </div>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="outfit-font" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>My Applications</h3>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--info)' }}>
                            <FileText size={24} />
                        </div>
                    </div>
                    <p style={{ fontSize: '3rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--info)' }}>{myApplications.length}</p>
                </div>
            </div>

            {/* ── Event Category Icons Browser ── */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h2 className="outfit-font" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Browse by Category</h2>
                <div className="category-icon-grid">
                    {Object.entries(CATEGORY_ICONS).map(([key, { icon: IconComp, color, label }]) => {
                        const count = events.filter(e => e.category === key).length;
                        return (
                            <button
                                key={key}
                                className="category-icon-card glass-card"
                                onClick={() => handleCategoryBrowse(key)}
                                style={{ textAlign: 'center', padding: '1.5rem', cursor: 'pointer', border: 'none', width: '100%' }}
                            >
                                <div className="category-icon-circle" style={{ background: `${color}15`, borderColor: color }}>
                                    <IconComp size={28} style={{ color }} />
                                </div>
                                <p style={{ fontWeight: 600, marginTop: '0.75rem', fontSize: '0.95rem' }}>{label}</p>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{count} event{count !== 1 ? 's' : ''}</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.5rem', color, fontSize: '0.75rem', fontWeight: 600 }}>
                                    View Colleges <ChevronRight size={14} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Category Filter Bar ── */}
            {showFilter && (
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', overflowX: 'auto' }}>
                    {['all', 'technical', 'non-technical', 'sports', 'workshop'].map(cat => (
                        <button
                            key={cat}
                            className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setSelectedCategory(cat)}
                            style={{ textTransform: 'capitalize', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            {cat !== 'all' && CATEGORY_ICONS[cat] && (() => { const IC = CATEGORY_ICONS[cat].icon; return <IC size={16} />; })()}
                            {cat === 'all' ? 'All Events' : CATEGORY_ICONS[cat]?.label || cat}
                        </button>
                    ))}
                </div>
            )}

            {message && <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', marginBottom: '2rem', borderRadius: '0.5rem' }}>{message}</div>}

            {/* ── Event Updates (Read-Only) ── */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 className="outfit-font" style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>📢 Event Updates</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Browse events from colleges across the network</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {filteredEvents.map(event => {
                    const cat = CATEGORY_ICONS[event.category];
                    const IconComp = cat?.icon;
                    return (
                        <div key={event._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ height: '120px', background: cat?.bg || 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '1rem' }}>
                                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    {IconComp && <IconComp size={14} />}
                                    {event.category.toUpperCase()}
                                </span>
                            </div>
                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 className="outfit-font" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{event.title}</h3>
                                <p style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Building2 size={14} /> {event.collegeName || event.organizer?.name || 'Unknown College'}
                                </p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.description}</p>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} /> {new Date(event.startDate).toLocaleDateString()}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><IndianRupee size={14} /> ₹{event.entryFee}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14} /> {event.address}</span>
                                </div>

                                {/* Bus Routes */}
                                {(event.collegeBusRoutes || event.localBusRoutes) && (
                                    <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.35rem' }}>
                                            <Bus size={14} /> Bus Routes
                                        </div>
                                        {event.collegeBusRoutes && <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line', marginBottom: '0.25rem' }}><strong>College:</strong> {event.collegeBusRoutes}</p>}
                                        {event.localBusRoutes && <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}><strong>Local:</strong> {event.localBusRoutes}</p>}
                                    </div>
                                )}

                                <button onClick={() => setSelectedEventForModal(event)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                    Apply Now
                                </button>
                            </div>
                        </div>
                    );
                })}
                {filteredEvents.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No events found matching your search.</p>}
            </div>

            {/* ── My Applied Events + Feedback ── */}
            {myApplications.length > 0 && (
                <div style={{ marginTop: '3rem' }}>
                    <h2 className="outfit-font" style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>📋 My Applied Events</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {myApplications.map(app => {
                            const event = app.event;
                            if (!event) return null;
                            const cat = CATEGORY_ICONS[event.category];
                            const finished = isEventFinished(event);
                            return (
                                <div key={app._id} className="glass-card" style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        {cat && (() => { const IC = cat.icon; return <IC size={16} style={{ color: cat.color }} />; })()}
                                        <span style={{ background: `${cat?.color || 'var(--accent-primary)'}15`, color: cat?.color || 'var(--accent-primary)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{event.category}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontWeight: 600, background: finished ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: finished ? 'var(--error)' : 'var(--success)' }}>
                                            {finished ? 'Ended' : 'Ongoing'}
                                        </span>
                                    </div>
                                    <h3 className="outfit-font" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>{event.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Building2 size={12} /> {event.collegeName}
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Calendar size={12} /> {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '9999px', fontWeight: 600, background: app.status === 'confirmed' ? 'rgba(16,185,129,0.1)' : app.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: app.status === 'confirmed' ? 'var(--success)' : app.status === 'rejected' ? 'var(--error)' : 'var(--warning)', textTransform: 'capitalize' }}>
                                            {app.status}
                                        </span>
                                        {finished ? (
                                            <button onClick={() => { setFeedbackModal(event); setFeedbackRating(0); setFeedbackComment(''); }} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <MessageSquare size={14} /> Give Feedback
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Feedback available after event ends</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Application Form Modal ── */}
            {selectedEventForModal && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setSelectedEventForModal(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>
                        <h2 className="outfit-font" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Apply for {selectedEventForModal.title}</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Building2 size={14} /> {selectedEventForModal.collegeName || selectedEventForModal.organizer?.name}
                        </p>

                        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {/* Student Info Review Section (Editable) */}
                            {studentProfile && (
                                <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '0.5rem', border: '1px solid var(--border-color)' }}>
                                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-primary)' }}>
                                        <User size={14} /> Verify & Update Applicant Details
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem', display: 'block' }}>Name</label>
                                            <input type="text" className="input-field" style={{ padding: '0.4rem', fontSize: '0.85rem', marginBottom: 0 }} value={studentProfile.name || ''} onChange={(e) => setStudentProfile({ ...studentProfile, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem', display: 'block' }}>Email (Read Only)</label>
                                            <input type="email" className="input-field" disabled style={{ padding: '0.4rem', fontSize: '0.85rem', marginBottom: 0, opacity: 0.7 }} value={studentProfile.email || ''} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem', display: 'block' }}>College</label>
                                            <input type="text" className="input-field" style={{ padding: '0.4rem', fontSize: '0.85rem', marginBottom: 0 }} value={studentProfile.college || ''} onChange={(e) => setStudentProfile({ ...studentProfile, college: e.target.value })} placeholder="Your College Name" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem', display: 'block' }}>Department</label>
                                                <input type="text" className="input-field" style={{ padding: '0.4rem', fontSize: '0.85rem', marginBottom: 0 }} value={studentProfile.department || ''} onChange={(e) => setStudentProfile({ ...studentProfile, department: e.target.value })} placeholder="Dept" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem', display: 'block' }}>Year</label>
                                                <input type="text" className="input-field" style={{ padding: '0.4rem', fontSize: '0.85rem', marginBottom: 0 }} value={studentProfile.year || ''} onChange={(e) => setStudentProfile({ ...studentProfile, year: e.target.value })} placeholder="I/II/III/IV" />
                                            </div>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.5rem', fontStyle: 'italic' }}>* Edits made here will be permanently saved to your profile when you submit.</p>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setSelectedEventForModal(null)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Application</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Category → College Listing Modal ── */}
            {categoryBrowseModal && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '600px', padding: '2rem', position: 'relative', maxHeight: '80vh', overflowY: 'auto' }}>
                        <button onClick={() => { setCategoryBrowseModal(null); setCollegeList([]); }} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>

                        {(() => {
                            const cat = CATEGORY_ICONS[categoryBrowseModal];
                            const IconComp = cat?.icon;
                            return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div className="category-icon-circle" style={{ background: `${cat?.color}15`, borderColor: cat?.color, width: '48px', height: '48px' }}>
                                        {IconComp && <IconComp size={24} style={{ color: cat.color }} />}
                                    </div>
                                    <div>
                                        <h2 className="outfit-font" style={{ fontSize: '1.5rem' }}>{cat?.label} Events</h2>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Colleges conducting {cat?.label?.toLowerCase()} events</p>
                                    </div>
                                </div>
                            );
                        })()}

                        {collegeListLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading colleges...</div>
                        ) : collegeList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No colleges are currently conducting {CATEGORY_ICONS[categoryBrowseModal]?.label?.toLowerCase()} events.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {collegeList.map((college, idx) => (
                                    <div key={idx} className="glass-card" style={{ padding: '1.25rem', cursor: 'default' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Building2 size={18} style={{ color: 'var(--accent-primary)' }} />
                                                <h3 className="outfit-font" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{college.collegeName}</h3>
                                            </div>
                                            <span style={{ background: `${CATEGORY_ICONS[categoryBrowseModal]?.color}15`, color: CATEGORY_ICONS[categoryBrowseModal]?.color, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                {college.eventCount} event{college.eventCount !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {college.events.map(ev => (
                                                <div key={ev._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 600 }}>{ev.title}</span>
                                                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <Calendar size={12} /> {new Date(ev.startDate).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    {/* Show bus routes here when browsing by college */}
                                                    {(ev.collegeBusRoutes || ev.localBusRoutes) && (
                                                        <div style={{ marginTop: '0.25rem', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>
                                                                <Bus size={12} /> Transport Info
                                                            </div>
                                                            {ev.collegeBusRoutes && <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line', marginBottom: '0.25rem' }}><strong>College Bus:</strong> {ev.collegeBusRoutes}</p>}
                                                            {ev.localBusRoutes && <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}><strong>Local Bus:</strong> {ev.localBusRoutes}</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Edit Profile Modal ── */}
            {showEditModal && editProfile && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '550px', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setShowEditModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>
                        <h2 className="outfit-font" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Edit3 size={20} /> Edit My Details
                        </h2>
                        <form onSubmit={handleEditProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Name</label>
                                    <input type="text" className="input-field" style={{ marginBottom: 0 }} value={editProfile.name || ''} onChange={e => setEditProfile({ ...editProfile, name: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">College</label>
                                    <input type="text" className="input-field" style={{ marginBottom: 0 }} value={editProfile.college || ''} onChange={e => setEditProfile({ ...editProfile, college: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Department</label>
                                    <input type="text" className="input-field" style={{ marginBottom: 0 }} value={editProfile.department || ''} onChange={e => setEditProfile({ ...editProfile, department: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Year</label>
                                    <input type="text" className="input-field" style={{ marginBottom: 0 }} value={editProfile.year || ''} onChange={e => setEditProfile({ ...editProfile, year: e.target.value })} placeholder="I/II/III/IV" />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Mobile</label>
                                    <input type="text" className="input-field" style={{ marginBottom: 0 }} value={editProfile.mobile || ''} onChange={e => setEditProfile({ ...editProfile, mobile: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Age</label>
                                    <input type="number" className="input-field" style={{ marginBottom: 0 }} value={editProfile.age || ''} onChange={e => setEditProfile({ ...editProfile, age: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Gender</label>
                                    <select className="input-field" style={{ marginBottom: 0 }} value={editProfile.gender || ''} onChange={e => setEditProfile({ ...editProfile, gender: e.target.value })}>
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Place / City</label>
                                    <input type="text" className="input-field" style={{ marginBottom: 0 }} value={editProfile.place || ''} onChange={e => setEditProfile({ ...editProfile, place: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">College Address</label>
                                <textarea className="input-field" rows="2" style={{ marginBottom: 0 }} value={editProfile.collegeAddress || ''} onChange={e => setEditProfile({ ...editProfile, collegeAddress: e.target.value })}></textarea>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                                <button type="submit" disabled={editLoading} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Feedback Modal ── */}
            {feedbackModal && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '450px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setFeedbackModal(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>
                        <h2 className="outfit-font" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageSquare size={20} /> Event Feedback
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{feedbackModal.title} — {feedbackModal.collegeName}</p>

                        <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Star Rating */}
                            <div>
                                <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Rating</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} type="button" onClick={() => setFeedbackRating(star)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', transition: 'transform 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                            <Star size={28} fill={star <= feedbackRating ? '#f59e0b' : 'none'} style={{ color: star <= feedbackRating ? '#f59e0b' : 'var(--text-tertiary)' }} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Comments (Optional)</label>
                                <textarea className="input-field" rows="3" style={{ marginBottom: 0 }} placeholder="Share your experience..." value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)}></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setFeedbackModal(null)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                                <button type="submit" disabled={feedbackLoading || feedbackRating === 0} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Send size={16} /> {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
