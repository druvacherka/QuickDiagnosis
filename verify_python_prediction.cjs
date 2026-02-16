const mlService = require('./server/services/mlService');
const path = require('path');

async function test() {
    console.log('--- Testing Python Prediction Integration ---');

    // The mlService needs to be "trained" (which just loads the symptoms list right now)
    console.log('Training model (loading symptoms)...');
    try {
        await mlService.trainModel();
        console.log('Model ready.');

        const testSymptoms = ['itching', 'skin_rash', 'nodal_skin_eruptions'];
        console.log('Testing with symptoms:', testSymptoms);

        const result = mlService.predictDisease(testSymptoms);
        console.log('Prediction Result:');
        console.log(JSON.stringify(result, null, 2));

        if (result.predictions && result.predictions.length > 0) {
            console.log('SUCCESS: Prediction returned correctly.');
            if (result.followUp) {
                console.log('Follow-up logic also triggered.');
            }
        } else {
            console.log('FAILURE: No predictions returned.');
        }
    } catch (error) {
        console.error('Test Failed with error:', error);
    }
}

test();
