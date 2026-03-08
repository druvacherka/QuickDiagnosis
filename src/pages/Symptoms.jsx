import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Activity, ArrowRight, AlertCircle, ChevronRight } from 'lucide-react';
import { getSymptoms, predictDisease } from '../services/api';

const Symptoms = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState('');
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [availableSymptoms, setAvailableSymptoms] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);

    // Follow-up Logic
    const [followUpQueue, setFollowUpQueue] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showFollowUp, setShowFollowUp] = useState(false);
    const [diseaseContext, setDiseaseContext] = useState('');

    useEffect(() => {
        const fetchSymptomsList = async () => {
            try {
                const data = await getSymptoms();
                if (Array.isArray(data)) {
                    setAvailableSymptoms(data);
                }
            } catch (error) {
                console.error("Failed to load symptoms", error);
            }
        };
        fetchSymptomsList();
    }, []);

    const formatSymptom = (str) => {
        return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    useEffect(() => {
        if (inputValue.trim() === '') {
            setFilteredSuggestions([]);
            return;
        }
        const filtered = availableSymptoms.filter(symptom => {
            const formatted = formatSymptom(symptom);
            return formatted.toLowerCase().includes(inputValue.toLowerCase()) &&
                !selectedSymptoms.includes(symptom);
        });
        setFilteredSuggestions(filtered);
    }, [inputValue, availableSymptoms, selectedSymptoms]);

    const handleAddSymptom = (symptom) => {
        if (selectedSymptoms.length >= 15) {
            alert("Maximum 15 symptoms allowed.");
            return;
        }
        if (!selectedSymptoms.includes(symptom)) {
            setSelectedSymptoms([...selectedSymptoms, symptom]);
            setInputValue('');
            setFilteredSuggestions([]);
        }
    };

    const handleRemoveSymptom = (symptomToRemove) => {
        setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptomToRemove));
    };

    const handleAnalyze = async (bypassFollowUp = false, currentSymptomsOverride = null) => {
        const symptomsToSend = currentSymptomsOverride || selectedSymptoms;

        console.log("Analyze clicked. Symptoms:", symptomsToSend);

        if (symptomsToSend.length === 0) {
            console.warn("No symptoms selected.");
            return;
        }

        try {
            console.log("Calling predictDisease API...");
            const response = await predictDisease(symptomsToSend);
            console.log("API Response:", response);

            const predictions = Array.isArray(response) ? response : (response.predictions || []);
            const followUp = response.followUp;

            if (!bypassFollowUp && followUp) {
                console.log("Follow-up required:", followUp);
                const newSymptoms = followUp.missingSymptoms.filter(s => !symptomsToSend.includes(s));
                if (newSymptoms.length > 0) {
                    setFollowUpQueue(newSymptoms);
                    setCurrentQuestionIndex(0);
                    setDiseaseContext(followUp.disease);
                    setShowFollowUp(true);
                    return;
                }
            }

            console.log("Navigating to results with:", predictions);
            navigate('/results', {
                state: {
                    selectedSymptoms: symptomsToSend,
                    prediction: predictions
                }
            });
        } catch (error) {
            console.error("Prediction failed:", error);
            alert("Failed to get prediction. Please ensure the backend server is running.");
        }
    };

    const handleFollowUpAnswer = (hasSymptom) => {
        const currentSymptom = followUpQueue[currentQuestionIndex];
        let updatedSymptoms = [...selectedSymptoms];

        if (hasSymptom) {
            if (!updatedSymptoms.includes(currentSymptom)) {
                updatedSymptoms.push(currentSymptom);
                setSelectedSymptoms(updatedSymptoms);
            }
        }

        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < followUpQueue.length) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            setShowFollowUp(false);
            handleAnalyze(true, updatedSymptoms);
        }
    };

    // Common symptoms for quick add
    const commonSymptoms = [
        'fever', 'cough', 'headache', 'fatigue',
        'itching', 'skin_rash', 'nodal_skin_eruptions', 'continuous_sneezing',
        'shivering', 'chills', 'joint_pain', 'stomach_pain', 'acidity',
        'ulcers_on_tongue', 'muscle_wasting', 'vomiting'
    ];

    return (
        <div>
            <div className="text-center mb-4">
                <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Symptom Checker</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Select all the symptoms you're experiencing. Be as specific as possible for better results.</p>
            </div>

            <div className="dashboard-grid" style={{ alignItems: 'stretch' }}>
                {/* Left Column: Search & Common */}
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
                    <div className="mb-4">
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Search Symptoms</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Type to find symptoms from our medical database</p>

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
                            {/* Suggestions List */}
                            {inputValue && filteredSuggestions.length > 0 && (
                                <ul style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '0 0 8px 8px',
                                    maxHeight: '200px', overflowY: 'auto', zIndex: 10, listStyle: 'none', padding: 0, margin: 0,
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
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Common symptoms:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {commonSymptoms.map(s => (
                                <span
                                    key={s}
                                    className={`pill ${selectedSymptoms.includes(s) ? 'active' : ''} `}
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
                                    backgroundColor: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    color: 'var(--primary-color)',
                                    borderRadius: '6px',
                                }}>
                                    {formatSymptom(s)}
                                    <X
                                        size={14}
                                        style={{ cursor: 'pointer', opacity: 0.7 }}
                                        onClick={() => handleRemoveSymptom(s)}
                                    />
                                </span>
                            ))}
                        </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '2rem 0 1.5rem' }}></div>

                    <button
                        onClick={() => handleAnalyze(false)}
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={selectedSymptoms.length === 0}
                    >
                        Analyze Symptoms <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Tips Section - Full Width Below */}
            <div className="card" style={{ marginTop: '2rem', background: '#ecfeff', border: '1px solid #cffafe', color: '#164e63' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <AlertCircle size={20} color="#06b6d4" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 600 }}>Tips for accurate results</h4>
                        <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.9rem', lineHeight: '1.5', color: '#155e75' }}>
                            <li>Include all symptoms, even minor ones, to help the AI identify patterns.</li>
                            <li>Specify severity and duration accurately if prompted.</li>
                            <li>Add related symptoms you may have noticed recently.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Follow-Up Modal */}
            {showFollowUp && followUpQueue.length > 0 && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div className="card" style={{ maxWidth: '400px', width: '90%', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700, letterSpacing: '0.05em' }}>
                            Question {currentQuestionIndex + 1} of {followUpQueue.length}
                        </div>
                        <h3 style={{ marginTop: 0, color: 'var(--primary-color)', fontSize: '1.25rem' }}>
                            Do you have {formatSymptom(followUpQueue[currentQuestionIndex])}?
                        </h3>
                        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            This is common in cases of <strong>{diseaseContext}</strong>.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleFollowUpAnswer(true)}>Yes</button>
                            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleFollowUpAnswer(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Symptoms;
