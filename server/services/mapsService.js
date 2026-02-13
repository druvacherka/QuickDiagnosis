const axios = require('axios');

const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

/**
 * Deduplicates an array of places based on place_id and fuzzy matching of name/address.
 * @param {Array} places 
 * @returns {Array} unique places
 */
const deduplicatePlaces = (places) => {
    const seenPlaceIds = new Set();
    const seenNameAddress = new Set();
    const uniquePlaces = [];

    for (const place of places) {
        // 1. Check place_id
        if (seenPlaceIds.has(place.place_id)) continue;
        seenPlaceIds.add(place.place_id);

        // 2. Check name + address combination (simple fuzzy match key)
        // Normalize: remove spaces, lowercase
        const name = (place.name || '').toLowerCase().replace(/\s/g, '');
        const address = (place.vicinity || '').toLowerCase().replace(/\s/g, '');
        const key = `${name}|${address}`;

        if (seenNameAddress.has(key)) continue;
        seenNameAddress.add(key);

        uniquePlaces.push(place);
    }

    return uniquePlaces;
};

const getNearbyPlaces = async (lat, lng, type = 'hospital', apiKey) => {
    try {
        // Fetch hospitals/doctors. 'type' can be 'hospital' or 'doctor' (mapped to 'doctor' in API? actually 'doctor' is a type).
        const radius = 5000; // 5km
        const response = await axios.get(GOOGLE_PLACES_API_URL, {
            params: {
                location: `${lat},${lng}`,
                radius: radius,
                type: type,
                key: apiKey
            }
        });

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
            console.error('Google Places API Error:', response.data);
            throw new Error(response.data.error_message || 'Failed to fetch places');
        }

        const results = response.data.results || [];
        const cleanResults = deduplicatePlaces(results);

        // Sort by distance (geometry calculation roughly, or let API do it with rankby=distance but that ignores radius)
        // For now, we trust the API or simple sort if we had exact coords, but the API search nearby typically returns roughly by prominence usually unless specified.
        // User requested "Sort results strictly by distance".
        // 'rankby=distance' requires 'name' or 'type' and NO 'radius'.

        // Let's do a second call if strict distance is critical, OR just compute distance from lat/lng for these results.
        // Computing distance locally is safer and preserves the radius filter.

        cleanResults.forEach(place => {
            const pLat = place.geometry.location.lat;
            const pLng = place.geometry.location.lng;
            place.distance = getDistanceFromLatLonInKm(lat, lng, pLat, pLng);
        });

        cleanResults.sort((a, b) => a.distance - b.distance);

        return cleanResults;

    } catch (error) {
        console.error('Error in getNearbyPlaces:', error.message);
        throw error;
    }
};

const getCoordinates = async (address, apiKey) => {
    try {
        const response = await axios.get(GOOGLE_GEOCODING_API_URL, {
            params: {
                address: address,
                key: apiKey
            }
        });

        if (response.data.status !== 'OK') {
            throw new Error(response.data.error_message || 'Failed to geocode address');
        }

        const location = response.data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
    } catch (error) {
        console.error('Error in getCoordinates:', error.message);
        throw error;
    }
};

// Haversine formula for distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

module.exports = {
    getNearbyPlaces,
    getCoordinates
};
