import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Key, Lock, Loader2, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import api from '../services/api';

const ResetPassword = () => {
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await api.post('/auth/reset-password', { token, newPassword });
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired token. Please request a new one.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', background: '#ecfdf5', borderRadius: '16px', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={40} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Password Reset Successful!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Your password has been securely updated. Redirecting you to login in a few seconds...
                    </p>
                    <div style={{ marginTop: '2rem' }}>
                        <Link to="/login" className="btn btn-primary w-full">
                            Go to Login Now
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', marginTop: '-4rem' }}>

            {/* Logo Section */}
            <div className="text-center" style={{ marginBottom: '2rem' }}>
                <div style={{
                    width: '64px', height: '64px', background: 'var(--primary-gradient)',
                    borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem', boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.4)'
                }}>
                    <Activity size={32} color="white" />
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0', color: 'var(--text-primary)' }}>QuickDiagnosis</h1>
            </div>

            <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Reset Your Password</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                    Securely update your credentials using the recovery token provided.
                </p>

                {error && (
                    <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#dc2626', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Recovery Token</label>
                        <div style={{ position: 'relative' }}>
                            <Key size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input
                                type="text"
                                placeholder="Paste your token here"
                                className="input-field"
                                style={{ paddingLeft: '48px' }}
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input
                                type="password"
                                placeholder="At least 6 characters"
                                className="input-field"
                                style={{ paddingLeft: '48px' }}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Confirm New Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input
                                type="password"
                                placeholder="Re-enter new password"
                                className="input-field"
                                style={{ paddingLeft: '48px' }}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" name="reset-password-btn" className="btn btn-primary w-full" disabled={isLoading} style={{ marginTop: '1rem' }}>
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} /> Updating...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </button>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <Link to="/forgot-password" style={{ color: 'var(--primary-color)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>
                            Didn't get a token? Request again
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
