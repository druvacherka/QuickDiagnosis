import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, ShieldCheck, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { verifyOtp, resendVerification } from '../services/api';

const VerifyEmail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const emailStr = location.state?.email || '';

    const [email, setEmail] = useState(emailStr);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    // Auto-focus on first input
    const inputRefs = useRef([]);

    useEffect(() => {
        if (!emailStr) {
            // If accessed directly without state, we still let them type their email
            // or we could redirect to login. We'll leave it empty to manually enter.
        }
    }, [emailStr]);

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next
        if (value !== '' && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData) {
            const newOtp = [...otp];
            for (let i = 0; i < pastedData.length; i++) {
                newOtp[i] = pastedData.charAt(i);
            }
            setOtp(newOtp);
            // Focus on next empty or last
            const nextIndex = pastedData.length < 6 ? pastedData.length : 5;
            inputRefs.current[nextIndex].focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!email) {
            setError('Please enter the email address you registered with.');
            return;
        }

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter the 6-digit verification code.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await verifyOtp(email, otpString);
            setSuccessMsg(res.message || 'Email verified successfully!');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            setError('Please enter your email to resend the code.');
            return;
        }
        setIsResending(true);
        setError('');
        setSuccessMsg('');
        
        try {
            const res = await resendVerification(email);
            setSuccessMsg(res.message || 'A new verification code has been sent limits.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend code.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem 2rem', position: 'relative' }}>
                <Link to="/login" style={{ position: 'absolute', top: '20px', left: '20px', color: 'var(--text-secondary)' }}>
                    <ArrowLeft size={20} />
                </Link>

                <div className="text-center" style={{ marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'var(--primary-gradient)',
                        borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem', boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.4)'
                    }}>
                        <ShieldCheck size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                        Check your email
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        We've sent a 6-digit verification code to<br />
                        <strong>{email || 'your email'}</strong>
                    </p>
                </div>

                <form onSubmit={handleVerify}>
                    {!emailStr && (
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Email Address</label>
                            <div className="input-with-icon">
                                <Mail className="input-icon" size={20} />
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '2rem' }}>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => inputRefs.current[index] = el}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    textAlign: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)',
                                    background: 'var(--bg-secondary)',
                                    border: '2px solid var(--border-color)',
                                    borderRadius: '12px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--primary-color)';
                                    e.target.style.background = '#ffffff';
                                }}
                                onBlur={(e) => {
                                    if (!e.target.value) {
                                        e.target.style.borderColor = 'var(--border-color)';
                                        e.target.style.background = 'var(--bg-secondary)';
                                    }
                                }}
                            />
                        ))}
                    </div>

                    {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center', background: '#fef2f2', padding: '10px', borderRadius: '8px' }}>{error}</div>}
                    {successMsg && <div style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center', background: '#ecfdf5', padding: '10px', borderRadius: '8px' }}>{successMsg}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={isLoading || otp.join('').length !== 6 || !email}
                        style={{ height: '3rem', fontSize: '1rem' }}
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Code'}
                    </button>
                    
                    <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Didn't receive the code?{' '}
                        <button 
                            type="button" 
                            onClick={handleResend}
                            disabled={isResending || !email}
                            style={{ 
                                background: 'none', border: 'none', 
                                color: 'var(--primary-color)', fontWeight: '600', 
                                cursor: isResending ? 'not-allowed' : 'pointer',
                                padding: 0
                            }}
                        >
                            {isResending ? 'Sending...' : 'Resend'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VerifyEmail;
