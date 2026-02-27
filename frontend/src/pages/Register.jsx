import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, Mail, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', formData);
            login(res.data.token, res.data.user);
            if (res.data.user.role === 'college') {
                navigate('/college-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div className="animate-float" style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', background: 'rgba(99, 102, 241, 0.2)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }}></div>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '3rem', zIndex: 10 }}>
                <h2 className="outfit-font" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>Join CampusConnect</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Create an account to discover and manage events.</p>

                {error && <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid var(--error)' }}>{error}</div>}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button type="button" onClick={() => setFormData({ ...formData, role: 'student' })} style={{ padding: '1rem', borderRadius: '0.5rem', border: formData.role === 'student' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', background: formData.role === 'student' ? 'rgba(79, 70, 229, 0.05)' : 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 600, transition: 'all 0.2s' }}>
                            👩‍🎓 Student
                        </button>
                        <button type="button" onClick={() => setFormData({ ...formData, role: 'college' })} style={{ padding: '1rem', borderRadius: '0.5rem', border: formData.role === 'college' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', background: formData.role === 'college' ? 'rgba(79, 70, 229, 0.05)' : 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 600, transition: 'all 0.2s' }}>
                            🏛️ College Admin
                        </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} placeholder={formData.role === 'student' ? "Your Full Name" : "College/Organization Name"} />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} placeholder="Email Address" />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} placeholder="Password (min 6 chars)" minLength="6" />
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                        {loading ? 'Registering...' : 'Create Account'} <ArrowRight size={20} />
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
}
