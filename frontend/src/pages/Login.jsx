import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            login(res.data.token, res.data.user);
            if (res.data.user.role === 'college') {
                navigate('/college-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Background Elements */}
            <div className="animate-float animate-delay-1" style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'var(--accent-glow)', filter: 'blur(80px)', borderRadius: '50%', zIndex: 0 }}></div>
            <div className="animate-float animate-delay-2" style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', background: 'rgba(16, 185, 129, 0.2)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }}></div>

            <div className="glass-card animate-fade-in" style={{
                width: '100%',
                maxWidth: '1000px',
                display: 'flex',
                borderRadius: '1.5rem',
                overflow: 'hidden',
                zIndex: 10,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Left Side: Branding */}
                <div style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                    padding: '4rem',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative'
                }} className="hidden md-flex">
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <ShieldCheck size={48} style={{ marginBottom: '1.5rem', opacity: 0.9 }} />
                        <h1 className="outfit-font" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1 }}>
                            Welcome back to CampusConnect.
                        </h1>
                        <p style={{ fontSize: '1.1rem', opacity: 0.8, lineHeight: 1.6 }}>
                            The most advanced platform for managing and discovering college events, symposiums, and sports.
                        </p>
                    </div>
                    {/* Decorative geometric shapes */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', opacity: 0.5 }}></div>
                </div>

                {/* Right Side: Login Form */}
                <div style={{ flex: 1, padding: '4rem 3rem', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h2 className="outfit-font" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                            Sign In
                        </h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Enter your credentials to access your dashboard.</p>
                    </div>

                    {error && (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid var(--error)', fontSize: '0.875rem' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' }}
                                    placeholder="you@college.edu"
                                />
                            </div>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' }}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}
                        >
                            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={20} />
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Create one</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
