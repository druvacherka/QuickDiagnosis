import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, MapPin, Clock, ChevronRight, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { getHistory, clearHistory as clearHistoryAPI } from '../services/api';
import axios from 'axios';

const Dashboard = () => {
    const [user, setUser] = useState({ name: 'Guest' });
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('history');
    const [dailyTip, setDailyTip] = useState('');
    const [precautions, setPrecautions] = useState([]);

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

        // Fetch daily tip
        axios.get('http://localhost:5000/api/health-tips')
            .then(res => setDailyTip(res.data.tip))
            .catch(err => console.error("Health tip fetch error:", err));
    }, []);

    const getPrimaryDiagnosis = (data) => {
        if (Array.isArray(data)) return data[0];
        if (data && data.all_predictions) return data.all_predictions[0];
        if (data && data.disease) return data;
        return { disease: 'Unknown', probability: 0 };
    };

    useEffect(() => {
        if (history.length > 0) {
            const diag = getPrimaryDiagnosis(history[0].data);
            if (diag.disease && diag.disease !== 'Unknown') {
                axios.get(`http://localhost:5000/api/precautions/${diag.disease}`)
                    .then(res => setPrecautions(res.data))
                    .catch(err => console.error("Precautions fetch error:", err));
            }
        }
    }, [history]);


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

                {/* Dashboard Tabs Section */}
                <div className="card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', gap: '1rem', overflowX: 'auto' }}>
                        <button
                            onClick={() => setActiveTab('history')}
                            style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'history' ? '3px solid var(--primary-color)' : '3px solid transparent', color: activeTab === 'history' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: activeTab === 'history' ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.05rem', whiteSpace: 'nowrap' }}
                        >Recent Diagnoses</button>
                        <button
                            onClick={() => setActiveTab('tip')}
                            style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'tip' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'tip' ? '#10b981' : 'var(--text-secondary)', fontWeight: activeTab === 'tip' ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.05rem', whiteSpace: 'nowrap' }}
                        >Tip of the Day</button>
                        <button
                            onClick={() => setActiveTab('precautions')}
                            style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'precautions' ? '3px solid #f59e0b' : '3px solid transparent', color: activeTab === 'precautions' ? '#f59e0b' : 'var(--text-secondary)', fontWeight: activeTab === 'precautions' ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.05rem', whiteSpace: 'nowrap' }}
                        >Precautions</button>
                    </div>

                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                {activeTab === 'history' && 'Recent Diagnoses'}
                                {activeTab === 'tip' && 'Daily Health Tip'}
                                {activeTab === 'precautions' && 'Last Diagnosis Precautions'}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {activeTab === 'history' && 'Your symptom analysis history'}
                                {activeTab === 'tip' && 'A helpful tip to keep you healthy'}
                                {activeTab === 'precautions' && (history.length > 0 ? `Recommended steps for ${getPrimaryDiagnosis(history[0].data).disease}` : 'No recent diagnosis to show precautions for')}
                            </p>
                        </div>
                        {activeTab === 'history' && history.length > 0 && (
                            <button
                                onClick={async () => {
                                    const confirmClear = window.confirm("Are you sure you want to clear your diagnosis history?");
                                    if (!confirmClear) return;

                                    try {
                                        await clearHistoryAPI();
                                        const historyKey = `diagnosis_history_${user._id}`;
                                        localStorage.removeItem(historyKey);
                                        setHistory([]);
                                        setPrecautions([]);
                                    } catch (err) {
                                        console.error("Failed to clear history:", err);
                                        alert("Failed to clear history from server, but local view updated.");
                                        setHistory([]);
                                        setPrecautions([]);
                                    }
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--danger-color)', fontSize: '0.85rem', cursor: 'pointer', padding: '0.5rem' }}
                            >
                                Clear History
                            </button>
                        )}
                    </div>

                    {activeTab === 'tip' && (
                        <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <Info size={40} color="#10b981" style={{ marginBottom: '1rem' }} />
                            <h4 style={{ fontSize: '1.3rem', color: '#065f46', marginBottom: '1rem' }}>Today's Tip</h4>
                            <p style={{ fontSize: '1.1rem', color: '#047857', maxWidth: '500px', lineHeight: 1.6 }}>{dailyTip || 'Loading...'}</p>
                        </div>
                    )}

                    {activeTab === 'precautions' && (
                        <div style={{ flex: 1, padding: '2rem', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                            {history.length > 0 ? (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', color: '#b45309' }}>
                                        <ShieldAlert size={28} />
                                        <h4 style={{ fontSize: '1.2rem', margin: 0 }}>Follow these steps</h4>
                                    </div>
                                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {(precautions.length > 0 ? precautions : ["Consult a doctor for professional advice."]).map((p, idx) => (
                                            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#92400e', fontSize: '1.05rem', padding: '8px 12px', background: 'rgba(251, 191, 36, 0.2)', borderRadius: '6px' }}>
                                                <span style={{ color: '#d97706', fontWeight: 'bold' }}>•</span> {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#b45309' }}>
                                    <Activity size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p>Start a symptom analysis to get personalized precautions.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        history.length === 0 ? (
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
                        )
                    )}
                    {/* End History Content */}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
