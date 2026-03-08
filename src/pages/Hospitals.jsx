import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Navigation, AlertCircle, Info } from 'lucide-react';
import { getNearbyPlaces, getCoordinates } from '../services/api';
import { useLocation } from 'react-router-dom';

const Hospitals = () => {
    const location = useLocation();
    const { disease } = location.state || {};

    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState({ lat: 28.6139, lng: 77.2090 }); // Default: New Delhi
    const [userAddress, setUserAddress] = useState('Detecting location...');

    useEffect(() => {
        let isMounted = true;
        const fetchHospitals = async () => {
            try {
                if (!isMounted) return;
                setLoading(true);
                setError(null);

                if (navigator.geolocation) {
                    // 10 second timeout for geolocation detection
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
                        setUserLocation({ lat: latitude, lng: longitude });
                        setUserAddress("Your Current Location");

                        try {
                            const data = await getNearbyPlaces(latitude, longitude, 'hospital', disease);
                            if (isMounted) setHospitals(data);
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

        fetchHospitals();
        return () => { isMounted = false; };
    }, [disease]);

    const handleManualLocation = async () => {
        const address = prompt("Enter your city/address:");
        if (address) {
            try {
                setLoading(true);
                const coords = await getCoordinates(address);
                setUserLocation(coords);
                setUserAddress(address);
                const data = await getNearbyPlaces(coords.lat, coords.lng, 'hospital', disease);
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

                {loading && <p>Searching for hospitals near you...</p>}
                {error && (
                    <div style={{ color: '#b91c1c', background: '#fef2f2', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fecaca' }}>
                        <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
                        <button onClick={handleManualLocation} className="btn btn-secondary" style={{ marginTop: '0.5rem', padding: '4px 12px', fontSize: '0.8rem' }}>
                            Enter Address Manually
                        </button>
                    </div>
                )}

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
                            Showing hospitals recommended for <strong>{disease}</strong>
                        </span>
                    </div>
                )}

                {!loading && !error && hospitals.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <MapPin size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No medical facilities found in this area. Try searching for a larger city.</p>
                        <button onClick={handleManualLocation} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            Search Another Location
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {hospitals.map(hospital => (
                        <div key={hospital.place_id || Math.random()} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h3 style={{ margin: 0 }}>{hospital.name}</h3>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0' }}>{hospital.vicinity}</p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{
                                        backgroundColor: '#f1f5f9', color: 'var(--text-secondary)',
                                        fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px'
                                    }}>
                                        Nearby
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                    {hospital.distance ? `${hospital.distance.toFixed(1)} km` : ''}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-primary" style={{ padding: '0.5rem' }} title="View on Map" onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${hospital.geometry.location.lat}&mlon=${hospital.geometry.location.lng}#map=16/${hospital.geometry.location.lat}/${hospital.geometry.location.lng}`, '_blank')}>
                                        <Navigation size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ height: 'fit-content', padding: 0, overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#e5e7eb', height: '400px', width: '100%', position: 'relative' }}>
                    {/* Embedded OpenStreetMap Iframe centered on the user's location */}
                    <iframe
                        title="OpenStreetMap"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight="0"
                        marginWidth="0"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.lng - 0.05}%2C${userLocation.lat - 0.05}%2C${userLocation.lng + 0.05}%2C${userLocation.lat + 0.05}&layer=mapnik&marker=${userLocation.lat}%2C${userLocation.lng}`}
                        style={{ border: 'none', position: 'absolute', top: 0, left: 0 }}
                    ></iframe>
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
