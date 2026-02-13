import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Heart, Stethoscope, MapPin, ChevronRight, CheckCircle } from 'lucide-react';

const Home = () => {
    const user = JSON.parse(localStorage.getItem('user'));

    return (
        <div>
            {/* Hero Section */}
            <section className="hero-section">
                <div style={{ display: 'inline-flex', padding: '12px', background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-md)', marginBottom: '2rem' }}>
                    <Activity size={32} color="var(--primary-color)" />
                </div>
                <h1 className="hero-title">
                    Your Health, <span>Simplified</span>
                </h1>
                <p className="hero-subtitle">
                    Enter your symptoms and receive AI-powered disease predictions with recommendations for nearby doctors and hospitals.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
                    <Link to="/symptoms" className="btn btn-primary" style={{ padding: '0.875rem 2.5rem', fontSize: '1.125rem' }}>
                        Start Symptom Analysis <ChevronRight size={20} />
                    </Link>
                    {!user && (
                        <Link to="/login" className="btn btn-secondary" style={{ padding: '0.875rem 2.5rem', fontSize: '1.125rem' }}>
                            Sign In
                        </Link>
                    )}
                    {user && (
                        <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.875rem 2.5rem', fontSize: '1.125rem' }}>
                            Go to Dashboard
                        </Link>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div className="trust-badge">
                        <ShieldCheck size={16} color="var(--success-color)" />
                        <span>Data processed locally</span>
                    </div>
                    <div className="trust-badge">
                        <Activity size={16} color="var(--primary-color)" />
                        <span>Dataset-driven predictions</span>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="container" style={{ padding: '4rem 20px' }}>
                <div className="text-center mb-4" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>How It Works</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Three steps to understand your symptoms</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    {/* Step 1 */}
                    <div className="step-card">
                        <div className="step-icon">
                            <Activity size={32} />
                        </div>
                        <div className="step-number">1. Enter Symptoms</div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Select your symptoms</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Select your symptoms from our medical database. Add severity and duration for each.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="step-card">
                        <div className="step-icon">
                            <CheckCircle size={32} />
                        </div>
                        <div className="step-number">2. Get Predictions</div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>AI Analysis</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Our model analyzes your symptoms against a medical dataset and returns matching conditions.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="step-card">
                        <div className="step-icon">
                            <Stethoscope size={32} />
                        </div>
                        <div className="step-number">3. Find Care</div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Locate Specialists</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Locate nearby doctors and hospitals based on your real-time location.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container">
                <div className="cta-section">
                    <h2 className="cta-title">Check Your Symptoms Now</h2>
                    <p className="cta-text">
                        Get symptom-based predictions powered by a medical dataset. Results are for informational purposes only.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/symptoms" className="btn" style={{ background: 'white', color: 'var(--primary-color)' }}>
                            Start Analysis
                        </Link>
                        {!user && (
                            <Link to="/register" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
                                Create Account
                            </Link>
                        )}
                        {user && (
                            <Link to="/dashboard" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
                                View Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            <div style={{ height: '4rem' }}></div>
        </div>
    );
};

export default Home;
