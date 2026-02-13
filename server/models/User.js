const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { encrypt, decrypt } = require('../services/encryptionService');

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '[]');
}

const generateId = () => {
    return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

class User {
    constructor(data) {
        this.id = data.id || data._id || generateId();
        this._id = this.id; // Alias for Mongoose compatibility
        this.name = data.name;
        // Decrypt email and password when loading into the application
        this.email = decrypt(data.email);
        this.password = decrypt(data.password);
        this.createdAt = data.createdAt || new Date();
    }

    // Helper to get raw data for saving (encrypted)
    toRaw() {
        return {
            id: this.id,
            _id: this._id,
            name: this.name,
            email: encrypt(this.email),
            password: encrypt(this.password),
            createdAt: this.createdAt
        };
    }

    static async findOne({ email }) {
        try {
            const users = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            // Decrypt each user's email to find a match
            const user = users.find(u => decrypt(u.email) === email);
            return user ? new User(user) : null;
        } catch (error) {
            console.error("Error reading users DB:", error);
            return null;
        }
    }

    static async create(userData) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            const users = JSON.parse(data);

            const newUser = new User(userData);
            // Save the encrypted version to the file
            users.push(newUser.toRaw());

            fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));

            return newUser;
        } catch (error) {
            console.error("Error writing to users DB:", error);
            throw error;
        }
    }
}

module.exports = User;
