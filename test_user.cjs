const User = require('./server/models/User');

const runTest = async () => {
    try {
        console.log("Testing User.create...");
        const user = await User.create({
            name: "Test CJS",
            email: "cjs@example.com",
            password: "hashedpassword"
        });
        console.log("✅ User created:", user);
    } catch (error) {
        console.log("❌ Test Failed (Log):", error); // simplified log
    }
};

runTest();
