const User = require('./server/models/User');

const runTest = async () => {
    try {
        console.log("Testing User.create...");
        const user = await User.create({
            name: "Test Model",
            email: "modeltest@example.com",
            password: "hashedpassword"
        });
        console.log("✅ User created:", user);

        console.log("Testing User.findOne...");
        const found = await User.findOne({ email: "modeltest@example.com" });
        console.log("✅ User found:", found);
    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
};

runTest();
