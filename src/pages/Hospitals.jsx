import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Navigation, AlertCircle } from 'lucide-react';
import { getNearbyPlaces, getCoordinates } from '../services/api';

const Hospitals = () => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState({ lat: 28.6139, lng: 77.2090 }); // Default: New Delhi
    const [userAddress, setUserAddress] = useState('Detecting location...');

    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                setLoading(true);
                // Simple Geolocation access
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (position) => {
                        const { latitude, longitude } = position.coords;
                        setUserLocation({ lat: latitude, lng: longitude });
                        setUserAddress("Your Current Location"); // Or reverse geocode if needed

                        const data = await getNearbyPlaces(latitude, longitude, 'hospital');
                        setHospitals(data);
                        setLoading(false);
                    }, async (geoError) => {
                        console.warn("Geolocation denied/failed:", geoError);
                        setError("Location permission denied. Showing default results.");
                        // Fallback or ask user (simplified for now as per instructions "Ask user to manually enter" - handling that via minimal UI if possible, or defaulting)
                        // For auto-fetch flow, we'll try default or show empty
                        setLoading(false);
                    });
                } else {
                    setError("Geolocation not supported.");
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to fetch hospitals.");
                setLoading(false);
            }
        };

        fetchHospitals();
    }, []);

    // Manual address handler (optional if error)
    const handleManualLocation = async () => {
        const address = prompt("Enter your city/address:");
        if (address) {
            try {
                setLoading(true);
                const coords = await getCoordinates(address);
                setUserLocation(coords);
                setUserAddress(address);
                const data = await getNearbyPlaces(coords.lat, coords.lng, 'hospital');
                setHospitals(data);
                setError(null);
            } catch (err) {
                alert("Could not find location.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>Nearby Hospitals</h2>
                    <button onClick={handleManualLocation} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                        Change Location
                    </button>
                </div>

                {loading && <p>Loading nearby hospitals...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}

                {!loading && !error && hospitals.length === 0 && (
                    <p>No data available yet.</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {hospitals.map(hospital => (
                        <div key={hospital.place_id || Math.random()} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h3 style={{ margin: 0 }}>{hospital.name}</h3>
                                    {/* Google Places doesn't strictly have 'emergency' bool in basic list, relying on types if needed */}
                                    {hospital.opening_hours?.open_now && (
                                        <span style={{
                                            backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.75rem',
                                            padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            Open Now
                                        </span>
                                    )}
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0' }}>{hospital.vicinity}</p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{
                                        backgroundColor: '#f1f5f9', color: 'var(--text-secondary)',
                                        fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px'
                                    }}>
                                        Rating: {hospital.rating || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                    {hospital.distance ? `${hospital.distance.toFixed(1)} km` : ''}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-primary" style={{ padding: '0.5rem' }} title="View on Map" onClick={() => window.open(`https://www.google.com/maps/place/?q=place_id:${hospital.place_id}`, '_blank')}>
                                        <Navigation size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ height: 'fit-content', padding: 0, overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#e5e7eb', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                    <div className="text-center">
                        <MapPin size={48} />
                        <p>Map Integration Coming Soon</p>
                    </div>
                </div>
                <div style={{ padding: '1rem' }}>
                    <h4>Current Location</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{userAddress}</p>
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
                </div>
            </div>
        </div>
    );
};

export default Hospitals;
