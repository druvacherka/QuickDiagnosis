import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, MapPin, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { getHistory, clearHistory as clearHistoryAPI } from '../services/api';

const Dashboard = () => {
    const [user, setUser] = useState({ name: 'Guest' });
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);

            // 1. Initial load from User-Scoped Local Storage
            const historyKey = `diagnosis_history_${storedUser._id}`;
            const localHistory = JSON.parse(localStorage.getItem(historyKey)) || [];
            setHistory(localHistory);

            // 2. Refresh from Backend
            getHistory().then(data => {
                setHistory(data);
                localStorage.setItem(historyKey, JSON.stringify(data));
            }).catch(err => console.error("History fetch error:", err));
        }
    }, []);

    const getPrimaryDiagnosis = (data) => {
        if (Array.isArray(data)) return data[0];
        if (data && data.all_predictions) return data.all_predictions[0];
        if (data && data.disease) return data;
        return { disease: 'Unknown', probability: 0 };
    };

    return (
        <div>
            <header className="mb-4">
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Welcome, {user.name}</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Here's an overview of your health journey</p>
            </header>

            {/* Main Content - Full Width */}
            <div>
                {/* Top Cards */}
                <div className="cards-grid">
                    {/* New Analysis */}
                    <Link to="/symptoms" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#ecfeff', border: '1px solid #cffafe' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="icon-box" style={{ background: 'white', color: 'var(--primary-color)' }}>
                                <Activity size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>New Analysis</h3>
                                <p style={{ fontSize: '0.9rem', color: '#0e7490' }}>Check symptoms & predict disease</p>
                            </div>
                        </div>
                        <ChevronRight size={20} color="#0e7490" />
                    </Link>

                    {/* Hospitals */}
                    <Link to="/hospitals" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#f0f9ff', border: '1px solid #e0f2fe' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="icon-box" style={{ background: 'white', color: '#0ea5e9' }}>
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Hospitals</h3>
                                <p style={{ fontSize: '0.9rem', color: '#0369a1' }}>Nearby facilities</p>
                            </div>
                        </div>
                        <ChevronRight size={20} color="#0369a1" />
                    </Link>

                    {/* History Stats Card - Clickable */}
                    <Link
                        to={history.length > 0 ? "/results" : "#"}
                        state={history.length > 0 ? { prediction: history[0].data } : null}
                        className="card"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1.5rem',
                            background: '#f8fafc',
                            border: '1px solid var(--border-color)',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'all 0.2s ease',
                            cursor: history.length > 0 ? 'pointer' : 'default'
                        }}
                        onMouseEnter={(e) => {
                            if (history.length > 0) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="icon-box" style={{ background: 'white', color: '#6366f1' }}>
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>History</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{history.length} Saved Records</p>
                            </div>
                        </div>
                        {history.length > 0 && <ChevronRight size={20} color="#6366f1" />}
                    </Link>
                </div>

                {/* Recent Diagnoses */}
                <div className="card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Recent Diagnoses</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>Your symptom analysis history</p>
                        </div>
                        {history.length > 0 && (
                            <button
                                onClick={async () => {
                                    const confirmClear = window.confirm("Are you sure you want to clear your diagnosis history?");
                                    if (!confirmClear) return;

                                    try {
                                        await clearHistoryAPI();
                                        const historyKey = `diagnosis_history_${user._id}`;
                                        localStorage.removeItem(historyKey);
                                        setHistory([]);
                                    } catch (err) {
                                        console.error("Failed to clear history:", err);
                                        alert("Failed to clear history from server, but local view updated.");
                                        setHistory([]);
                                    }
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--danger-color)', fontSize: '0.85rem', cursor: 'pointer', padding: '0.5rem' }}
                            >
                                Clear History
                            </button>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-light)' }}>
                            <Activity size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>No diagnosis history yet</h4>
                            <p style={{ maxWidth: '400px', marginBottom: '2rem' }}>Start by analyzing your symptoms to get AI-powered health insights</p>
                            <Link to="/symptoms" className="btn btn-primary">
                                Start Your First Analysis <ChevronRight size={18} />
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {history.map((item) => {
                                const diag = getPrimaryDiagnosis(item.data);
                                return (
                                    <Link
                                        key={item.id}
                                        to="/results"
                                        state={{ prediction: item.data }}
                                        className="glass"
                                        style={{
                                            padding: '1.25rem',
                                            borderRadius: 'var(--border-radius-md)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderLeft: diag.probability > 0.7 ? '4px solid var(--primary-color)' : '4px solid var(--warning-color)',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                            <div style={{
                                                width: '40px', height: '40px', background: '#f1f5f9',
                                                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)'
                                            }}>
                                                <Activity size={20} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{diag.disease}</h4>
                                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={14} /> {item.date}
                                                    </span>
                                                    <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                                                        {(diag.probability * 100).toFixed(1)}% Confidence
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                            View Full Report
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
