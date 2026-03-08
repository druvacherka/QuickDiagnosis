const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// We use an "Instance-Based Learning" approach (like KNN) which is 
// superior for high-dimensional sparse data (like symptoms) in JavaScript.
// It is instant, deterministic, and doesn't hang.

let trainingData = []; // Array of { symptoms: Set<string>, disease: string }
let symptomsList = new Set(); // All unique symptoms
let isTrained = false;

const DATA_PATH = path.join(__dirname, '../data/train_disease.csv');
const MODEL_PATH = path.join(__dirname, '../data/model_v2.json');

// Extract symptoms synchronously on startup so the API has them immediately
try {
    const firstLine = fs.readFileSync(DATA_PATH, 'utf8').split('\n')[0];
    const columns = firstLine.split(',').map(c => c.trim()).filter(c => c.length > 0);
    columns.forEach(col => {
        if (col && col !== 'prognosis') {
            symptomsList.add(col);
        }
    });
    console.log(`Extracted ${symptomsList.size} symptoms from CSV.`);
} catch (err) {
    console.error('Failed to extract symptoms from CSV:', err);
}

/**
 * Loads the processed data from disk if available to skip CSV parsing.
 */
const loadModelFromDisk = () => {
    try {
        if (fs.existsSync(MODEL_PATH)) {
            console.log('Found cached data. Loading...');
            const rawData = fs.readFileSync(MODEL_PATH);
            const data = JSON.parse(rawData);

            // Restore Data Structures
            symptomsList = new Set(data.symptomsList);

            // Rehydrate Sets from JSON arrays
            trainingData = data.trainingData.map(item => ({
                disease: item.disease,
                symptoms: new Set(item.symptoms)
            }));

            isTrained = true;
            console.log('Data loaded from disk successfully (Instant).');
            return true;
        }
    } catch (error) {
        console.error('Failed to load saved data:', error);
    }
    return false;
};

/**
 * Saves the processed data to disk.
 */
const saveModelToDisk = () => {
    try {
        // Serialize Sets to Arrays
        const data = {
            symptomsList: Array.from(symptomsList),
            trainingData: trainingData.map(item => ({
                disease: item.disease,
                symptoms: Array.from(item.symptoms)
            }))
        };
        fs.writeFileSync(MODEL_PATH, JSON.stringify(data));
        console.log('Processed data saved to disk for optimizations.');
    } catch (error) {
        console.error('Failed to save data:', error);
    }
};

/**
 * Executes the Python training script to generate the Random Forest model.
 */
const trainModel = () => {
    return new Promise((resolve, reject) => {
        console.log('Starting ML Model Training (Random Forest)...');

        try {
            const pythonProcess = spawnSync('py', [
                path.join(__dirname, 'train.py')
            ]);

            if (pythonProcess.error) {
                console.error('Python training execution error:', pythonProcess.error);
                return reject(new Error('Failed to run Python training script'));
            }

            const stderr = pythonProcess.stderr.toString();
            if (stderr && !stderr.includes('UserWarning') && !stderr.includes('FutureWarning')) {
                console.warn('Python training warnings/errors:', stderr);
            }

            const stdout = pythonProcess.stdout.toString();
            console.log('Python training output:', stdout);

            isTrained = true;
            console.log('Random Forest model trained and saved successfully.');
            resolve();
        } catch (error) {
            console.error('Error during trainModel (Python bridge):', error);
            reject(error);
        }
    });
};

const { spawnSync } = require('child_process');

/**
 * Predicts disease based on symptom similarity.
 * Calls the Python version of the prediction script.
 */
const predictDisease = (userSymptoms) => {
    if (!isTrained) throw new Error('Model not loaded');

    try {
        const pythonProcess = spawnSync('py', [
            path.join(__dirname, 'predict.py'),
            DATA_PATH,
            JSON.stringify(userSymptoms)
        ]);

        if (pythonProcess.error) {
            console.error('Python execution error:', pythonProcess.error);
            throw new Error('Failed to run Python prediction');
        }

        const output = pythonProcess.stdout.toString();
        if (!output) {
            console.error('Python script returned no output');
            console.error('Stderr:', pythonProcess.stderr.toString());
            throw new Error('Prediction script failed');
        }

        return JSON.parse(output);
    } catch (error) {
        console.error('Error in predictDisease (Python bridge):', error);
        throw error;
    }
};

const getSymptoms = () => {
    const list = Array.from(symptomsList).sort();
    console.log('Serving ' + list.length + ' symptoms.');
    return list;
};

module.exports = {
    trainModel,
    predictDisease,
    getSymptoms
};
