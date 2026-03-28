const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
    },
    securityQuestion: {
        type: String,
        required: true
    },
    securityAnswer: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String
    },
    tokenExpiry: {
        type: Date
    },
    age: {
        type: Number
    },
    gender: {
        type: String
    },
    history: {
        type: Boolean,
        default: false
    },
    weight: {
        type: Number
    },
    height: {
        type: Number
    },
    bloodGroup: {
        type: String
    },
    medicalHistory: {
        type: String
    },
    allergies: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
