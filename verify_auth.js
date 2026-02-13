import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const testUser = {
    name: 'Test Verifier',
    email: `test${Date.now()}@example.com`,
    password: 'password123'
};

const runVerification = async () => {
    try {
        console.log('1. Testing Registration...');
        const regRes = await axios.post(`${API_URL}/register`, testUser);
        console.log('✅ Registration Successful:', regRes.data);

        console.log('\n2. Testing Login...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ Login Successful:', loginRes.data);

        if (loginRes.data.token) {
            console.log('✅ Verification passed: Token received');
        } else {
            console.error('❌ Verification failed: No token received');
        }

    } catch (error) {
        console.error('❌ Verification Failed:', JSON.stringify(error.response ? error.response.data : error.message, null, 2));
    }
};

runVerification();
