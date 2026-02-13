import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, Check, Calendar, Activity } from 'lucide-react';
import { registerUser } from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = React.useState(1);
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        securityQuestion: 'What was your first pet\'s name?',
        securityAnswer: '',
        age: '',
        gender: 'select',
        history: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleNext = () => {
        if (step === 1 && (!formData.name || !formData.email)) {
            alert("Please fill in all fields");
            return;
        }
        if (step === 2) {
            if (!formData.password || formData.password !== formData.confirmPassword) {
                alert("Please check your passwords");
                return;
            }
            if (formData.password.length < 8) {
                alert("Password must be at least 8 characters");
                return;
            }
            if (!formData.securityAnswer) {
                alert("Please provide an answer to your security question");
                return;
            }
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                securityQuestion: formData.securityQuestion,
                securityAnswer: formData.securityAnswer
            };
            const response = await registerUser(userData);

            // Save user data (including token and registration-specific info like age/gender)
            const fullUserData = {
                ...response,
                age: formData.age,
                gender: formData.gender === 'select' ? '' : formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)
            };
            localStorage.setItem('user', JSON.stringify(fullUserData));

            alert("Registration successful!");
            navigate('/dashboard');
            window.location.reload();
        } catch (error) {
            console.error("Full Registration Error Details:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: error.config
            });
            alert(error.response?.data?.message || "Registration failed. Please try again.");
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <div className="mb-4">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    type="text" name="name"
                                    placeholder="Enter your full name"
                                    className="input-field"
                                    style={{ paddingLeft: '48px', background: '#f8fafc', borderColor: '#e2e8f0' }}
                                    value={formData.name} onChange={handleChange} required
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    type="email" name="email"
                                    placeholder="Enter your email"
                                    className="input-field"
                                    style={{ paddingLeft: '48px', background: '#f8fafc', borderColor: '#e2e8f0' }}
                                    value={formData.email} onChange={handleChange} required
                                />
                            </div>
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <div className="mb-4">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    type="password" name="password"
                                    placeholder="Create a password"
                                    className="input-field"
                                    style={{ paddingLeft: '48px', background: '#f8fafc', borderColor: '#e2e8f0' }}
                                    value={formData.password} onChange={handleChange} required
                                />
                            </div>
                            <small style={{ color: 'var(--text-light)', marginTop: '0.25rem', display: 'block' }}>Minimum 8 characters</small>
                        </div>
                        <div className="mb-4">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    type="password" name="confirmPassword"
                                    placeholder="Confirm your password"
                                    className="input-field"
                                    style={{ paddingLeft: '48px', background: '#f8fafc', borderColor: '#e2e8f0' }}
                                    value={formData.confirmPassword} onChange={handleChange} required
                                />
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '1.5rem 0' }} />

                        <div className="mb-4">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Security Question</label>
                            <select
                                name="securityQuestion"
                                className="input-field"
                                style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
                                value={formData.securityQuestion} onChange={handleChange}
                            >
                                <option value="What was your first pet's name?">What was your first pet's name?</option>
                                <option value="In what city were you born?">In what city were you born?</option>
                                <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                                <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                                <option value="What was the name of your first school?">What was the name of your first school?</option>
                            </select>
                            <small style={{ color: 'var(--text-light)', marginTop: '0.25rem', display: 'block' }}>Used for self-service password recovery</small>
                        </div>

                        <div className="mb-4">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Your Answer</label>
                            <div style={{ position: 'relative' }}>
                                <ShieldCheck size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    type="text" name="securityAnswer"
                                    placeholder="Answer to your question"
                                    className="input-field"
                                    style={{ paddingLeft: '48px', background: '#f8fafc', borderColor: '#e2e8f0' }}
                                    value={formData.securityAnswer} onChange={handleChange} required
                                />
                            </div>
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-4">
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Age</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                    <input
                                        type="number" name="age"
                                        placeholder="Your age"
                                        className="input-field"
                                        style={{ paddingLeft: '48px', background: '#f8fafc', borderColor: '#e2e8f0' }}
                                        value={formData.age} onChange={handleChange} required
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Gender</label>
                                <select
                                    name="gender"
                                    className="input-field"
                                    style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
                                    value={formData.gender} onChange={handleChange}
                                >
                                    <option value="select">Select</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="mb-4" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <input
                                type="checkbox" name="history" id="history"
                                checked={formData.history} onChange={handleChange}
                                style={{ marginTop: '0.25rem', width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
                            />
                            <label htmlFor="history" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                <strong>I have existing medical conditions</strong>
                                <br />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>You can add details later in your profile</span>
                            </label>
                        </div>
                    </>
                );
            default:
                return null;
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
            </div>

            <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem', background: 'white', border: 'none', boxShadow: 'var(--shadow-custom, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1))' }}>

                {/* Progress Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        {step > 1 && <ArrowLeft size={16} style={{ cursor: 'pointer' }} onClick={handleBack} />}
                        <span>Step {step} of 3</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${(step / 3) * 100}%`,
                            background: 'var(--primary-gradient)',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                </div>

                <div className="mb-4">
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        {step === 1 && "Create your account"}
                        {step === 2 && "Secure your account"}
                        {step === 3 && "Personal information"}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        {step === 1 && "Enter your basic information to get started"}
                        {step === 2 && "Choose a strong password to protect your health data"}
                        {step === 3 && "Help us personalize your experience"}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {renderStepContent()}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        {step > 1 && (
                            <button type="button" onClick={handleBack} className="btn" style={{ flex: 1, background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                                <ArrowLeft size={18} /> Back
                            </button>
                        )}

                        {step < 3 ? (
                            <button type="button" onClick={handleNext} className="btn btn-primary" style={{ flex: 1 }}>
                                Continue <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                <Check size={18} /> Create Account
                            </button>
                        )}
                    </div>
                </form>

            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', color: 'var(--secondary-color)', fontSize: '0.85rem' }}>
                <ShieldCheck size={16} />
                <span>Your health data is secure and confidential. We use industry-standard encryption.</span>
            </div>
        </div>
    );
};

export default Register;
