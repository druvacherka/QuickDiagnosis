import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Ruler, Weight, Droplets, Activity, Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [details, setDetails] = useState({
        age: user.age || '',
        gender: user.gender || '',
        weight: user.weight || '',
        height: user.height || '',
        bloodGroup: user.bloodGroup || '',
        medicalHistory: user.medicalHistory || '',
        allergies: user.allergies || ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaving(true);

        const updatedUser = { ...user, ...details };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        setTimeout(() => {
            setIsSaving(false);
            setIsEditing(false);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }, 800);
    };

    const toggleEdit = () => {
        if (isEditing) {
            // Reset fields if canceling? Or just leave them. 
            // Usually, cancel should reset. Let's just toggle for now.
            setDetails({
                age: user.age || '',
                gender: user.gender || '',
                weight: user.weight || '',
                height: user.height || '',
                bloodGroup: user.bloodGroup || '',
                medicalHistory: user.medicalHistory || '',
                allergies: user.allergies || ''
            });
        }
        setIsEditing(!isEditing);
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem 0' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to="/dashboard" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                    <ArrowLeft size={18} /> Back to Dashboard
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Left Column: Profile Card */}
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary-gradient)',
                        margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '2.5rem', fontWeight: 800, boxShadow: 'var(--shadow-lg)'
                    }}>
                        {user.name?.charAt(0)}
                    </div>
                    <h2 style={{ margin: '0 0 0.5rem' }}>{user.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Mail size={16} /> {user.email}
                    </p>
                    <div style={{ marginTop: '2rem', textAlign: 'left', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                        <p>Welcome to your personal health dashboard. Keeping your details up to date helps our AI provide more personalized insights.</p>
                    </div>
                </div>

                {/* Right Column: Health Details Form */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Activity size={22} color="var(--primary-color)" /> Health Profile
                        </h3>
                        {!isEditing ? (
                            <button onClick={toggleEdit} className="btn" style={{ background: '#f0f9ff', color: 'var(--primary-color)', border: '1px solid #bae6fd', padding: '6px 16px', fontSize: '0.9rem' }}>
                                <User size={16} /> Edit Profile
                            </button>
                        ) : (
                            <button onClick={toggleEdit} className="btn" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '6px 16px', fontSize: '0.9rem' }}>
                                Cancel
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={details.age}
                                    onChange={handleInputChange}
                                    placeholder="Enter your age"
                                    disabled={!isEditing}
                                    style={{ background: !isEditing ? '#f8fafc' : 'white' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={16} /> Gender</label>
                                <select name="gender" value={details.gender} onChange={handleInputChange} disabled={!isEditing} style={{ background: !isEditing ? '#f8fafc' : 'white' }}>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Weight size={16} /> Weight (kg)</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={details.weight}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 70"
                                    disabled={!isEditing}
                                    style={{ background: !isEditing ? '#f8fafc' : 'white' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Ruler size={16} /> Height (cm)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={details.height}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 175"
                                    disabled={!isEditing}
                                    style={{ background: !isEditing ? '#f8fafc' : 'white' }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Droplets size={16} /> Blood Group</label>
                            <input
                                type="text"
                                name="bloodGroup"
                                value={details.bloodGroup}
                                onChange={handleInputChange}
                                placeholder="e.g. A+"
                                disabled={!isEditing}
                                style={{ background: !isEditing ? '#f8fafc' : 'white' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                <Activity size={18} color="var(--primary-color)" /> Medical History / Conditions
                            </label>
                            <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                                <textarea
                                    name="medicalHistory"
                                    value={details.medicalHistory}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Diabetes, Hypertension, previous surgeries..."
                                    rows="4"
                                    disabled={!isEditing}
                                    style={{
                                        width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0',
                                        background: !isEditing ? '#f1f5f9' : '#f8fafc', fontSize: '0.95rem', boxSizing: 'border-box',
                                        transition: 'all 0.3s ease', resize: 'vertical',
                                        opacity: !isEditing ? 0.8 : 1
                                    }}
                                    className="profile-textarea"
                                ></textarea>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                <AlertTriangle size={18} color="var(--warning-color)" /> Allergies
                            </label>
                            <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                                <textarea
                                    name="allergies"
                                    value={details.allergies}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Penicillin, Peanuts, Pollen..."
                                    rows="3"
                                    disabled={!isEditing}
                                    style={{
                                        width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0',
                                        background: !isEditing ? '#fff7ed' : '#fff7ed', fontSize: '0.95rem', boxSizing: 'border-box',
                                        transition: 'all 0.3s ease', resize: 'vertical',
                                        opacity: !isEditing ? 0.8 : 1
                                    }}
                                    className="profile-textarea"
                                ></textarea>
                            </div>
                        </div>

                        {message.text && (
                            <div style={{
                                padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem',
                                background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                                color: message.type === 'success' ? '#166534' : '#991b1b',
                                border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                            }}>
                                {message.text}
                            </div>
                        )}

                        {isEditing && (
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving Changes...' : <><Save size={20} /> Save Health Profile</>}
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
