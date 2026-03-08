const axios = require('axios');
const diseaseSpecialtyMap = require('../config/specialties');

// OpenStreetMap API URLs
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_MIRROR = 'https://overpass.kumi.systems/api/interpreter';

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

const getSpecialistForDisease = (disease) => {
    if (!disease) return 'General Physician';
    return diseaseSpecialtyMap[disease] || 'General Physician';
};

const filterHospitalsWithChatGPT = async (hospitals, disease, specialist) => {
    if (!process.env.OPENAI_API_KEY || !disease || hospitals.length === 0) return hospitals;
    try {
        const hospitalNames = hospitals.map((h, i) => `${i + 1}. ${h.name} (${h.vicinity})`).join('\n');
        const prompt = `
        I have a list of local medical facilities. The patient is diagnosed with "${disease}" and needs a "${specialist}".
        Please vigorously filter this list and return ONLY the numbers of the facilities that genuinely offer this specialized service or have this specialist present. Be strictly accurate.
        - If it is a major general hospital, it likely has the specialist, so INCLUDE it.
        - If it's a small clinic with an unrelated name (e.g. Dental clinic for a Heart condition), EXCLUDE it.

        List of facilities:
        ${hospitalNames}

        Return your answer ONLY as a JSON array of integers (the facility numbers). Example: [1, 3]
        `;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0].message.content;
        const validIndices = JSON.parse(content.match(/\[(.*?)\]/)[0]);
        return hospitals.filter((_, idx) => validIndices.includes(idx + 1));

    } catch (error) {
        console.error("ChatGPT Filter Error:", error.message);
        return hospitals;
    }
};

const getNearbyPlaces = async (lat, lng, type = 'hospital', apiKey, specialty = '', disease = '') => {
    try {
        const activeApiKey = process.env.GEOAPIFY_API_KEY;
        const specialistToSearch = getSpecialistForDisease(disease);

        if (!activeApiKey) {
            console.error("Geoapify API Key is missing. Returning empty result.");
            return { disease: disease || 'Unknown', specialist: specialistToSearch, hospitals: [] };
        }

        const radius = 10000; // 10km radius

        // Fetch all generic and specialized healthcare centers from Geoapify
        const url = `https://api.geoapify.com/v2/places?categories=healthcare.hospital,healthcare.clinic_or_praxis&filter=circle:${lng},${lat},${radius}&limit=30&apiKey=${activeApiKey}`;

        const response = await axios.get(url, { timeout: 10000 });
        const features = response.data.features || [];

        let results = features.map(f => {
            const p = f.properties;
            return {
                id: p.place_id,
                name: p.name || 'Medical Facility',
                vicinity: p.address_line2 || p.street || 'Nearby Area',
                geometry: { location: { lat: p.lat, lng: p.lon } },
                distance: p.distance ? (p.distance / 1000) : getDistanceFromLatLonInKm(lat, lng, p.lat, p.lon)
            };
        });

        // Clean any potential duplicate places from the Geoapify result
        let cleanResults = deduplicatePlaces(results);

        if (disease) {
            // Guarantee specialist screening using our strict AI checker
            cleanResults = await filterHospitalsWithChatGPT(cleanResults, disease, specialistToSearch);
        }

        // Sort by closest distance
        cleanResults.sort((a, b) => a.distance - b.distance);

        const top5Hospitals = cleanResults.slice(0, 5);

        return {
            disease: disease || 'General Inquiry',
            specialist: specialistToSearch,
            hospitals: top5Hospitals
        };

    } catch (error) {
        console.error('Error in Geoapify getNearbyPlaces:', error.response ? error.response.data : error.message);
        return {
            error: "Failed to fetch nearby hospitals from Geoapify.",
            disease: disease || 'General Inquiry',
            specialist: getSpecialistForDisease(disease),
            hospitals: []
        };
    }
};

/**
 * Geocodes an address into latitude and longitude using Geoapify
 */
const getCoordinates = async (address, unused_apiKey) => {
    try {
        const activeApiKey = process.env.GEOAPIFY_API_KEY;
        if (!activeApiKey) throw new Error("Missing Geoapify API Key for Geocoding");

        const response = await axios.get(`https://api.geoapify.com/v1/geocode/search`, {
            params: {
                text: address,
                format: 'json',
                limit: 1,
                apiKey: activeApiKey
            }
        });

        if (!response.data || !response.data.results || response.data.results.length === 0) {
            throw new Error('Address not found via Geoapify');
        }

        const result = response.data.results[0];
        return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        };
    } catch (error) {
        console.error('Error in Geoapify getCoordinates:', error.message);
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
