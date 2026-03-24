const express = require('express');
const router = express.Router();
const axios = require('axios');
const mlService = require('../services/mlService');
const mapsService = require('../services/mapsService');
const { protect } = require('../middleware/authMiddleware');
const Diagnosis = require('../models/Diagnosis');

// Cache for daily health tip to ensure consistency over 24 hours
let cachedDailyTip = {
    date: null,
    tip: null
};

// @desc    Get user diagnosis history
// @route   GET /api/history
// @access  Private
router.get('/history', protect, async (req, res) => {
    try {
        const diagnoses = await Diagnosis.find({ user_id: req.user._id }).sort({ createdAt: -1 }).limit(50);

        // Map to frontend expected format
        const history = diagnoses.map(d => ({
            id: d._id,
            date: d.createdAt.toLocaleDateString(),
            timestamp: d.createdAt.toLocaleString(),
            data: d.result
        }));

        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Add diagnosis entry to history
// @route   POST /api/history
// @access  Private
router.post('/history', protect, async (req, res) => {
    try {
        const { prediction } = req.body;

        if (!prediction) {
            return res.status(400).json({ message: 'Prediction data required' });
        }

        // prediction might contain multiple predictions or a structured format.
        // If there's a symptoms list, extract it, otherwise empty array.
        const symptomsInput = Array.isArray(req.body.symptoms) ? req.body.symptoms : [];

        const diagnosis = await Diagnosis.create({
            user_id: req.user._id,
            symptoms: symptomsInput,
            result: prediction
        });

        const newEntry = {
            id: diagnosis._id,
            date: diagnosis.createdAt.toLocaleDateString(),
            timestamp: diagnosis.createdAt.toLocaleString(),
            data: diagnosis.result
        };

        res.status(201).json(newEntry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Clear user diagnosis history
// @route   DELETE /api/history
// @access  Private
router.delete('/history', protect, async (req, res) => {
    try {
        await Diagnosis.deleteMany({ user_id: req.user._id });
        res.json({ message: 'History cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/symptoms
router.get('/symptoms', (req, res) => {
    console.log('GET /api/symptoms request received');
    try {
        const symptoms = mlService.getSymptoms();
        console.log(`Returning ${symptoms.length} symptoms`);
        res.json(symptoms);
    } catch (error) {
        console.error('Error fetching symptoms:', error);
        res.status(500).json({ error: 'Failed to fetch symptoms.' });
    }
});

// POST /api/predict
router.post('/predict', async (req, res) => {
    try {
        const { symptoms } = req.body;
        console.log('POST /predict received with symptoms:', symptoms);

        if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({ error: 'Symptoms array is required.' });
        }

        const response = mlService.predictDisease(symptoms);
        console.log(`Generated prediction for ${symptoms.length} symptoms.`);

        // Return object { predictions: [], followUp: {} }
        res.json(response);

    } catch (error) {
        if (error.message === 'Model is not trained yet.') {
            return res.status(503).json({ error: 'System initializing, please try again in a moment.' });
        }
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Internal server error during prediction.' });
    }
});

const diseaseSpecialtyMap = require('../config/specialties');

// POST /api/nearby
router.post('/nearby', async (req, res) => {
    try {
        const { lat, lng, type, disease } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude (lat) and Longitude (lng) are required.' });
        }

        // Map disease to specialty for precision search
        const specialty = disease && diseaseSpecialtyMap[disease] ? diseaseSpecialtyMap[disease] : '';
        console.log(`Searching for ${type} related to ${disease || 'general'} (Specialty: ${specialty || 'None'})`);

        // OSM Service doesn't require an API Key
        const results = await mapsService.getNearbyPlaces(lat, lng, type || 'hospital', null, specialty, disease);

        res.json(results);

    } catch (error) {
        console.error('Nearby search error (OSM):', error);
        res.status(500).json({ error: 'Failed to fetch nearby places.' });
    }
});

// POST /api/geocode
router.post('/geocode', async (req, res) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({ error: 'Address is required.' });
        }

        // OSM Service doesn't require an API Key
        const coordinates = await mapsService.getCoordinates(address, null);
        res.json(coordinates);

    } catch (error) {
        console.error('Geocoding error (OSM):', error);
        res.status(500).json({ error: 'Failed to geocode address.' });
    }
});

// @desc    Get precautions for a specific disease
// @route   GET /api/precautions/:disease
// @access  Public
router.get('/precautions/:disease', async (req, res) => {
    try {
        const { disease } = req.params;

        if (!process.env.OPENAI_API_KEY) {
            // Fallback if no API key
            const precautionsData = require('../data/precautions.json');
            const precautions = precautionsData[disease] || ["Consult a doctor for professional advice."];
            return res.json(precautions);
        }

        const prompt = `Provide exactly 4 detailed medical precautions for a patient diagnosed with "${disease}". Return the answer ONLY as a JSON array of strings. Example: ["Drink plenty of water.", "Rest for 8 hours.", "Avoid cold foods.", "Take prescribed medication."]`;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0].message.content;
        const precautionsArray = JSON.parse(content.substring(content.indexOf('['), content.lastIndexOf(']') + 1));

        res.json(precautionsArray);
    } catch (error) {
        console.error('Error fetching precautions from OpenAI:', error.response ? error.response.data : error.message);
        // Fallback on error
        const precautionsData = require('../data/precautions.json');
        const precautions = precautionsData[req.params.disease] || ["Consult a doctor for professional advice."];
        res.json(precautions);
    }
});

// @desc    Get random health tip
// @route   GET /api/health-tips
// @access  Public
router.get('/health-tips', async (req, res) => {
    try {
        const currentMidnight = new Date();
        currentMidnight.setUTCHours(0, 0, 0, 0);
        const todayStr = currentMidnight.toISOString();

        // Check if we already have a generated tip for today
        if (cachedDailyTip.date === todayStr && cachedDailyTip.tip) {
            return res.json({ tip: cachedDailyTip.tip });
        }

        if (!process.env.OPENAI_API_KEY) {
            // Fallback
            const tips = require('../data/health_tips.json');
            const tipIndex = Math.floor(currentMidnight.getTime() / (1000 * 60 * 60 * 24)) % tips.length;
            return res.json({ tip: tips[tipIndex] });
        }

        const prompt = `Give me a single, highly actionable, and encouraging daily health or wellness tip for today (${todayStr}). Make it one sentence and do not use quotes.`;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const generatedTip = response.data.choices[0].message.content.trim().replace(/^"|"$/g, '');

        // Update Cache
        cachedDailyTip = {
            date: todayStr,
            tip: generatedTip
        };

        res.json({ tip: generatedTip });
    } catch (error) {
        console.error('Error fetching health tips from OpenAI:', error.response ? error.response.data : error.message);

        // Fallback
        const tips = require('../data/health_tips.json');
        const tipIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % tips.length;
        res.status(500).json({ tip: tips[tipIndex] });
    }
});

module.exports = router;
