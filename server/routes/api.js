const express = require('express');
const router = express.Router();
const mlService = require('../services/mlService');
const mapsService = require('../services/mapsService');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get user diagnosis history
// @route   GET /api/history
// @access  Private
router.get('/history', protect, async (req, res) => {
    try {
        res.json(req.user.history);
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

        const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            timestamp: new Date().toLocaleString(),
            data: prediction
        };

        // Add to the beginning of the history
        req.user.history = [newEntry, ...req.user.history].slice(0, 50);
        await req.user.save();

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
        req.user.history = [];
        await req.user.save();
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

// POST /api/nearby
router.post('/nearby', async (req, res) => {
    try {
        const { lat, lng, type } = req.body;
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            console.error('GOOGLE_MAPS_API_KEY is not set.');
            return res.status(500).json({ error: 'Server configuration error.' });
        }

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude (lat) and Longitude (lng) are required.' });
        }

        // Default to 'hospital' if type not provided
        const searchType = type || 'hospital';
        const results = await mapsService.getNearbyPlaces(lat, lng, searchType, apiKey);

        res.json(results);

    } catch (error) {
        console.error('Nearby search error:', error);
        res.status(500).json({ error: 'Failed to fetch nearby places.' });
    }
});

// POST /api/geocode
router.post('/geocode', async (req, res) => {
    try {
        const { address } = req.body;
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            console.error('GOOGLE_MAPS_API_KEY is not set.');
            return res.status(500).json({ error: 'Server configuration error.' });
        }

        if (!address) {
            return res.status(400).json({ error: 'Address is required.' });
        }

        const coordinates = await mapsService.getCoordinates(address, apiKey);
        res.json(coordinates);

    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({ error: 'Failed to geocode address.' });
    }
});

module.exports = router;
