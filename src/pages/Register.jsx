import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, Check, Calendar, Activity, Loader2 } from 'lucide-react';
import { registerUser, sendOtp, verifyOtpInitial } from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    // OTP State
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef([]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        securityQuestion: 'What was your first pet\'s name?',
        securityAnswer: '',
        age: '',
        gender: '',
        history: false,
        verificationToken: ''
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value !== '' && index < 5) otpRefs.current[index + 1].focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            otpRefs.current[index - 1].focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData) {
            const newOtp = [...otp];
            for (let i = 0; i < pastedData.length; i++) newOtp[i] = pastedData.charAt(i);
            setOtp(newOtp);
            const nextIndex = pastedData.length < 6 ? pastedData.length : 5;
            otpRefs.current[nextIndex].focus();
        }
    };

    const handleNextStep1 = async () => {
        if (!formData.name || !formData.email) {
            alert("Please fill in your name and email");
            return;
        }
        setIsLoading(true);
        try {
            await sendOtp(formData.email, formData.name);
            setStep(2);
        } catch (error) {
            alert(error.response?.data?.message || "Failed to send verification code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextStep2 = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            alert("Please enter the 6-digit code");
            return;
        }
        setIsLoading(true);
        try {
            const res = await verifyOtpInitial(formData.email, otpString);
            setFormData(prev => ({ ...prev, verificationToken: res.verificationToken }));
            setStep(3);
        } catch (error) {
            alert(error.response?.data?.message || "Invalid or expired code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextStep3 = () => {
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
        setStep(4);
    };

    const handleBack = () => {
        // Prevent going back from Step 3 -> 2 since OTP is already verified and consumed
        if (step === 3) {
            alert("Your email is already verified. You cannot go back to the verification step.");
            return;
        }
        setStep(prev => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (!formData.gender) {
                alert("Please select your gender");
                setIsLoading(false);
                return;
            }

            const userData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                securityQuestion: formData.securityQuestion,
                securityAnswer: formData.securityAnswer,
                age: formData.age ? Number(formData.age) : undefined,
                gender: formData.gender,
                history: formData.history,
                verificationToken: formData.verificationToken
            };
            await registerUser(userData);
            alert("Registration complete! You can now log in.");
            navigate('/login');
        } catch (error) {
            alert(error.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
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
                        <button type="button" onClick={handleNextStep1} disabled={isLoading} className="btn btn-primary w-full mt-4">
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Verify Email"} <ArrowRight size={18} />
                        </button>
                    </>
                );
            case 2:
                return (
                    <>
                        <div className="mb-4 text-center">
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                                We sent a 6-digit code to <strong>{formData.email}</strong>
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '1.5rem' }}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => otpRefs.current[index] = el}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onPaste={index === 0 ? handleOtpPaste : undefined}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            textAlign: 'center',
                                            fontSize: '1.5rem',
                                            fontWeight: '600',
                                            color: 'var(--text-primary)',
                                            background: '#f8fafc',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '8px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; e.target.style.background = '#ffffff'; }}
                                        onBlur={(e) => { if (!e.target.value) { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; } }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={handleBack} disabled={isLoading} className="btn" style={{ flex: 1, background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                                <ArrowLeft size={18} /> Edit Email
                            </button>
                            <button type="button" onClick={handleNextStep2} disabled={isLoading || otp.join('').length !== 6} className="btn btn-primary" style={{ flex: 1 }}>
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Verify Code"} <Check size={18} />
                            </button>
                        </div>
                    </>
                );
            case 3:
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
                        <button type="button" onClick={handleNextStep3} className="btn btn-primary w-full mt-4">
                            Continue <ArrowRight size={18} />
                        </button>
                    </>
                );
            case 4:
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
                                        value={formData.age} onChange={handleChange}
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
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
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
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button type="button" onClick={handleBack} disabled={isLoading} className="btn" style={{ flex: 1, background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                                <ArrowLeft size={18} /> Back
                            </button>
                            <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ flex: 1 }}>
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Check size={18} /> Create Account</>}
                            </button>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

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

            <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', background: 'white', border: 'none', boxShadow: 'var(--shadow-custom, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1))' }}>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        <span>Step {step} of 4</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${(step / 4) * 100}%`,
                            background: 'var(--primary-gradient)',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                </div>

                <div className="mb-4">
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        {step === 1 && "Create your account"}
                        {step === 2 && "Verify your email"}
                        {step === 3 && "Secure your account"}
                        {step === 4 && "Personal information"}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        {step === 1 && "Enter your basic information to get started"}
                        {step === 2 && "Enter the 6-digit code sent to your email"}
                        {step === 3 && "Choose a strong password to protect your health data"}
                        {step === 4 && "Help us personalize your experience"}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {renderStepContent()}
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
