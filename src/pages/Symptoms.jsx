import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Activity, AlertCircle, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { getSymptoms, predictDisease } from '../services/api';

const Symptoms = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState('');
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [availableSymptoms, setAvailableSymptoms] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // ── Follow-up state ────────────────────────────────────────────────────
    const [showFollowUp, setShowFollowUp] = useState(false);
    // flat deduped list of question objects: { symptom, disease, diseaseIndex }
    const [questionQueue, setQuestionQueue] = useState([]);
    const [queueIndex, setQueueIndex] = useState(0);
    // accumulated YES answers (extras beyond initial selectedSymptoms)
    const [confirmedExtra, setConfirmedExtra] = useState([]);
    // original candidates from the API, used to rebuild the queue on the fly
    const [rawCandidates, setRawCandidates] = useState([]);
    // which symptoms has the user already responded to (yes or no)
    const [answered, setAnswered] = useState(new Set());

    useEffect(() => {
        const fetchSymptomsList = async () => {
            try {
                const data = await getSymptoms();
                if (Array.isArray(data)) setAvailableSymptoms(data);
            } catch (error) {
                console.error('Failed to load symptoms', error);
            }
        };
        fetchSymptomsList();
    }, []);

    const formatSymptom = (str) =>
        str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    useEffect(() => {
        if (inputValue.trim() === '') { setFilteredSuggestions([]); return; }
        const filtered = availableSymptoms.filter(symptom => {
            const formatted = formatSymptom(symptom);
            return formatted.toLowerCase().includes(inputValue.toLowerCase()) &&
                !selectedSymptoms.includes(symptom);
        });
        setFilteredSuggestions(filtered);
    }, [inputValue, availableSymptoms, selectedSymptoms]);

    const handleAddSymptom = (symptom) => {
        if (selectedSymptoms.length >= 15) { alert('Maximum 15 symptoms allowed.'); return; }
        if (!selectedSymptoms.includes(symptom)) {
            setSelectedSymptoms(prev => [...prev, symptom]);
            setInputValue('');
            setFilteredSuggestions([]);
        }
    };

    const handleRemoveSymptom = (symptomToRemove) =>
        setSelectedSymptoms(prev => prev.filter(s => s !== symptomToRemove));

    // ── Build a deduped ordered question queue from candidates ─────────────
    // Each entry: { symptom, disease, candidateIdx }
    // Symptoms already answered or in answeredYes are skipped.
    const buildQueue = useCallback((candidates, alreadyAnswered, initial) => {
        const seen = new Set([...initial, ...alreadyAnswered]);
        const queue = [];
        candidates.forEach((cand, ci) => {
            cand.missingSymptoms.forEach(s => {
                if (!seen.has(s)) {
                    seen.add(s);
                    queue.push({ symptom: s, disease: cand.disease, candidateIdx: ci });
                }
            });
        });
        return queue;
    }, []);

    // ── Run ML prediction ──────────────────────────────────────────────────
    // bypassFollowUp=true → go straight to results regardless of candidates
    const runPrediction = async (symptoms, bypassFollowUp = false, confirmedList = null) => {
        setIsLoading(true);
        try {
            const response = await predictDisease(symptoms, confirmedList);
            const predictions = Array.isArray(response)
                ? response
                : (response.predictions || []);
            const candidates = response.followUpCandidates || [];

            if (!bypassFollowUp && candidates.length > 0) {
                // Build the initial question queue
                const queue = buildQueue(candidates, [], symptoms);
                if (queue.length > 0) {
                    setRawCandidates(candidates);
                    setQuestionQueue(queue);
                    setQueueIndex(0);
                    setConfirmedExtra([]);
                    setAnswered(new Set());
                    setShowFollowUp(true);
                    setIsLoading(false);
                    return;
                }
            }

            setIsLoading(false);
            navigate('/results', { state: { selectedSymptoms: symptoms, prediction: predictions } });
        } catch (error) {
            setIsLoading(false);
            console.error('Prediction failed:', error);
            alert('Failed to get prediction. Please ensure the backend server is running.');
        }
    };

    const handleAnalyze = () => {
        if (selectedSymptoms.length === 0) return;
        runPrediction(selectedSymptoms, false);
    };

    // ── Answer handler ─────────────────────────────────────────────────────
    const handleFollowUpAnswer = (hasSymptom) => {
        const current = questionQueue[queueIndex];
        const newAnswered = new Set(answered);
        newAnswered.add(current.symptom);

        let newExtra = [...confirmedExtra];
        let newSelected = [...selectedSymptoms];

        if (hasSymptom) {
            if (!newExtra.includes(current.symptom)) newExtra.push(current.symptom);
            if (!newSelected.includes(current.symptom)) newSelected.push(current.symptom);
        }

        setAnswered(newAnswered);
        setConfirmedExtra(newExtra);
        setSelectedSymptoms(newSelected);

        const nextIndex = queueIndex + 1;

        if (nextIndex < questionQueue.length) {
            setQueueIndex(nextIndex);
        } else {
            // All questions answered – run final prediction with augmented symptoms
            // and pass the confirmed (Yes) answers so Python can boost the confidence
            setShowFollowUp(false);
            runPrediction(newSelected, true, newExtra);
        }
    };

    const handleSkipAll = () => {
        setShowFollowUp(false);
        const merged = [...new Set([...selectedSymptoms, ...confirmedExtra])];
        // Pass whatever extras were confirmed so far as confirmed symptoms
        runPrediction(merged, true, confirmedExtra);
    };

    // ── Common symptoms ────────────────────────────────────────────────────
    const commonSymptoms = [
        'fever', 'cough', 'headache', 'fatigue',
        'itching', 'skin_rash', 'nodal_skin_eruptions', 'continuous_sneezing',
        'shivering', 'chills', 'joint_pain', 'stomach_pain', 'acidity',
        'ulcers_on_tongue', 'muscle_wasting', 'vomiting'
    ];

    // ── Progress info for modal header ────────────────────────────────────
    const currentQ = questionQueue[queueIndex] || {};
    const totalQ = questionQueue.length;
    const progressPct = totalQ > 0 ? ((queueIndex) / totalQ) * 100 : 0;

    // count how many distinct diseases are still in the remaining queue
    const remainingDiseases = [...new Set(
        questionQueue.slice(queueIndex).map(q => q.disease)
    )];

    return (
        <div>
            <div className="text-center mb-4">
                <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    Symptom Checker
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Select all the symptoms you're experiencing. Be as specific as possible for better results.
                </p>
            </div>

            <div className="dashboard-grid" style={{ alignItems: 'stretch' }}>
                {/* Left Column: Search & Common */}
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
                    <div className="mb-4">
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Search Symptoms</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Type to find symptoms from our medical database
                        </p>

                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input
                                type="text"
                                placeholder="Type symptoms e.g. headache, fever, cough"
                                className="input-field"
                                style={{ paddingLeft: '48px', background: '#f8fafc', borderColor: '#e2e8f0' }}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                            {inputValue && filteredSuggestions.length > 0 && (
                                <ul style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    backgroundColor: 'white', border: '1px solid var(--border-color)',
                                    borderRadius: '0 0 8px 8px', maxHeight: '200px', overflowY: 'auto',
                                    zIndex: 10, listStyle: 'none', padding: 0, margin: 0,
                                    boxShadow: 'var(--shadow-md)'
                                }}>
                                    {filteredSuggestions.map(symptom => (
                                        <li
                                            key={symptom}
                                            onMouseDown={() => handleAddSymptom(symptom)}
                                            style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                        >
                                            {formatSymptom(symptom)}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="mb-4" style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                            Common symptoms:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {commonSymptoms.map(s => (
                                <span
                                    key={s}
                                    className={`pill ${selectedSymptoms.includes(s) ? 'active' : ''}`}
                                    onClick={() => handleAddSymptom(s)}
                                >
                                    {formatSymptom(s)}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Selected & Analyze */}
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Your Symptoms</h3>
                    {selectedSymptoms.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-light)' }}>
                            <Activity size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <p>No symptoms selected yet</p>
                            <p style={{ fontSize: '0.85rem' }}>Search or click on symptoms above to add them</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {selectedSymptoms.map(s => (
                                <span key={s} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    fontSize: '0.9rem', padding: '6px 12px',
                                    backgroundColor: confirmedExtra.includes(s) ? '#f0fdf4' : '#eff6ff',
                                    border: `1px solid ${confirmedExtra.includes(s) ? '#bbf7d0' : '#bfdbfe'}`,
                                    color: confirmedExtra.includes(s) ? '#166534' : 'var(--primary-color)',
                                    borderRadius: '6px',
                                }}>
                                    {formatSymptom(s)}
                                    {!confirmedExtra.includes(s) && (
                                        <X
                                            size={14}
                                            style={{ cursor: 'pointer', opacity: 0.7 }}
                                            onClick={() => handleRemoveSymptom(s)}
                                        />
                                    )}
                                </span>
                            ))}
                        </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '2rem 0 1.5rem' }}></div>

                    <button
                        onClick={handleAnalyze}
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={selectedSymptoms.length === 0 || isLoading}
                    >
                        {isLoading
                            ? 'Analyzing...'
                            : <> Analyze Symptoms <ChevronRight size={18} /></>
                        }
                    </button>
                </div>
            </div>

            {/* Tips Section */}
            <div className="card" style={{ marginTop: '2rem', background: '#ecfeff', border: '1px solid #cffafe', color: '#164e63' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <AlertCircle size={20} color="#06b6d4" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 600 }}>Tips for accurate results</h4>
                        <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.9rem', lineHeight: '1.5', color: '#155e75' }}>
                            <li>Include all symptoms, even minor ones, to help the AI identify patterns.</li>
                            <li>Answer the follow-up questions honestly — they improve accuracy significantly.</li>
                            <li>Add related symptoms you may have noticed recently.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* ── Follow-Up Modal ─────────────────────────────────────────────────── */}
            {showFollowUp && questionQueue.length > 0 && queueIndex < questionQueue.length && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card" style={{
                        maxWidth: '480px', width: '92%',
                        animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
                        padding: '2rem'
                    }}>
                        {/* Progress bar */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '0.4rem'
                            }}>
                                <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Refine Your Diagnosis
                                </span>
                                <span>{queueIndex + 1} / {totalQ}</span>
                            </div>
                            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${progressPct}%`,
                                    background: 'var(--primary-gradient)',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>

                        {/* Disease context badge */}
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: '#eff6ff', border: '1px solid #bfdbfe',
                            color: 'var(--primary-color)', borderRadius: '20px',
                            padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600,
                            marginBottom: '1rem'
                        }}>
                            Possible: <strong>{currentQ.disease}</strong>
                            {remainingDiseases.length > 1 && (
                                <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>
                                    &nbsp;+{remainingDiseases.length - 1} more
                                </span>
                            )}
                        </div>

                        {/* Question */}
                        <h3 style={{ marginTop: 0, color: 'var(--text-primary)', fontSize: '1.2rem', lineHeight: 1.4 }}>
                            Are you experiencing{' '}
                            <span style={{ color: 'var(--primary-color)' }}>
                                {formatSymptom(currentQ.symptom)}
                            </span>?
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
                            Based on your initial results, <strong>{currentQ.disease}</strong> is a
                            possible match. Answering these questions helps the AI refine the prediction.
                        </p>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, justifyContent: 'center', gap: '8px' }}
                                onClick={() => handleFollowUpAnswer(true)}
                            >
                                <CheckCircle size={18} /> Yes
                            </button>
                            <button
                                className="btn"
                                style={{ flex: 1, justifyContent: 'center', gap: '8px', background: '#f1f5f9', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                                onClick={() => handleFollowUpAnswer(false)}
                            >
                                <XCircle size={18} /> No
                            </button>
                        </div>

                        <button
                            onClick={handleSkipAll}
                            style={{
                                width: '100%', background: 'none', border: 'none',
                                color: 'var(--text-light)', fontSize: '0.85rem',
                                cursor: 'pointer', padding: '0.5rem', textDecoration: 'underline'
                            }}
                        >
                            Skip remaining questions and get results now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Symptoms;
