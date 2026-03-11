import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, Building2, Monitor, Palette, Trophy, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORY_ICONS = {
    technical: { icon: Monitor, color: '#6366f1', bg: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', label: 'Technical' },
    'non-technical': { icon: Palette, color: '#ec4899', bg: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', label: 'Non-Technical' },
    sports: { icon: Trophy, color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', label: 'Sports' },
    workshop: { icon: Wrench, color: '#10b981', bg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', label: 'Workshop' },
};

export default function EventHistory() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [historyItems, setHistoryItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const isEventFinished = (event) => {
        if (!event?.endDate) return false;
        return new Date() > new Date(event.endDate);
    };

    const fetchHistoryData = async () => {
        try {
            if (user?.role === 'college') {
                const res = await axios.get('http://localhost:5000/api/college/events', { headers: { Authorization: `Bearer ${token}` } });
                const finishedEvents = res.data.filter(e => isEventFinished(e));
                setHistoryItems(finishedEvents);
            } else if (user?.role === 'student') {
                const res = await axios.get('http://localhost:5000/api/student/my-applications', { headers: { Authorization: `Bearer ${token}` } });
                const finishedApps = res.data.filter(app => isEventFinished(app.event));
                setHistoryItems(finishedApps);
            }
        } catch (err) {
            console.error("Failed to fetch history data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchHistoryData();
    }, [token, user]);

    if (loading) return <div style={{ padding: '2rem' }}>Loading History...</div>;

    const renderCollegeEvent = (event) => {
        const cat = CATEGORY_ICONS[event.category];
        const IconComp = cat?.icon;
        return (
            <div key={event._id} className="glass-card" style={{ overflow: 'hidden', opacity: 0.85 }}>
                <div style={{ height: '8px', background: 'var(--text-tertiary)' }} />
                <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {IconComp && <IconComp size={18} style={{ color: cat.color }} />}
                            <span style={{ background: `${cat?.color || 'var(--accent-primary)'}15`, color: cat?.color || 'var(--accent-primary)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{event.category}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>Ended</span>
                    </div>
                    <h3 className="outfit-font" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', textDecoration: 'line-through' }}>{event.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} /> Ended: {new Date(event.endDate).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderStudentApplication = (app) => {
        const event = app.event;
        if (!event) return null;
        const cat = CATEGORY_ICONS[event.category];
        return (
            <div key={app._id} className="glass-card" style={{ padding: '1.5rem', opacity: 0.85 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {cat && (() => { const IC = cat.icon; return <IC size={16} style={{ color: cat.color }} />; })()}
                        <span style={{ background: `${cat?.color || 'var(--accent-primary)'}15`, color: cat?.color || 'var(--accent-primary)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{event.category}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
                        Ended
                    </span>
                </div>
                <h3 className="outfit-font" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem', textDecoration: 'line-through' }}>{event.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Building2 size={12} /> {event.collegeName}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Calendar size={12} /> Ended: {new Date(event.endDate).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '9999px', fontWeight: 600, background: app.status === 'confirmed' ? 'rgba(16,185,129,0.1)' : app.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: app.status === 'confirmed' ? 'var(--success)' : app.status === 'rejected' ? 'var(--error)' : 'var(--warning)', textTransform: 'capitalize' }}>
                        {app.status}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="outfit-font" style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>Event History</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        {user?.role === 'college' ? 'View past events hosted by your college.' : 'View your past applications and attended events.'}
                    </p>
                </div>
            </div>

            {historyItems.length === 0 ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No past/finished events found in your history.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {historyItems.map(item => user?.role === 'college' ? renderCollegeEvent(item) : renderStudentApplication(item))}
                </div>
            )}
        </div>
    );
}
