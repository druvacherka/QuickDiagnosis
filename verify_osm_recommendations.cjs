const mapsService = require('./server/services/mapsService');

async function verify() {
    console.log('--- Verifying OSM Service (Free Nearby Search) ---');

    try {
        // 1. Test Geocoding
        const address = 'Mumbai, India';
        console.log(`Testing Geocoding for: ${address}...`);
        const coords = await mapsService.getCoordinates(address);
        console.log('Geocoding Result:', coords);

        if (coords.lat && coords.lng) {
            console.log('SUCCESS: Geocoding works via Nominatim.');
        }

        // 2. Test Nearby Search (Hospital)
        console.log('\nTesting Nearby Hospital Search...');
        const hospitals = await mapsService.getNearbyPlaces(coords.lat, coords.lng, 'hospital');
        console.log(`Found ${hospitals.length} hospitals near Mumbai.`);
        if (hospitals.length > 0) {
            console.log('Top Hospital:', hospitals[0].name, '-', hospitals[0].vicinity);
            console.log('SUCCESS: Nearby hospital search works via Overpass.');
        }

        // 3. Test Specialized Search (Dermatologist for Psoriasis)
        console.log('\nTesting Specialized Search (Dermatologist)...');
        const specialists = await mapsService.getNearbyPlaces(coords.lat, coords.lng, 'doctor', null, 'dermatologist');
        console.log(`Found ${specialists.length} dermatologists near Mumbai.`);
        if (specialists.length > 0) {
            console.log('Top Result:', specialists[0].name);
            console.log('SUCCESS: Specialty-aware search works.');
        } else {
            console.log('Note: No dermatologists found specifically, but API responded.');
        }

    } catch (error) {
        console.error('Verification FAILED:', error.message);
    }
}

verify();
