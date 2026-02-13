import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const predictDisease = async (symptoms) => {
    try {
        const response = await api.post('/predict', { symptoms });
        return response.data;
    } catch (error) {
        console.error('Prediction API Error:', error);
        throw error;
    }
};

export const getNearbyPlaces = async (lat, lng, type = 'hospital') => {
    try {
        const response = await api.post('/nearby', { lat, lng, type });
        return response.data;
    } catch (error) {
        console.error('Nearby API Error:', error);
        throw error;
    }
};

export const getCoordinates = async (address) => {
    try {
        const response = await api.post('/geocode', { address });
        return response.data;
    } catch (error) {
        console.error('Geocode API Error:', error);
        throw error;
    }
};

export const getSymptoms = async () => {
    try {
        const response = await api.get('/symptoms');
        return response.data;
    } catch (error) {
        console.error('Get Symptoms API Error:', error);
        throw error;
    }
};

export const registerUser = async (userData) => {
    try {
        const response = await api.post('/auth/register', userData);
        return response.data;
    } catch (error) {
        console.error('Registration API Error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    } catch (error) {
        console.error('Login API Error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

export default api;
