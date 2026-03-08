import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Stethoscope, MapPin, Activity, ArrowLeft, AlertCircle } from 'lucide-react';
import { saveToHistory } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import axios from 'axios';

const Results = () => {
    const location = useLocation();
    const { prediction } = location.state || {};

    const { addNotification } = useNotifications();
    const hasSavedRef = React.useRef(false);
    const hasNotifiedRef = React.useRef(false);
    const normalizedPredictions = prediction ? (
        Array.isArray(prediction) ? prediction :
            (prediction.predictions || prediction.all_predictions || [prediction])
    ) : [];

    useEffect(() => {
        if (prediction && !hasSavedRef.current) {
            hasSavedRef.current = true;
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return;

            const historyKey = `diagnosis_history_${user._id}`;
            const history = JSON.parse(localStorage.getItem(historyKey)) || [];

            const latestEntry = {
                id: Date.now(),
                date: new Date().toLocaleDateString(),
                timestamp: new Date().toLocaleString(),
                data: prediction
            };

            // 1. Sync to Backend
            saveToHistory(prediction).catch(err => console.error("Failed to sync to backend:", err));

            // 2. Update Local Scoped Cache
            if (history.length === 0 || JSON.stringify(history[0].data) !== JSON.stringify(prediction)) {
                const updatedHistory = [latestEntry, ...history].slice(0, 50);
                localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
            }

            // 3. Trigger Notification
            if (!hasNotifiedRef.current) {
                hasNotifiedRef.current = true;
                const primaryDisease = normalizedPredictions[0]?.disease;
                if (primaryDisease) {
                    axios.get(`http://localhost:5000/api/precautions/${primaryDisease}`)
                        .then(res => {
                            addNotification({
                                type: 'disease',
                                title: `Health Alert: ${primaryDisease}`,
                                message: `We detected a potential profile for ${primaryDisease}. Please check the precautions below.`,
                                precautions: res.data
                            });
                        })
                        .catch(err => console.error("Failed to fetch precautions for notification:", err));
                }
            }
        }
    }, [prediction, normalizedPredictions]);

    if (!prediction) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div className="card">
                    <Activity size={48} color="var(--primary-color)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                    <h2 style={{ marginBottom: '1rem' }}>No Analysis Results</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Please start a new analysis to see results.</p>
                    <Link to="/symptoms" className="btn btn-primary">Check Symptoms</Link>
                </div>
            </div>
        );
    }


    if (normalizedPredictions.length === 0) return null;

    const primary = normalizedPredictions[0];
    const confidence = (primary.probability * 100).toFixed(1);

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 0' }}>
            {/* Header / Back Link */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to="/dashboard" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <div style={{ height: '1px', flex: 1, background: 'var(--border-color)', opacity: 0.5 }}></div>
            </div>

            {/* Grid Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: normalizedPredictions.length > 1 ? '2fr 1fr' : '1fr',
                gap: '1.5rem'
            }}>

                {/* Left Column: Primary Diagnosis */}
                <div className="card" style={{ padding: '2rem', background: 'white', border: 'none', boxShadow: 'var(--shadow-md)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--primary-gradient)' }}></div>

                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{
                            width: '80px', height: '80px', background: 'var(--primary-gradient)',
                            borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 10px 20px -5px rgba(14, 165, 233, 0.3)', flexShrink: 0
                        }}>
                            <CheckCircle color="white" size={40} />
                        </div>
                        <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>Primary Analysis Result</span>
                            <h1 style={{ fontSize: '2.5rem', margin: '0.25rem 0', fontWeight: 800, color: 'var(--text-primary)' }}>{primary.disease}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                <Activity size={16} />
                                <span style={{ fontSize: '0.95rem' }}>AI-Powered Diagnostic Prediction</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Confidence Level</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)' }}>{confidence}%</span>
                        </div>
                        <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '7px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${confidence}%`, height: '100%', background: 'var(--primary-gradient)',
                                transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)', borderRadius: '7px'
                            }}></div>
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #bae6fd', background: '#f0f9ff' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <AlertTriangle color="var(--primary-color)" size={24} style={{ flexShrink: 0 }} />
                            <div>
                                <h4 style={{ margin: '0 0 0.5rem', color: '#0369a1' }}>Next Steps & Recommendations</h4>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#075985', lineHeight: '1.5' }}>
                                    This result suggests a profile similar to {primary.disease}. We recommend speaking with a healthcare professional to confirm these findings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Other Possibilities & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {normalizedPredictions.length > 1 && (
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={18} color="var(--text-light)" /> Other Considerations
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {normalizedPredictions.slice(1, 4).map((item, idx) => (
                                    <div key={idx} style={{
                                        padding: '12px', background: '#f8fafc', borderRadius: '10px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{item.disease}</span>
                                        <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                                            {(item.probability * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="card" style={{ padding: '1.5rem', background: 'var(--primary-gradient)', color: 'white', border: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Take Action</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', justifyContent: 'center' }}>
                            <Link
                                to="/hospitals"
                                state={{ disease: primary.disease }}
                                className="btn"
                                style={{ background: 'rgba(255,255,255,0.15)', color: 'white', width: '100%', padding: '12px', border: '1px solid rgba(255,255,255,0.3)', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                            >
                                <MapPin size={18} /> Find Local Hospital
                            </Link>
                            <Link to="/symptoms" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginTop: '0.5rem', textDecoration: 'none' }}>
                                Start New Analysis
                            </Link>
                        </div>
                    </div>

                </div>
            </div>

            {/* Note moved outside the grid for symmetry */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center', width: '100%' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: 0, lineHeight: '1.4' }}>
                    <strong>Note:</strong> This is an AI-generated assessment, not a clinical diagnosis. Always seek professional advice.
                </p>
            </div>
        </div>
    );
};

export default Results;

