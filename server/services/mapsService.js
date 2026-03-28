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
        const specialistToSearch = getSpecialistForDisease(disease);
        const radius = 5000; // 5km radius to prevent timeouts

        // OpenStreetMap Overpass search - optimized for speed
        const query = `
            [out:json][timeout:15];
            (
              node["amenity"="hospital"](around:${radius},${lat},${lng});
              way["amenity"="hospital"](around:${radius},${lat},${lng});
              node["amenity"="clinic"](around:${radius},${lat},${lng});
              way["amenity"="clinic"](around:${radius},${lat},${lng});
            );
            out center 20;
        `;

        let response;
        try {
            response = await axios.post(OVERPASS_URL, query, {
                headers: { 
                    'Content-Type': 'text/plain',
                    'User-Agent': 'QuickDiagnosis/1.0 (Contact: quickdiagnosisservice@gmail.com)'
                },
                timeout: 8000
            });
        } catch (primaryErr) {
            console.warn("Primary Overpass failed, trying mirror...", primaryErr.message);
            try {
                response = await axios.post(OVERPASS_MIRROR, query, {
                    headers: { 
                        'Content-Type': 'text/plain',
                        'User-Agent': 'QuickDiagnosis/1.0 (Contact: quickdiagnosisservice@gmail.com)'
                    },
                    timeout: 8000
                });
            } catch (mirrorErr) {
                console.warn("Overpass mirror also failed. Falling back to rock-solid Nominatim API...", mirrorErr.message);
                const nomResponse = await axios.get(NOMINATIM_URL, {
                    params: { q: 'hospital', format: 'json', lat, lon: lng, limit: 15 },
                    headers: { 'User-Agent': 'QuickDiagnosis/1.0 (Contact: quickdiagnosisservice@gmail.com)' },
                    timeout: 8000
                });
                
                // Mock the Overpass response structure so downstream code still works perfectly
                response = {
                    data: {
                        elements: nomResponse.data.map(el => ({
                            id: el.place_id,
                            center: { lat: parseFloat(el.lat), lon: parseFloat(el.lon) },
                            tags: {
                                name: el.name || 'Medical Facility',
                                'addr:street': el.display_name.split(',')[0] || ''
                            }
                        }))
                    }
                };
            }
        }

        const elements = response.data.elements || [];

        let results = elements.map(el => {
            const loc = el.center || el;
            return {
                id: el.id,
                name: el.tags?.name || 'Medical Facility',
                vicinity: el.tags?.['addr:street'] || el.tags?.['addr:city'] || 'Nearby Area',
                geometry: { location: { lat: loc.lat, lng: loc.lon } },
                distance: getDistanceFromLatLonInKm(lat, lng, loc.lat, loc.lon)
            };
        });

        // Clean any potential duplicate places
        let cleanResults = deduplicatePlaces(results);
        let originalResults = [...cleanResults];

        if (disease) {
            cleanResults = await filterHospitalsWithChatGPT(cleanResults, disease, specialistToSearch);
        }

        let isFallback = false;
        if (cleanResults.length === 0 && disease) {
            cleanResults = originalResults;
            isFallback = true;
        }

        // Sort by closest distance
        cleanResults.sort((a, b) => a.distance - b.distance);

        const top5Hospitals = cleanResults.slice(0, 5);

        return {
            disease: disease || 'General Inquiry',
            specialist: specialistToSearch,
            hospitals: top5Hospitals,
            fallbackMessage: isFallback ? `No specialized ${specialistToSearch} facilities found nearby. Showing closest general hospitals.` : null
        };

    } catch (error) {
        console.error('Error in Overpass getNearbyPlaces:', error.message);
        return {
            error: "Failed to fetch nearby hospitals.",
            disease: disease || 'General Inquiry',
            specialist: getSpecialistForDisease(disease),
            hospitals: []
        };
    }
};

/**
 * Geocodes an address into latitude and longitude using Nominatim
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
                'User-Agent': 'QuickDiagnosis/1.0'
            }
        });

        if (!response.data || response.data.length === 0) {
            throw new Error('Address not found via Nominatim');
        }

        const result = response.data[0];
        return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        };
    } catch (error) {
        console.error('Error in Nominatim getCoordinates:', error.message);
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
