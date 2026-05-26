import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { colors } from '../styles/theme';
import { API_BASE } from '../config';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            const response = await axios.post(`${API_BASE}/login`, {
                email: email,
                password: password
            });

            if (response.status === 200) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/dashboard');
            }
        } catch (error) {
            if (error.response) {
                setMessage(error.response.data.error);
            } else {
                setMessage('Server error. Is the backend running?');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
            padding: '20px',
        }}>
            <div style={{ width: '100%', maxWidth: '380px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: colors.primary, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
                        Digital Budget Tracker
                    </h1>
                    <p style={{ margin: 0, color: colors.muted, fontSize: '14px' }}>
                        Manage your student finances
                    </p>
                </div>

                {/* Form Card */}
                <div className="card" style={{ padding: '32px' }}>
                    <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', color: colors.textPrimary }}>
                        Welcome back
                    </h2>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                                Email
                            </label>
                            <input
                                className="input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                                Password
                            </label>
                            <input
                                className="input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
                        >
                            {isSubmitting ? 'Signing in...' : 'Login'}
                        </button>
                    </form>

                    {message && (
                        <div className="alert alert-error" style={{ marginTop: '16px', marginBottom: 0 }}>
                            <span>{message}</span>
                        </div>
                    )}
                </div>

                {/* Footer link */}
                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: colors.textSecondary }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}>
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
