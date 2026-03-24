import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, Building2, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const { login } = useAuth();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, formData);
            // Handle auto-login
            if (res.data.token && res.data.user) {
                login(res.data.token, res.data.user);
                // Redirect based on role
                if (res.data.user.role === 'college') {
                    navigate('/college-dashboard');
                } else {
                    navigate('/student-dashboard');
                }
            } else {
                // Fallback to login if token not returned for some reason
                navigate('/login', { state: { message: 'Registration successful! Please login.' } });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
            <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 className="outfit-font" style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.5rem', background: 'linear-gradient(135deg, var(--accent-primary), #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Join Expo-College Events
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Create your account to get started</p>
                </div>

                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.75rem', color: '#ef4444', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: 'student' })}
                            style={{
                                padding: '1rem', borderRadius: '1rem', border: '2px solid',
                                borderColor: formData.role === 'student' ? 'var(--accent-primary)' : 'var(--border-color)',
                                background: formData.role === 'student' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                color: formData.role === 'student' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <User size={24} />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Student</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: 'college' })}
                            style={{
                                padding: '1rem', borderRadius: '1rem', border: '2px solid',
                                borderColor: formData.role === 'college' ? '#14b8a6' : 'var(--border-color)',
                                background: formData.role === 'college' ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                                color: formData.role === 'college' ? '#14b8a6' : 'var(--text-secondary)',
                                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <Building2 size={24} />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>College Admin</span>
                        </button>
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} /> Full Name / College Name
                        </label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            placeholder={formData.role === 'student' ? "Enter your full name" : "Enter college name"}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={16} /> Email Address
                        </label>
                        <input
                            type="email"
                            required
                            className="input-field"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Lock size={16} /> Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="input-field"
                                placeholder="••••••••"
                                minLength="6"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', outline: 'none', display: 'flex' }}
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '1rem', justifyContent: 'center', fontSize: '1rem', marginTop: '1rem' }}
                    >
                        {loading ? 'Creating Account...' : (
                            <>Create Account <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} /></>
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
                </div>
            </div>
        </div>
    );
}
