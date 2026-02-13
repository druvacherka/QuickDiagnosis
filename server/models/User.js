const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
        this.email = data.email;
        this.password = data.password;
        this.createdAt = data.createdAt || new Date();
    }

    static async findOne({ email }) {
        try {
            const users = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            const user = users.find(u => u.email === email);
            return user ? new User(user) : null;
        } catch (error) {
            console.error("Error reading users DB:", error);
            return null;
        }
    }

    static async create(userData) {
        try {
            console.log("Reading users DB from:", DB_FILE);
            const data = fs.readFileSync(DB_FILE, 'utf8');
            console.log("DB content length:", data.length);
            const users = JSON.parse(data);

            const newUser = new User(userData);
            users.push(newUser);

            console.log("Writing to users DB...");
            fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
            console.log("Write successful");

            return newUser;
        } catch (error) {
            console.error("Error writing to users DB:", error);
            throw error;
        }
    }
}

module.exports = User;
