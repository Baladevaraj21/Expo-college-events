import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
    User, Mail, Phone, MapPin, Building2, 
    BookOpen, Calendar, ArrowLeft, FileText,
    Award, Shield, CheckCircle, Users
} from 'lucide-react';

export default function StudentProfileView() {
    const { id } = useParams();
    const { token, user, updateUser } = useAuth();
    const navigate = useNavigate();
    
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [activeTab, setActiveTab] = useState('info'); // info, followers, following
    const [loadingFollowLists, setLoadingFollowLists] = useState(false);

    const fetchLists = async (studentId) => {
        setLoadingFollowLists(true);
        try {
            const followersRes = await axios.get(`http://localhost:5000/api/common/profile/${studentId}/followers`, { headers: { Authorization: `Bearer ${token}` } });
            setFollowers(followersRes.data);
            const followingRes = await axios.get(`http://localhost:5000/api/common/profile/${studentId}/following`, { headers: { Authorization: `Bearer ${token}` } });
            setFollowing(followingRes.data);
        } catch (err) {
            console.error("Failed to fetch follow lists", err);
        } finally {
            setLoadingFollowLists(false);
        }
    };

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/student/profile/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStudent(res.data);
                if (res.data.followers?.includes(user?.id)) {
                    setIsFollowing(true);
                }
                fetchLists(id); // Fetch lists after student data is loaded
            } catch (err) {
                setError("Student profile not found or access denied.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (token && id) fetchStudent();
    }, [id, token, user?.id]);

    const handleFollow = async () => {
        setFollowLoading(true);
        try {
            const endpoint = user.role === 'student' 
                ? `http://localhost:5000/api/student/follow/${id}`
                : `http://localhost:5000/api/college/follow/${id}`;
            
            if (isFollowing) {
                const deleteEndpoint = user.role === 'student' 
                    ? `http://localhost:5000/api/student/unfollow/${id}`
                    : `http://localhost:5000/api/college/unfollow/${id}`;
                const res = await axios.delete(deleteEndpoint, { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.user) updateUser(res.data.user);
                setIsFollowing(false);
                setStudent(prev => ({ ...prev, followers: prev.followers.filter(fid => fid !== user.id) }));
                fetchLists(id); // Refresh lists
            } else {
                const res = await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.user) updateUser(res.data.user);
                setIsFollowing(true);
                setStudent(prev => ({ ...prev, followers: [...(prev.followers || []), user.id] }));
                fetchLists(id); // Refresh lists
            }
        } catch (err) {
            console.error("Follow error", err);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleToggleFollowUserList = async (targetUserId) => {
        if (user.role !== 'student') return; // Only students can follow/unfollow from this list
        
        const isCurrentlyFollowing = user.following?.includes(targetUserId);
        try {
            const endpoint = `http://localhost:5000/api/student/${isCurrentlyFollowing ? 'unfollow' : 'follow'}/${targetUserId}`;
            const res = await axios[isCurrentlyFollowing ? 'delete' : 'post'](endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.user) {
                updateUser(res.data.user);
                fetchLists(id); // Refresh the lists on the current profile
            }
        } catch (err) {
            console.error("Error toggling follow from list:", err);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%' }} />
        </div>
    );

    if (error || !student) return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <p style={{ color: '#ef4444', fontWeight: 600 }}>{error || "Student not found"}</p>
            <button onClick={() => navigate(-1)} className="btn btn-primary" style={{ marginTop: '1rem' }}>Go Back</button>
        </div>
    );

    const BASE = "http://localhost:5000";
    const isCollege = user?.role === 'college';
    const canSeeSensitive = isCollege || user?.id === id;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={20} /> Back
                </button>
                {user?.id !== id && (
                    <button 
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={isFollowing ? "btn btn-outline" : "btn btn-primary"}
                        style={{ padding: '0.5rem 1.5rem', borderRadius: '9999px' }}
                    >
                        {followLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                )}
            </div>

            <div className="glass-card" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                {/* Decoration */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--accent-primary), #8b5cf6)' }} />

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    {/* Hero Section: Photo & Name */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '150px', height: '150px', borderRadius: '1.5rem', overflow: 'hidden', border: '4px solid var(--bg-secondary)', marginBottom: '1rem', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                            {student.profilePic ? (
                                <img src={`${BASE}/${student.profilePic}`} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={64} style={{ color: 'var(--text-tertiary)' }} />
                                </div>
                            )}
                        </div>
                        <h1 className="outfit-font" style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem' }}>{student.name}</h1>
                        <span style={{ fontSize: '0.85rem', color: 'white', background: 'var(--accent-primary)', padding: '0.2rem 0.8rem', borderRadius: '9999px', fontWeight: 600 }}>🎓 Student</span>
                    </div>

                    {/* Quick Info Grid */}
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignContent: 'center' }}>
                         <InfoItem icon={<Building2 size={18} />} label="College" value={student.college || "N/A"} />
                         <InfoItem icon={<BookOpen size={18} />} label="Department" value={student.department || "N/A"} />
                         <InfoItem icon={<Calendar size={18} />} label="Year of Study" value={student.year || "N/A"} />
                         <InfoItem icon={<MapPin size={18} />} label="Location" value={student.place || "N/A"} />
                    </div>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', marginBottom: '2rem' }}>
                    {[
                        { id: 'info', icon: <User size={16} />, label: 'Profile Info' },
                        { id: 'followers', icon: <Users size={16} />, label: `Followers (${followers.length})` },
                        { id: 'following', icon: <Users size={16} />, label: `Following (${following.length})` },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1, padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                                borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                marginBottom: '-2px', color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                transition: 'all 0.2s', fontSize: '0.875rem'
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'info' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                            {/* Left Column: Academic & Personal */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div>
                                    <h3 className="outfit-font" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BookOpen size={20} style={{ color: 'var(--accent-primary)' }} /> Academic Details
                                    </h3>
                                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <InfoItem icon={<Calendar size={18} />} label="Year of Study" value={student.year || 'N/A'} />
                                        <InfoItem icon={<Award size={18} />} label="Department" value={student.department || 'N/A'} />
                                        <InfoItem icon={<Building2 size={18} />} label="College" value={student.college || 'N/A'} />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="outfit-font" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Mail size={20} style={{ color: 'var(--accent-primary)' }} /> Contact Information
                                    </h3>
                                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <InfoItem icon={<Mail size={18} />} label="Email Address" value={student.email} />
                                        <InfoItem icon={<Phone size={18} />} label="Mobile Number" value={student.mobile || 'Not Provided'} />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: ID/Documents */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div>
                                    <h3 className="outfit-font" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={20} style={{ color: '#10b981' }} /> Verification Documents
                                    </h3>
                                    {canSeeSensitive ? (
                                        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <IDCard label="College ID Front" src={student.idCardFront ? `${BASE}/${student.idCardFront}` : null} />
                                            <IDCard label="College ID Back" src={student.idCardBack ? `${BASE}/${student.idCardBack}` : null} />
                                        </div>
                                    ) : (
                                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                            Verified documents are only visible to college administrations.
                                        </div>
                                    )}
                                </div>

                                {/* Stats/Metainfo */}
                                <div>
                                    <h3 className="outfit-font" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Award size={20} style={{ color: '#f59e0b' }} /> Network
                                    </h3>
                                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                                        <div style={{ cursor: 'pointer' }} onClick={() => setActiveTab('followers')}>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{followers.length}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0, textTransform: 'uppercase' }}>Followers</p>
                                        </div>
                                        <div style={{ width: '1px', background: 'var(--border-color)' }} />
                                        <div style={{ cursor: 'pointer' }} onClick={() => setActiveTab('following')}>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{following.length}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0, textTransform: 'uppercase' }}>Following</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Certificates */}
                        <div style={{ marginTop: '2.5rem' }}>
                            <h3 className="outfit-font" style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={20} style={{ color: 'var(--accent-primary)' }} /> Participation Certificates
                            </h3>
                            {student.certificates && student.certificates.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.0rem' }}>
                                    {student.certificates.map((cert, i) => (
                                        <a key={i} href={`${BASE}/${cert}`} target="_blank" rel="noreferrer" className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Certificate {i+1}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>PDF Document</p>
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>View Document</span>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', fontStyle: 'italic' }}>No certificates uploaded.</p>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'followers' && (
                    <div className="animate-fade-in">
                        <UsersList 
                            users={followers} 
                            title="Followers" 
                            emptyMessage="No followers yet."
                            onToggleFollow={handleToggleFollowUserList}
                            loading={loadingFollowLists}
                        />
                    </div>
                )}

                {activeTab === 'following' && (
                    <div className="animate-fade-in">
                        <UsersList 
                            users={following} 
                            title="Following" 
                            emptyMessage="Not following anyone yet."
                            onToggleFollow={handleToggleFollowUserList}
                            loading={loadingFollowLists}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoItem({ icon, label, value }) {
    return (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--accent-primary)', marginTop: '0.2rem' }}>{icon}</div>
            <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                <p style={{ fontWeight: 600, margin: 0, fontSize: '0.95rem', wordBreak: 'break-all' }}>{value}</p>
            </div>
        </div>
    );
}

function IDCard({ label, src }) {
    return (
        <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>{label}</p>
            <div style={{ aspectRatio: '1.6 / 1', background: 'var(--bg-tertiary)', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                {src ? (
                    <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Not Provided</div>
                )}
            </div>
        </div>
    );
}

function UsersList({ users, title, emptyMessage, onToggleFollow, loading }) {
    const { user: me } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 className="outfit-font" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>{title}</h3>
            {users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
                    <Users size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                    <p>{emptyMessage}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {users.map(u => (
                        <div key={u._id} className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div 
                                onClick={() => navigate(`/${u.role || 'student'}/${u._id}`)}
                                style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-tertiary)', overflow: 'hidden', cursor: 'pointer', border: '2px solid var(--border-color)' }}
                            >
                                {u.profilePic ? (
                                    <img src={`http://localhost:5000/${u.profilePic}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {u.role === 'college' ? <Building2 size={24} /> : <User size={24} />}
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p 
                                    onClick={() => navigate(`/${u.role || 'student'}/${u._id}`)}
                                    style={{ fontWeight: 600, margin: 0, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}
                                >
                                    {u.name}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0, textTransform: 'capitalize' }}>
                                    {u.role || 'student'} {u.department ? `• ${u.department}` : ''}
                                </p>
                            </div>
                            {me.id !== u._id && me.role === 'student' && (
                                <button 
                                    disabled={loading}
                                    onClick={() => onToggleFollow(u._id)}
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '9999px' }}
                                    className={me.following?.includes(u._id) ? "btn btn-outline" : "btn btn-primary"}
                                >
                                    {me.following?.includes(u._id) ? 'Unfollow' : 'Follow'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
