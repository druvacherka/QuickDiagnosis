import React, { useState, useEffect } from 'react';
import { User, MapPin, Calendar, Star } from 'lucide-react';
import { getNearbyPlaces, getCoordinates } from '../services/api';

const Doctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userAddress, setUserAddress] = useState('Detecting location...');

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                setLoading(true);
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (position) => {
                        const { latitude, longitude } = position.coords;
                        setUserAddress("Your Current Location");
                        // Fetching 'doctor' type places
                        const data = await getNearbyPlaces(latitude, longitude, 'doctor');
                        setDoctors(data);
                        setLoading(false);
                    }, async (geoError) => {
                        console.warn("Geolocation denied:", geoError);
                        setError("Permission denied. Enable location or search manually.");
                        setLoading(false);
                    });
                } else {
                    setError("Geolocation not supported.");
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to fetch doctors.");
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    const handleManualLocation = async () => {
        const address = prompt("Enter your city/address:");
        if (address) {
            try {
                setLoading(true);
                const coords = await getCoordinates(address);
                setUserAddress(address);
                const data = await getNearbyPlaces(coords.lat, coords.lng, 'doctor');
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
