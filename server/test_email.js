require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

async function testEmail() {
    try {
        console.log('Testing Email with User:', process.env.EMAIL_USER);
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Missing EMAIL credentials in .env');
            return;
        }

        await sendEmail({
            email: process.env.EMAIL_USER,
            subject: 'Test Email Verification',
            html: '<h1>If you receive this, Nodemailer is working perfectly!</h1>'
        });
        console.log('Test email dispatched successfully. Check your inbox!');
    } catch (err) {
        console.error('Nodemailer Error Details:', err.message);
        console.error('Response:', err.response);
    }
}

testEmail();
