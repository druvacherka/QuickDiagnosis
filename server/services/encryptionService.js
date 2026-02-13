const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const DEFAULT_KEY = 'default_32_chars_secret_key_12345';

// Helper to ensure key is 32 bytes
const getKey = () => {
    const key = process.env.ENCRYPTION_KEY || DEFAULT_KEY;
    return crypto.createHash('sha256').update(key).digest();
};

const encrypt = (text) => {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Encryption failed:', error);
        return text;
    }
};

const decrypt = (text) => {
    if (!text || !text.includes(':')) return text;
    try {
        const [ivHex, encryptedText] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        // If decryption fails, it might be plain text from old records
        return text;
    }
};

module.exports = { encrypt, decrypt };
