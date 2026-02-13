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
 * Loads the dataset into memory.
 */
const trainModel = () => {
    return new Promise((resolve, reject) => {
        if (loadModelFromDisk()) {
            resolve();
            return;
        }

        console.log('Loading dataset from:', DATA_PATH);
        trainingData = [];
        symptomsList = new Set();

        const validSymptoms = new Set();
        let headersProcessed = false;

        const stream = fs.createReadStream(DATA_PATH)
            .pipe(csv());

        stream.on('headers', (headers) => {
            if (headersProcessed) return;
            headers.forEach(header => {
                if (header !== 'prognosis' && header.trim() !== '') {
                    validSymptoms.add(header);
                    symptomsList.add(header);
                }
            });
            console.log('Schema detected: ' + validSymptoms.size + ' valid symptoms.');
            headersProcessed = true;
        });

        stream.on('data', (row) => {
            const currentSymptoms = new Set();
            let disease = '';

            for (const [key, value] of Object.entries(row)) {
                if (key === 'prognosis') {
                    disease = value;
                } else if (value === '1' && validSymptoms.has(key)) {
                    currentSymptoms.add(key);
                }
            }

            if (disease && currentSymptoms.size > 0) {
                trainingData.push({
                    disease: disease,
                    symptoms: currentSymptoms
                });
            }
        })
            .on('end', () => {
                console.log('Dataset loaded. Indexed ' + trainingData.length + ' records.');
                isTrained = true;
                saveModelToDisk();
                resolve();
            })
            .on('error', (err) => {
                reject(err);
            });
    });
};

/**
 * Predicts disease based on symptom similarity.
 * Uses Jaccard Similarity and frequency modulation.
 */
const predictDisease = (userSymptoms) => {
    if (!isTrained) throw new Error('Model not loaded');

    const inputSymptoms = new Set(userSymptoms);
    const diseaseScores = new Map(); // disease -> accumlated score
    const diseaseCounts = new Map(); // disease -> count of matching records

    // COMPARE INPUT AGAINST ALL RECORDS
    trainingData.forEach(record => {
        // Count shared symptoms
        let matches = 0;
        record.symptoms.forEach(s => {
            if (inputSymptoms.has(s)) matches++;
        });

        if (matches > 0) {
            // Jaccard Index: matches / (len(A) + len(B) - matches)
            const union = record.symptoms.size + inputSymptoms.size - matches;
            const jaccard = matches / union;

            // Recall: How many of *my* symptoms are explained by this disease?
            // (matches / len(Input))
            const recall = matches / inputSymptoms.size;

            // Precision: How many of *the disease's* symptoms do I actually have?
            // (matches / len(Disease))
            const precision = matches / record.symptoms.size;

            // Balanced Score:
            const score = (recall * 0.5) + (precision * 0.5);

            const current = diseaseScores.get(record.disease) || 0;
            // Keep the maximum score found for this disease across multiple records
            if (score > current) {
                diseaseScores.set(record.disease, score);
            }
        }
    });

    // Format Results
    const predictions = [];
    diseaseScores.forEach((score, disease) => {
        predictions.push({
            disease: disease,
            score: score
        });
    });

    // Sort by score descending
    predictions.sort((a, b) => b.score - a.score);

    // Limit to Top 3
    const topResults = predictions.slice(0, 3);

    const finalResults = topResults.map(item => {
        // Decrease score by random 5% - 8% as requested
        const penalty = Math.random() * (0.08 - 0.05) + 0.05;
        let p = item.score - penalty;
        if (p < 0) p = 0;
        return {
            disease: item.disease,
            probability: p
        };
    });

    // FOLLOW-UP LOGIC
    // Check if the top candidate needs clarification
    let followUp = null;
    if (finalResults.length > 0) {
        let involvedDiseases = new Set();
        let potentialMissing = new Set();

        // Check top 5 results to see if we have partial matches for multiple diseases
        for (const result of finalResults.slice(0, 5)) {
            const diseaseName = result.disease;

            // Find the best matching record for this specific disease
            let bestRecord = null;
            let maxMatches = -1;

            for (const record of trainingData) {
                if (record.disease === diseaseName) {
                    let m = 0;
                    record.symptoms.forEach(s => {
                        if (inputSymptoms.has(s)) m++;
                    });

                    if (m > maxMatches) {
                        maxMatches = m;
                        bestRecord = record;
                    }
                }
            }

            if (bestRecord) {
                const totalSymptoms = bestRecord.symptoms.size;
                const matchRatio = maxMatches / totalSymptoms;

                // User Rule: "if user enters n/2 or more... ask follow up"
                // So if >= 50% match, we consider it a candidate for questioning
                if (matchRatio >= 0.5 && matchRatio < 1.0) {
                    bestRecord.symptoms.forEach(s => {
                        if (!inputSymptoms.has(s)) {
                            potentialMissing.add(s);
                        }
                    });
                    involvedDiseases.add(diseaseName);
                }
            }
        }

        if (potentialMissing.size > 0) {
            const uniqueMissing = Array.from(potentialMissing);
            const diseasesStr = Array.from(involvedDiseases).join(', ');

            followUp = {
                disease: diseasesStr,
                missingSymptoms: uniqueMissing,
                question: `Patients with ${diseasesStr} often experience these symptoms.`
            };
        }
    }

    // Return object wrapper
    const response = {
        predictions: finalResults,
        followUp: followUp
    };

    if (finalResults.length > 0) {
        console.log('Prediction: ' + finalResults[0].disease + (followUp ? ' (Follow-up required)' : ''));
    }

    return response;
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
