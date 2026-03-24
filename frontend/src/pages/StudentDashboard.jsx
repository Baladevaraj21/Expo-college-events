import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { X, Monitor, Palette, Trophy, Wrench, Calendar, MapPin, Clock, IndianRupee, Building2, ChevronRight, User, Bus, Edit3, Star, MessageSquare, Send, FileText, LayoutList, Users } from 'lucide-react';

const CATEGORY_ICONS = {
    Symposium: { icon: Users, color: '#8b5cf6', bg: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', label: 'Symposium' },
    Sports: { icon: Trophy, color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', label: 'Sports' },
    Events: { icon: Calendar, color: '#14b8a6', bg: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)', label: 'General Events' }
};

const SUBCATEGORY_ICONS = {
    Technical: { icon: Monitor, color: '#6366f1', label: 'Technical' },
    'Non-Technical': { icon: Palette, color: '#ec4899', label: 'Non-Technical' },
    Workshop: { icon: Wrench, color: '#10b981', label: 'Workshop' }
};

export default function StudentDashboard({ notifEvent = null, clearNotifEvent }) {
    const { token, user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Filter & Category
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSubCategory, setSelectedSubCategory] = useState('all');

    const [showOngoing, setShowOngoing] = useState(false);
    const [selectedEventForModal, setSelectedEventForModal] = useState(null);
    const [studentProfile, setStudentProfile] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [lastAppliedEventTitle, setLastAppliedEventTitle] = useState('');

    // Edit Profile Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editProfile, setEditProfile] = useState(null);
    const [editLoading, setEditLoading] = useState(false);

    // Apply Form State
    const [applyForm, setApplyForm] = useState({ name: '', email: '', phoneNumber: '', department: '', year: '', rollNo: '', regNo: '', collegeName: '', paymentScreenshot: null, selectedEvents: [] });

    useEffect(() => {
        if (selectedEventForModal && studentProfile) {
            setApplyForm({
                name: studentProfile.name || '',
                email: studentProfile.email || '',
                phoneNumber: studentProfile.mobile || '',
                department: studentProfile.department || '',
                year: studentProfile.year || '',
                rollNo: studentProfile.rollNo || '',
                regNo: studentProfile.regNo || '',
                collegeName: studentProfile.college || '',
                paymentScreenshot: null,
                selectedEvents: []
            });
        }
    }, [selectedEventForModal, studentProfile]);

    // College Search State
    const [searchCollegeQuery, setSearchCollegeQuery] = useState('');
    const [collegeResults, setCollegeResults] = useState([]);
    // Track which college IDs are currently followed
    const [followingIds, setFollowingIds] = useState(new Set());
    const [followLoading, setFollowLoading] = useState(new Set());

    const handleSearchColleges = async () => {
        if (!searchCollegeQuery) {
            setCollegeResults([]);
            return;
        }
        try {
            const res = await axios.get(`http://localhost:5000/api/student/search?query=${searchCollegeQuery}`, { headers: { Authorization: `Bearer ${token}` } });
            setCollegeResults(res.data);
        } catch(err) { console.error(err) }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleSearchColleges();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

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
                const res = await axios.delete(`http://localhost:5000/api/student/unfollow/${collegeId}`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.user) updateUser(res.data.user);
            } else {
                const res = await axios.post(`http://localhost:5000/api/student/follow/${collegeId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.user) updateUser(res.data.user);
            }
        } catch(err) {
            console.error(err);
        } finally {
            setFollowLoading(prev => { const next = new Set(prev); next.delete(collegeId); return next; });
        }
    };

    // Also keep old name for full-screen profile button compatibility
    const handleFollowCollege = handleFollowToggle;

    // Full Screen College Profile State (REMOVED - Use /college/:id)

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

        // Fetch currently followed colleges to populate followingIds
        try {
            const followRes = await axios.get('http://localhost:5000/api/student/following', { headers: { Authorization: `Bearer ${token}` } });
            const ids = new Set(followRes.data.map(c => c._id));
            setFollowingIds(ids);
        } catch (err) {
            console.error("Failed to fetch following list", err);
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
            const formData = new FormData();
            formData.append('eventId', selectedEventForModal._id);
            formData.append('name', applyForm.name);
            formData.append('email', applyForm.email);
            formData.append('phoneNumber', applyForm.phoneNumber);
            formData.append('year', applyForm.year);
            formData.append('department', applyForm.department);
            formData.append('collegeName', applyForm.collegeName);
            formData.append('rollNo', applyForm.rollNo);
            formData.append('regNo', applyForm.regNo);
            if (applyForm.paymentScreenshot) {
                formData.append('paymentScreenshot', applyForm.paymentScreenshot);
            }
            formData.append('selectedEvents', JSON.stringify(applyForm.selectedEvents));

            await axios.post('http://localhost:5000/api/student/applications', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setLastAppliedEventTitle(selectedEventForModal.title);
            setSelectedEventForModal(null);
            setShowConfirmation(true);
            setApplyForm({ name: '', email: '', phoneNumber: '', department: '', year: '', rollNo: '', regNo: '', collegeName: '', paymentScreenshot: null, selectedEvents: [] });
            fetchData();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to apply.');
            setMessage(err.response?.data?.message || 'Failed to apply.');
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
            alert('Profile updated successfully!');
            setShowEditModal(false);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to update profile.');
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

    const hasAppliedToEvent = (eventId) => {
        return myApplications.some(app => app.event && app.event._id === eventId);
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Events...</div>;

    const filteredEvents = events.filter(event => {
        if (isEventFinished(event)) return false;
        if (hasAppliedToEvent(event._id)) return false;
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.collegeName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
        const matchesSubCategory = selectedCategory !== 'Symposium' || selectedSubCategory === 'all' || event.subCategory === selectedSubCategory;
        return matchesSearch && matchesCategory && matchesSubCategory;
    });

    // REDUNDANT - Handled by CollegeProfile.jsx route

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="outfit-font" style={{ fontSize: '2.5rem', color: 'var(--accent-primary)' }}>Student Dashboard</h1>
                <button onClick={openEditModal} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Edit3 size={18} /> Edit My Details
                </button>
            </div>

            {/* College search results driven by the Header's search bar */}
            {collegeResults.length > 0 && searchQuery && (
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 className="outfit-font" style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <Building2 size={18} /> Colleges matching &ldquo;{searchQuery}&rdquo;
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                        {collegeResults.map(c => {
                            const isFollowed = followingIds.has(c._id);
                            const isLoadingThis = followLoading.has(c._id);
                            return (
                                <div key={c._id} className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/college/${c._id}`)}>
                                        {c.profilePic ? (
                                            <img src={`http://localhost:5000/${c.profilePic}`} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: isFollowed ? '2px solid #10b981' : '2px solid transparent' }} alt="College Logo" />
                                        ) : (
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isFollowed ? '2px solid #10b981' : '2px solid var(--border-color)' }}>
                                                <Building2 size={24} style={{ color: 'var(--text-tertiary)' }} />
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{c.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {isFollowed ? <span style={{ color: '#10b981', fontWeight: 600 }}>Followed</span> : 'Tap to view full profile'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleFollowToggle(c._id); }}
                                        disabled={isLoadingThis}
                                        style={{
                                            padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600,
                                            cursor: isLoadingThis ? 'wait' : 'pointer', transition: 'all 0.3s',
                                            border: isFollowed ? 'none' : '1.5px solid var(--accent-primary)',
                                            background: isFollowed ? 'linear-gradient(135deg, #10b981, #34d399)' : 'transparent',
                                            color: isFollowed ? 'white' : 'var(--accent-primary)',
                                            minWidth: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                                        }}
                                    >
                                        {isLoadingThis ? '...' : isFollowed ? 'Unfollow' : 'Follow'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Stats Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="outfit-font" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Total Active Events</h3>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-primary)' }}>
                            <LayoutList size={24} />
                        </div>
                    </div>
                    <p style={{ fontSize: '3rem', fontWeight: 700, marginTop: '0.5rem' }}>{events.filter(e => !isEventFinished(e) && !hasAppliedToEvent(e._id)).length}</p>
                </div>
                <div
                    className="glass-card animate-fade-in animate-delay-1"
                    onClick={() => {
                        setShowOngoing(!showOngoing);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                        padding: '2rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = ''; }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="outfit-font" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Ongoing Applications</h3>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--info)' }}>
                            <FileText size={24} />
                        </div>
                    </div>
                    <p style={{ fontSize: '3rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--info)' }}>{myApplications.filter(app => !isEventFinished(app.event)).length}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                        Click to view application status
                    </p>
                </div>
            </div>

            {/* ── Event Category Icons Browser ── */}
            {!showOngoing && (
                <div className="animate-fade-in animate-delay-2" style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 className="outfit-font" style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>Browse Categories</h2>
                        {selectedCategory !== 'all' && (
                            <button onClick={() => { setSelectedCategory('all'); setSelectedSubCategory('all'); }} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Clear Filter</button>
                        )}
                    </div>
                    <div className="category-icon-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        {Object.entries(CATEGORY_ICONS).map(([key, { icon: IconComp, color, label }]) => {
                            const count = events.filter(e => e.category === key && !isEventFinished(e) && !hasAppliedToEvent(e._id)).length;
                            const isSelected = selectedCategory === key;
                            return (
                                <button
                                    key={key}
                                    className={`category-icon-card glass-card ${isSelected ? 'selected-category' : ''}`}
                                    onClick={() => setSelectedCategory(isSelected ? 'all' : key)}
                                    style={{
                                        textAlign: 'center', padding: '1.5rem', cursor: 'pointer', border: isSelected ? `2px solid ${color}` : 'none',
                                        width: '100%', boxSizing: 'border-box', transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                                    }}
                                >
                                    <div className="category-icon-circle" style={{ background: `${color}15`, borderColor: color, margin: '0 auto' }}>
                                        <IconComp size={28} style={{ color }} />
                                    </div>
                                    <p style={{ fontWeight: 600, marginTop: '0.75rem', fontSize: '1.1rem', color: '#fff' }}>{label}</p>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>{count} event{count !== 1 ? 's' : ''}</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Subcategories for Symposium */}
                    {selectedCategory === 'Symposium' && (
                        <div className="animate-fade-in" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>Filter Symposium Events</h3>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    className={`btn ${selectedSubCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => setSelectedSubCategory('all')}
                                    style={{ padding: '0.5rem 1.5rem', borderRadius: '9999px' }}
                                >
                                    All Symposiums
                                </button>
                                {Object.entries(SUBCATEGORY_ICONS).map(([key, { icon: IconComp, label }]) => (
                                    <button
                                        key={key}
                                        className={`btn ${selectedSubCategory === key ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setSelectedSubCategory(key)}
                                        style={{ padding: '0.5rem 1.5rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <IconComp size={16} /> {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {message && <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', marginBottom: '2rem', borderRadius: '0.5rem' }}>{message}</div>}

            {/* ── Event Updates (Read-Only) ── */}
            {!showOngoing && (
                <>
                    <div className="animate-fade-in animate-delay-3" style={{ marginBottom: '1.5rem' }}>
                        <h2 className="outfit-font" style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>📢 Event Updates</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Browse events from colleges across the network</p>
                    </div>

                    <div className="animate-fade-in animate-delay-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                        {filteredEvents.map(event => {
                            const cat = CATEGORY_ICONS[event.category];
                            const IconComp = cat?.icon;
                            return (
                                <div key={event._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <div 
                                        onClick={() => setSelectedEventForModal(event)}
                                        style={{ 
                                            height: '180px', 
                                            background: event.posterUrl ? `url(http://localhost:5000/${event.posterUrl}) center/cover no-repeat` : (cat?.bg || CATEGORY_ICONS['Events'].bg), 
                                            display: 'flex', 
                                            alignItems: 'flex-end', 
                                            justifyContent: 'space-between', 
                                            padding: '1rem',
                                            cursor: 'pointer',
                                            transition: 'transform 0.3s ease'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <span style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            {IconComp && <IconComp size={14} />}
                                            {event.category.toUpperCase()} {event.subCategory ? `- ${event.subCategory.toUpperCase()}` : ''}
                                        </span>
                                    </div>
                                    <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 className="outfit-font" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{event.title}</h3>
                                        <p 
                                            onClick={() => navigate(`/college/${event.organizer?._id || event.organizer}`)}
                                            style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            <Building2 size={14} /> {event.collegeName || event.organizer?.name || 'Unknown College'}
                                        </p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.description}</p>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} /> {new Date(event.startDate).toLocaleDateString()}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><IndianRupee size={14} /> ₹{event.entryFee}</span>
                                            {event.mapLink ? (
                                                <div style={{ width: '100%', marginTop: '0.5rem' }}>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Location URL:</p>
                                                    <a href={event.mapLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--info)', wordBreak: 'break-all', textDecoration: 'underline' }}>
                                                        {event.mapLink}
                                                    </a>
                                                </div>
                                            ) : (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14} /> {event.address}</span>
                                            )}
                                        </div>

                                        {/* Bus Routes */}
                                        {(event.collegeBusRoutes || event.localBusRoutes) && (
                                            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.35rem' }}>
                                                    <Bus size={14} /> Local Bus Routes
                                                </div>
                                                {event.collegeBusRoutes && <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line', marginBottom: '0.25rem' }}><strong>College Bus:</strong> {event.collegeBusRoutes}</p>}
                                                {event.localBusRoutes && <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}><strong>Local Bus Stops:</strong> {event.localBusRoutes}</p>}
                                            </div>
                                        )}

                                        <button onClick={() => setSelectedEventForModal(event)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                            Registration
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredEvents.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No events found matching your search.</p>}
                    </div>
                </>
            )}

            {/* ── My Applied Events + Feedback ── */}
            {(showOngoing || (myApplications.filter(app => !isEventFinished(app.event)).length > 0 && !showOngoing)) && (
                <div id="applied-events-section" className="animate-fade-in" style={{ marginTop: showOngoing ? '1rem' : '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 className="outfit-font" style={{ fontSize: '1.75rem', color: 'var(--text-primary)', margin: 0 }}>📋 Ongoing Applications</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {myApplications.filter(app => !isEventFinished(app.event)).map(app => {
                            const event = app.event;
                            if (!event) return null;
                            const cat = CATEGORY_ICONS[event.category];
                            const finished = isEventFinished(event);
                            return (
                                <div key={app._id} className="glass-card" style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        {cat && (() => { const IC = cat.icon; return <IC size={16} style={{ color: cat.color }} />; })()}
                                        <span style={{ background: `${cat?.color || 'var(--accent-primary)'}15`, color: cat?.color || 'var(--accent-primary)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{event.category} {event.subCategory ? `- ${event.subCategory.toUpperCase()}` : ''}</span>
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
                    <div className="google-form-modal modal-content" style={{ position: 'relative' }}>
                        <button onClick={() => setSelectedEventForModal(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: '#5f6368', zIndex: 10 }}>
                            <X size={24} />
                        </button>

                        <div className="google-form-card" style={{ padding: 0 }}>
                            <div className="google-form-header-stripe"></div>
                            <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
                                <h1 className="google-form-title">{selectedEventForModal.title}</h1>
                                <p style={{ color: '#202124', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    {selectedEventForModal.collegeName || selectedEventForModal.organizer?.name}
                                </p>
                                <div style={{ fontSize: '0.75rem', color: '#5f6368', borderTop: '1px solid #dadce0', paddingTop: '1rem', marginTop: '1rem' }}>
                                    * Indicates required question
                                </div>
                            </div>
                        </div>
                                  <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

                            {/* --- Structure: Basic Event Info (Required for all) --- */}
                            <div className="google-form-card" style={{ borderLeft: '6px solid #673ab7' }}>
                                <h3 className="google-form-section-title" style={{ borderBottom: 'none', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileText size={18} color="#673ab7" /> Event Overview
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} color="#5f6368" /> <strong>Date:</strong> {new Date(selectedEventForModal.startDate).toLocaleDateString()}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={14} color="#5f6368" /> <strong>Time:</strong> {selectedEventForModal.startTime} - {selectedEventForModal.endTime}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: '1 / -1' }}>
                                        <MapPin size={14} color="#5f6368" /> <strong>Location:</strong> {selectedEventForModal.address}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Phone size={14} color="#5f6368" /> <strong>Coordinator:</strong> {selectedEventForModal.contactNumber || 'N/A'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Mail size={14} color="#5f6368" /> <strong>Gmail:</strong> {selectedEventForModal.email || 'N/A'}
                                    </div>
                                </div>
                                
                                {selectedEventForModal.mapLink && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dadce0' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#5f6368', marginBottom: '0.5rem' }}>Google Maps Location:</p>
                                        <a 
                                            href={selectedEventForModal.mapLink}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ color: '#673ab7', fontSize: '0.85rem', wordBreak: 'break-all', textDecoration: 'underline' }}
                                        >
                                            {selectedEventForModal.mapLink}
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* --- Structure: Applicant Details (Required for all) --- */}
                            <div className="google-form-card">
                                <h3 className="google-form-section-title">Step 1: Student Information</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <label className="google-form-label">Full Name *</label>
                                        <input type="text" required className="google-form-input" placeholder="Enter your full name" value={applyForm.name} onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label className="google-form-label">Year *</label>
                                            <input type="text" required className="google-form-input" placeholder="e.g. 1st Year, III Year" value={applyForm.year} onChange={(e) => setApplyForm({ ...applyForm, year: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="google-form-label">Department *</label>
                                            <input type="text" required className="google-form-input" placeholder="e.g. CSE, EEE" value={applyForm.department} onChange={(e) => setApplyForm({ ...applyForm, department: e.target.value })} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label className="google-form-label">Roll Number *</label>
                                            <input type="text" required className="google-form-input" placeholder="Enter Roll No" value={applyForm.rollNo} onChange={(e) => setApplyForm({ ...applyForm, rollNo: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="google-form-label">Registration Number *</label>
                                            <input type="text" required className="google-form-input" placeholder="Enter Registration No" value={applyForm.regNo} onChange={(e) => setApplyForm({ ...applyForm, regNo: e.target.value })} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="google-form-label">College Name *</label>
                                        <input type="text" required className="google-form-input" placeholder="Enter your college name" value={applyForm.collegeName} onChange={(e) => setApplyForm({ ...applyForm, collegeName: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label className="google-form-label">Gmail ID *</label>
                                            <input type="email" required className="google-form-input" placeholder="Your answer" value={applyForm.email} onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="google-form-label">Contact Number *</label>
                                            <input type="text" required className="google-form-input" placeholder="Your answer" value={applyForm.phoneNumber} onChange={(e) => setApplyForm({ ...applyForm, phoneNumber: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* --- Event Selection (Universal Check) --- */}
                            {(selectedEventForModal.technicalEvents?.length > 0 || 
                              selectedEventForModal.nonTechnicalEvents?.length > 0 || 
                              selectedEventForModal.workshopEvents?.length > 0) && (
                                <div className="google-form-card">
                                    <h3 className="google-form-section-title" style={{ color: '#8b5cf6' }}>
                                        {selectedEventForModal.category === 'Symposium' ? 'Step 2: Event Selection (Choose at least 2)' : 'Step 2: Activity Selection'}
                                    </h3>
                                    
                                    {selectedEventForModal.technicalEvents?.length > 0 && (
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <p className="google-form-label" style={{ fontWeight: 600, color: '#6366f1' }}>
                                                {selectedEventForModal.category === 'Symposium' ? '💻 Technical Events' : 
                                                 selectedEventForModal.category === 'Sports' ? '🏆 Sports Categories' : '📝 Specific Activities'}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: '#5f6368', marginBottom: '0.5rem' }}>Select the technical competitions you wish to participate in.</p>
                                            <div className="google-form-checkbox-group">
                                                {selectedEventForModal.technicalEvents.map(ev => (
                                                    <label key={ev} className="google-form-check-item">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={applyForm.selectedEvents.includes(ev)} 
                                                            onChange={() => {
                                                                const isSelected = applyForm.selectedEvents.includes(ev);
                                                                const next = isSelected ? applyForm.selectedEvents.filter(x => x !== ev) : [...applyForm.selectedEvents, ev];
                                                                setApplyForm({ ...applyForm, selectedEvents: next });
                                                            }} 
                                                        />
                                                        <span style={{ fontSize: '0.875rem' }}>{ev}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedEventForModal.nonTechnicalEvents?.length > 0 && (
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <p className="google-form-label" style={{ fontWeight: 600, color: '#ec4899' }}>🎨 Non-Technical Events</p>
                                            <p style={{ fontSize: '0.75rem', color: '#5f6368', marginBottom: '0.5rem' }}>Select the non-technical activities you wish to join.</p>
                                            <div className="google-form-checkbox-group">
                                                {selectedEventForModal.nonTechnicalEvents.map(ev => (
                                                    <label key={ev} className="google-form-check-item">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={applyForm.selectedEvents.includes(ev)} 
                                                            onChange={() => {
                                                                const isSelected = applyForm.selectedEvents.includes(ev);
                                                                const next = isSelected ? applyForm.selectedEvents.filter(x => x !== ev) : [...applyForm.selectedEvents, ev];
                                                                setApplyForm({ ...applyForm, selectedEvents: next });
                                                            }} 
                                                        />
                                                        <span style={{ fontSize: '0.875rem' }}>{ev}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedEventForModal.workshopEvents?.length > 0 && (
                                        <div>
                                            <p className="google-form-label" style={{ fontWeight: 600, color: '#10b981' }}>🛠 Workshops</p>
                                            <p style={{ fontSize: '0.75rem', color: '#5f6368', marginBottom: '0.5rem' }}>Select any workshops you plan to attend.</p>
                                            <div className="google-form-checkbox-group">
                                                {selectedEventForModal.workshopEvents.map(ev => (
                                                    <label key={ev} className="google-form-check-item">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={applyForm.selectedEvents.includes(ev)} 
                                                            onChange={() => {
                                                                const isSelected = applyForm.selectedEvents.includes(ev);
                                                                const next = isSelected ? applyForm.selectedEvents.filter(x => x !== ev) : [...applyForm.selectedEvents, ev];
                                                                setApplyForm({ ...applyForm, selectedEvents: next });
                                                            }} 
                                                        />
                                                        <span style={{ fontSize: '0.875rem' }}>{ev}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- Structure 2: Sports --- */}
                            {selectedEventForModal.category === 'Sports' && (
                                <div className="google-form-card" style={{ borderLeft: '6px solid #f59e0b' }}>
                                    <h3 className="google-form-section-title" style={{ color: '#f59e0b' }}>Step 2: Sports Participation</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#fff9eb', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                                        <Trophy size={32} color="#f59e0b" />
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>Tournament Entry</p>
                                            <p style={{ fontSize: '0.75rem', color: '#92400e', margin: 0 }}>You are applying for a sports event. Please ensure you bring your specific sports kit/jersey as per college rules.</p>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <label className="google-form-label">Position / Event Specifics (Optional)</label>
                                        <input type="text" className="google-form-input" placeholder="e.g. Defender, 100m Sprint, Captain" />
                                    </div>
                                </div>
                            )}

                            {/* --- Structure 3: General Events --- */}
                            {selectedEventForModal.category === 'Events' && (
                                <div className="google-form-card" style={{ borderLeft: '6px solid #14b8a6' }}>
                                    <h3 className="google-form-section-title" style={{ color: '#14b8a6' }}>Step 2: Event Details</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#5f6368' }}>You are applying for a general college event. Please follow the instructions provided by the event coordinators on the day.</p>
                                </div>
                            )}

                            {/* --- Payment & Extra (Common) --- */}
                            <div className="google-form-card">
                                <h3 className="google-form-section-title">Final Step: Logistics & Payment</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    
                                    {selectedEventForModal.entryFee > 0 && (
                                        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #dadce0' }}>
                                            <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <IndianRupee size={16} /> Entry Fee: ₹{selectedEventForModal.entryFee}
                                            </p>
                                            <label className="google-form-label">Payment Screenshot *</label>
                                            <p style={{ fontSize: '0.7rem', color: '#5f6368', marginBottom: '1rem' }}>Please upload the transaction confirmation screenshot for verification.</p>
                                            <input type="file" required accept="image/*" className="google-form-input" style={{ border: 'none !important', paddingLeft: 0 }} onChange={(e) => setApplyForm({ ...applyForm, paymentScreenshot: e.target.files[0] })} />
                                        </div>
                                    )}
                                    
                                    {selectedEventForModal.entryFee <= 0 && (
                                        <div>
                                            <label className="google-form-label">Additional Payment Proof (If any)</label>
                                            <input type="file" accept="image/*" className="google-form-input" style={{ border: 'none !important' }} onChange={(e) => setApplyForm({ ...applyForm, paymentScreenshot: e.target.files[0] })} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.5rem 2rem 1.5rem' }}>
                                <button type="submit" className="google-form-submit" disabled={selectedEventForModal.category === 'Symposium' && applyForm.selectedEvents.length < 2}>
                                    Submit Registration
                                </button>
                                <button type="button" onClick={() => setSelectedEventForModal(null)} style={{ color: '#673ab7', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}



            {/* ── Edit Profile Modal ── */}
            {showEditModal && editProfile && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content" style={{ padding: '1.5rem', position: 'relative' }}>
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
                                    <label className="input-label">Roll Number</label>
                                    <input type="text" className="input-field" style={{ marginBottom: 0 }} value={editProfile.rollNo || ''} onChange={e => setEditProfile({ ...editProfile, rollNo: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Registration Number</label>
                                    <input type="text" className="input-field" style={{ marginBottom: 0 }} value={editProfile.regNo || ''} onChange={e => setEditProfile({ ...editProfile, regNo: e.target.value })} />
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
            {/* ── Registration Confirmation Modal ── */}
            {showConfirmation && (
                <div className="modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center', position: 'relative' }}>
                        <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <div style={{ width: '50px', height: '50px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                        </div>
                        <h2 className="outfit-font" style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Registration Sent!</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem' }}>
                            Your application for <strong>{lastAppliedEventTitle}</strong> has been submitted successfully. You'll receive a confirmation email shortly.
                        </p>
                        <button 
                            onClick={() => {
                                setShowConfirmation(false);
                                setShowOngoing(true);
                                setTimeout(() => {
                                    const el = document.getElementById('applied-events-section');
                                    if(el) el.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }} 
                            className="btn btn-primary" 
                            style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
                        >
                            View Application Status
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
