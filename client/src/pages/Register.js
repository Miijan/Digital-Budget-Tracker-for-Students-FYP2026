import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { colors } from '../styles/theme';
import { API_BASE } from '../config';

function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            await axios.post(`${API_BASE}/register`, {
                name: name,
                email: email,
                password: password
            });
            setIsSuccess(true);
            setMessage('Registration successful!');
            setName(''); setEmail(''); setPassword('');
        } catch (error) {
            setIsSuccess(false);
            if (error.response) {
                setMessage(error.response.data.error || 'Failed to register');
            } else {
                setMessage('Server error.');
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
                        Start managing your finances today
                    </p>
                </div>

                {/* Form Card */}
                <div className="card" style={{ padding: '32px' }}>
                    <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', color: colors.textPrimary }}>
                        Create Account
                    </h2>

                    {isSuccess ? (
                        <div>
                            <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                                <span>{message}</span>
                            </div>
                            <Link to="/">
                                <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px' }}>
                                    Go to Login
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                                    Full Name
                                </label>
                                <input
                                    className="input"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your full name"
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                                    Student Email
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
                                    placeholder="Create a password"
                                    required
                                    minLength={6}
                                />
                                <span style={{ fontSize: '12px', color: colors.muted, marginTop: '4px', display: 'block' }}>
                                    Must be at least 6 characters
                                </span>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-success"
                                disabled={isSubmitting}
                                style={{ width: '100%', padding: '12px', fontSize: '15px' }}
                            >
                                {isSubmitting ? 'Creating account...' : 'Register'}
                            </button>

                            {message && (
                                <div className="alert alert-error" style={{ marginTop: '16px', marginBottom: 0 }}>
                                    <span>{message}</span>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                {/* Footer link */}
                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: colors.textSecondary }}>
                    Already have an account?{' '}
                    <Link to="/" style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}>
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
