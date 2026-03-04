import React, { useState, useEffect } from 'react';
import { User, MapPin, Calendar, Star, Info } from 'lucide-react';
import { getNearbyPlaces, getCoordinates } from '../services/api';
import { useLocation } from 'react-router-dom';

const Doctors = () => {
    const location = useLocation();
    const { disease } = location.state || {};

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userAddress, setUserAddress] = useState('Detecting location...');

    useEffect(() => {
        let isMounted = true;
        const fetchDoctors = async () => {
            try {
                if (!isMounted) return;
                setLoading(true);
                setError(null);

                if (navigator.geolocation) {
                    // 10 second timeout for geolocation
                    const geoTimeout = setTimeout(() => {
                        if (isMounted && loading) {
                            setError("Location detection is taking a while. You can enter your location manually.");
                            setLoading(false);
                        }
                    }, 10000);

                    navigator.geolocation.getCurrentPosition(async (position) => {
                        clearTimeout(geoTimeout);
                        if (!isMounted) return;
                        const { latitude, longitude } = position.coords;
                        setUserAddress("Your Current Location");
                        try {
                            const data = await getNearbyPlaces(latitude, longitude, 'doctor', disease);
                            if (isMounted) setDoctors(data);
                        } catch (apiErr) {
                            if (isMounted) setError("Failed to connect to search service.");
                        } finally {
                            if (isMounted) setLoading(false);
                        }
                    }, async (geoError) => {
                        clearTimeout(geoTimeout);
                        if (!isMounted) return;
                        console.warn("Geolocation denied/failed:", geoError);
                        setError("Could not detect location automatically.");
                        setLoading(false);
                    }, { timeout: 10000 }); // Browser-level timeout
                } else {
                    setError("Geolocation not supported by your browser.");
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError("An unexpected error occurred.");
                    setLoading(false);
                }
            }
        };

        fetchDoctors();
        return () => { isMounted = false; };
    }, [disease]);

    const handleManualLocation = async () => {
        const address = prompt("Enter your city/address:");
        if (address) {
            try {
                setLoading(true);
                const coords = await getCoordinates(address);
                setUserAddress(address);
                const data = await getNearbyPlaces(coords.lat, coords.lng, 'doctor', disease);
                setDoctors(data);
                setError(null);
            } catch (err) {
                alert("Could not find location.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ color: 'var(--primary-color)' }}>Find a Doctor</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Verified specialists near you.</p>
                </div>
                <button onClick={handleManualLocation} className="btn btn-secondary">
                    Change Location
                </button>
            </div>

            {loading && <p>Loading doctors...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Specialty Indicator */}
            {disease && !loading && !error && (
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: 'var(--border-radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#0369a1'
                }}>
                    <Info size={18} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                        Showing specialists recommended for <strong>{disease}</strong>
                    </span>
                </div>
            )}

            {!loading && !error && doctors.length === 0 && (
                <p>No doctors found nearby.</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {doctors.map(doctor => (
                    <div key={doctor.place_id || Math.random()} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '50%' }}>
                                <User size={32} color="var(--primary-color)" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{doctor.name}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{doctor.vicinity}</p>
                                {doctor.rating && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#f59e0b' }}>
                                        <Star size={14} fill="#f59e0b" /> {doctor.rating}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <MapPin size={16} /> {doctor.distance ? `${doctor.distance.toFixed(1)} km away` : 'Nearby'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--success-color)' }}>
                                <Calendar size={16} /> {doctor.opening_hours?.open_now ? 'Available Now' : 'Check availability'}
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => window.open(`https://www.google.com/maps/place/?q=place_id:${doctor.place_id}`, '_blank')}>
                                Book / View on Map
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Doctors;
