const mongoose = require('mongoose');

const diagnosisSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    symptoms: {
        type: [String],
        required: true
    },
    result: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
