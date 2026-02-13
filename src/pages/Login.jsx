import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../services/api';

const Login = () => {
    console.log("Login component rendering...");
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await loginUser({ email, password });

            // Save user data (including token)
            localStorage.setItem('user', JSON.stringify(response));

            navigate('/dashboard');
            window.location.reload(); // Force refresh to update Navbar
        } catch (error) {
            alert(error.response?.data?.message || "Login failed. Please check your credentials.");
        }
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

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
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Your health companion</p>
            </div>

            {/* Login Card */}
            <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', background: 'white', border: 'none', boxShadow: 'var(--shadow-custom, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1))' }}>
                <div className="text-center mb-4">
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome back</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Enter your credentials to access your health dashboard
                    </p>
                </div>

                <form onSubmit={handleLogin} style={{ marginTop: '2rem' }}>
                    <div className="mb-4">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Email or Username</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="input-field"
                                style={{ paddingLeft: '48px', background: '#f8fafc', borderColor: '#e2e8f0' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>Password</label>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="input-field"
                                style={{ paddingLeft: '48px', paddingRight: '40px', background: '#f8fafc', borderColor: '#e2e8f0' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                        <a href="#" style={{ fontSize: '0.9rem', color: 'var(--primary-color)', fontWeight: 500 }}>Forgot Password?</a>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
                        Sign In
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                    <span style={{ padding: '0 1rem', fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>New to QuickDiagnosis?</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                </div>

                <Link to="/register" className="btn" style={{ width: '100%', padding: '0.875rem', background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)', justifyContent: 'center' }}>
                    Create an Account
                </Link>
            </div>
        </div>
    );
};

export default Login;
