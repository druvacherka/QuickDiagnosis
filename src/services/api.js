import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const predictDisease = async (symptoms, confirmedSymptoms = null) => {
    try {
        const body = { symptoms };
        if (confirmedSymptoms && confirmedSymptoms.length > 0) {
            body.confirmedSymptoms = confirmedSymptoms;
        }
        const response = await api.post('/predict', body);
        return response.data;
    } catch (error) {
        console.error('Prediction API Error:', error);
        throw error;
    }
};

export const getNearbyPlaces = async (lat, lng, type = 'hospital', disease = '') => {
    try {
        const response = await api.post('/nearby', { lat, lng, type, disease });
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

// History API Methods
export const getHistory = async () => {
    try {
        const response = await api.get('/history');
        return response.data;
    } catch (error) {
        console.error('Get History API Error:', error);
        throw error;
    }
};

export const saveToHistory = async (prediction) => {
    try {
        const response = await api.post('/history', { prediction });
        return response.data;
    } catch (error) {
        console.error('Save to History API Error:', error);
        throw error;
    }
};

export const clearHistory = async () => {
    try {
        const response = await api.delete('/history');
        return response.data;
    } catch (error) {
        console.error('Clear History API Error:', error);
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

export const updateProfile = async (profileData) => {
    try {
        const response = await api.put('/auth/profile', profileData);
        return response.data;
    } catch (error) {
        console.error('Update Profile API Error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

export const sendOtp = async (email, name) => {
    try {
        const response = await api.post('/auth/send-otp', { email, name });
        return response.data;
    } catch (error) {
        console.error('Send OTP API Error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

export const verifyOtpInitial = async (email, otp) => {
    try {
        const response = await api.post('/auth/verify-otp-initial', { email, otp });
        return response.data;
    } catch (error) {
        console.error('Verify OTP Initial API Error:', error.response ? error.response.data : error.message);
        throw error;
    }
};

export default api;
