import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, Activity, ShieldCheck, Key, Lock, HelpCircle } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // Security Question States
    const [mode, setMode] = useState('token'); // 'token' or 'question'
    const [securityQuestion, setSecurityQuestion] = useState(null);
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isQuestionLoading, setIsQuestionLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setMessage(response.data.message);
            setIsSuccess(true);

            if (response.data.token) {
                console.log("DEMO MODE: Reset Token is:", response.data.token);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset token. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFetchQuestion = async () => {
        if (!email) {
            setError('Please enter your email first');
            return;
        }
        setIsQuestionLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/get-security-question', { email });
            setSecurityQuestion(response.data.question);
            setMode('question');
        } catch (err) {
            setError(err.response?.data?.message || 'Could not fetch security question. Make sure you have one set.');
        } finally {
            setIsQuestionLoading(false);
        }
    };

    const handleQuestionReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await api.post('/auth/reset-with-answer', {
                email,
                answer: securityAnswer,
                newPassword
            });
            setIsSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed. Please check your answer.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
                    <div style={{
                        width: '64px', height: '64px', background: '#ecfdf5', borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
                    }}>
                        <CheckCircle2 size={32} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                        {mode === 'question' ? 'Password Reset Successful!' : 'Check Your Email'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        {mode === 'question'
                            ? 'Your password has been securely updated via your security question.'
                            : `We've generated a recovery token for ${email}.`}
                    </p>

                    {mode === 'token' && (
                        <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #bae6fd', textAlign: 'left' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#0369a1', lineHeight: '1.5' }}>
                                <strong>Developer Step:</strong> Since we aren't using an email server yet, find your token in the <strong>Server Terminal</strong> or <strong>Browser Console</strong>.
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {mode === 'token' ? (
                            <Link to="/reset-password" name="proceed-to-reset" className="btn btn-primary w-full">
                                Enter Recovery Token
                            </Link>
                        ) : (
                            <Link to="/login" className="btn btn-primary w-full">
                                Back to Login
                            </Link>
                        )}
                        {mode === 'token' && (
                            <Link to="/login" className="btn btn-secondary w-full">
                                Back to Login
                            </Link>
                        )}
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
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {mode === 'token' ? 'Forgot Password?' : 'Security Reset'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                    {mode === 'token'
                        ? "Enter your email and we'll send you a recovery token."
                        : "Answer your security question to reset your password."}
                </p>

                {error && (
                    <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#dc2626', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        {error}
                    </div>
                )}

                {mode === 'token' ? (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    className="input-field"
                                    style={{ paddingLeft: '48px' }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" name="request-reset" className="btn btn-primary w-full" disabled={isLoading} style={{ marginTop: '1rem' }}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} /> Sending...
                                </>
                            ) : (
                                'Send Recovery Token'
                            )}
                        </button>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <button
                                type="button"
                                onClick={handleFetchQuestion}
                                disabled={isQuestionLoading}
                                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
                            >
                                {isQuestionLoading ? <Loader2 className="animate-spin" size={16} /> : <HelpCircle size={16} />}
                                Use Security Question Instead
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleQuestionReset}>
                        <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Question</p>
                            <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>{securityQuestion}</p>
                        </div>

                        <div className="mb-4">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Your Answer</label>
                            <div style={{ position: 'relative' }}>
                                <ShieldCheck size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    type="text"
                                    placeholder="Enter your secret answer"
                                    className="input-field"
                                    style={{ paddingLeft: '48px' }}
                                    value={securityAnswer}
                                    onChange={(e) => setSecurityAnswer(e.target.value)}
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
                                    placeholder="At least 8 characters"
                                    className="input-field"
                                    style={{ paddingLeft: '48px' }}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Confirm New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    className="input-field"
                                    style={{ paddingLeft: '48px' }}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => setMode('token')}
                                className="btn"
                                style={{ flex: 1, background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                            >
                                Back
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
