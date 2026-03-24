import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Activity } from 'lucide-react';
import api from '../services/api';

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const res = await api.get(`/auth/verify/${token}`);
                setMessage(res.data.message);
                setStatus('success');
            } catch (err) {
                setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
                setStatus('error');
            }
        };

        if (token) {
            verifyToken();
        }
    }, [token]);

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

            <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
                {status === 'loading' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Loader2 className="animate-spin" size={40} color="var(--primary-color)" />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Verifying your email...</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '64px', height: '64px', background: '#ecfdf5', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={32} color="#10b981" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Email Verified!</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
                        <Link to="/login" className="btn btn-primary w-full">Go to Login</Link>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '64px', height: '64px', background: '#fef2f2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <XCircle size={32} color="#ef4444" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Verification Failed</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
                        <Link to="/login" className="btn btn-secondary w-full">Back to Login</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
