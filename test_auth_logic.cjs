const User = require('./server/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const runTest = async () => {
    try {
        console.log("1. FindOne...");
        const exists = await User.findOne({ email: "auth_test@example.com" });
        console.log("Exists:", exists);

        console.log("2. Hash...");
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash("password123", salt);
        console.log("Hash generated");

        console.log("3. Create...");
        const user = await User.create({
            name: "Test Auth Logic",
            email: "auth_test@example.com",
            password: hash
        });
        console.log("Created user:", user.email);

        console.log("4. Token...");
        const token = jwt.sign({ id: user._id }, "secret", { expiresIn: '30d' });
        console.log("Token generated");

    } catch (e) {
        console.error("FAIL:", e);
    }
};
runTest();
