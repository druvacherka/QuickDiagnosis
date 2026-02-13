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
        this.resetToken = data.resetToken ? decrypt(data.resetToken) : null;
        this.resetTokenExpire = data.resetTokenExpire; // Date usually doesn't need AES if not PII
        this.history = data.history ? data.history : []; // History items should be objects
        this.securityQuestion = data.securityQuestion || null;
        this.securityAnswer = data.securityAnswer ? decrypt(data.securityAnswer) : null;
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
            resetToken: this.resetToken ? encrypt(this.resetToken) : null,
            resetTokenExpire: this.resetTokenExpire,
            history: this.history, // History is an array of objects
            securityQuestion: this.securityQuestion, // Question itself is not sensitive
            securityAnswer: this.securityAnswer ? encrypt(this.securityAnswer) : null,
            createdAt: this.createdAt
        };
    }

    static async findById(id) {
        try {
            const users = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            const user = users.find(u => u.id === id);
            return user ? new User(user) : null;
        } catch (error) {
            console.error("Error reading users DB:", error);
            return null;
        }
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

    static async findOneByToken(token) {
        try {
            const users = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            const user = users.find(u => u.resetToken && decrypt(u.resetToken) === token);
            return user ? new User(user) : null;
        } catch (error) {
            console.error("Error finding user by token:", error);
            return null;
        }
    }

    async save() {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            let users = JSON.parse(data);
            const index = users.findIndex(u => u.id === this.id);

            if (index !== -1) {
                users[index] = this.toRaw();
            } else {
                users.push(this.toRaw());
            }

            fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
            return this;
        } catch (error) {
            console.error("Error saving user:", error);
            throw error;
        }
    }

    static async create(userData) {
        const newUser = new User(userData);
        return await newUser.save();
    }
}

module.exports = User;
