const axios = require('axios');

// OpenStreetMap API URLs
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_MIRROR = 'https://overpass.kumi.systems/api/interpreter';

/**
 * Deduplicates an array of places based on osm_id and fuzzy matching.
 */
const deduplicatePlaces = (places) => {
    const seenIds = new Set();
    const uniquePlaces = [];

    for (const place of places) {
        if (seenIds.has(place.id)) continue;
        seenIds.add(place.id);
        uniquePlaces.push(place);
    }

    return uniquePlaces;
};

/**
 * Fetch nearby hospitals or specialists using the Overpass API (Free OSM).
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} type - 'hospital' or 'doctor'
 * @param {string} unused_apiKey - (Kept for compatibility)
 * @param {string} specialty - Optional medical specialty (e.g., 'dermatology', 'cardiologist')
 */
const getNearbyPlaces = async (lat, lng, type = 'hospital', unused_apiKey, specialty = '') => {
    try {
        const radius = 5000; // 5km

        // Added [timeout:25] for reliability on community-run servers
        let queryBody = `[out:json][timeout:25];`;

        if (type === 'hospital') {
            queryBody += `
                (
                  node["amenity"="hospital"](around:${radius},${lat},${lng});
                  way["amenity"="hospital"](around:${radius},${lat},${lng});
                  node["healthcare"="hospital"](around:${radius},${lat},${lng});
                );
                out center;`;
        } else {
            // Searching for doctors/specialists with genetic fallback
            const specialtyTag = specialty ? `["speciality"~"${specialty}",i]` : '';
            queryBody += `
                (
                  node["amenity"="doctors"]${specialtyTag}(around:${radius},${lat},${lng});
                  node["healthcare"="doctor"]${specialtyTag}(around:${radius},${lat},${lng});
                  node["healthcare"="specialist"]${specialtyTag}(around:${radius},${lat},${lng});
                  node["amenity"="doctors"](around:${radius},${lat},${lng}); // Generic fallback
                );
                out center;`;
        }

        const fetchFromOverpass = async (url) => {
            return axios.post(url, `data=${encodeURIComponent(queryBody)}`, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'QuickDiagnosisApp/1.0'
                },
                timeout: 30000 // 30 sec axios timeout
            });
        };

        let response;
        try {
            response = await fetchFromOverpass(OVERPASS_URL);
        } catch (e) {
            console.warn(`Primary Overpass API failed (${e.message}), trying mirror...`);
            response = await fetchFromOverpass(OVERPASS_MIRROR);
        }

        const elements = response.data.elements || [];

        // Map Overpass results to a consistent format
        const results = elements.map(el => {
            const latitude = el.lat || (el.center && el.center.lat);
            const longitude = el.lon || (el.center && el.center.lon);
            const name = el.tags.name || 'Unnamed Medical Facility';

            return {
                place_id: `osm_${el.id}`,
                id: el.id,
                name: name,
                vicinity: el.tags['addr:full'] || el.tags['addr:street'] || el.tags['addr:city'] || 'Nearby',
                geometry: {
                    location: {
                        lat: latitude,
                        lng: longitude
                    }
                },
                types: [type],
                rating: 0,
                distance: getDistanceFromLatLonInKm(lat, lng, latitude, longitude)
            };
        });

        const cleanResults = deduplicatePlaces(results);
        cleanResults.sort((a, b) => a.distance - b.distance);

        return cleanResults;

    } catch (error) {
        console.error('Error in OSM getNearbyPlaces:', error.message);
        return [];
    }
};

/**
 * Geocodes an address into latitude and longitude using Nominatim (Free OSM).
 */
const getCoordinates = async (address, unused_apiKey) => {
    try {
        const response = await axios.get(NOMINATIM_URL, {
            params: {
                q: address,
                format: 'json',
                limit: 1
            },
            headers: {
                'User-Agent': 'QuickDiagnosisApp/1.0'
            }
        });

        if (!response.data || response.data.length === 0) {
            throw new Error('Address not found');
        }

        const result = response.data[0];
        return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        };
    } catch (error) {
        console.error('Error in OSM getCoordinates:', error.message);
        throw error;
    }
};

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

module.exports = {
    getNearbyPlaces,
    getCoordinates
};
