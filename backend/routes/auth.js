const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// @route   POST /api/auth/register
// @desc    Register a new user (Student or College)
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "email and password are required" });
        }

        const emailNormalized = email.toLowerCase().trim();

        let user = await User.findOne({ email: emailNormalized });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }
        user = new User();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.name = name;
        user.email = emailNormalized;
        user.password = hashedPassword;
        user.role = role || "student";
        user.isVerified = true; // Auto-verify

        await user.save();
        console.log("User registered successfully:", emailNormalized);

        const payload = {
            id: user.id,
            role: user.role
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.status(200).json({ 
                message: "Registration successful", 
                token, 
                user: { id: user.id, name: user.name, role: user.role } 
            });
        });

    } catch (err) {
        console.error("Registration error:", err.message);
        res.status(500).send("Server error");
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post("/login", async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: "Identifier and password are required" });
        }

        const idNormalized = identifier.toLowerCase().trim();

        let user = await User.findOne({
            $or: [{ email: idNormalized }, { mobile: idNormalized }]
        });
        
        if (!user) {
            console.log("Login failed: User not found for identifier:", idNormalized);
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Login failed: Password mismatch for user:", user.email);
            return res.status(400).json({ message: "Invalid Credentials" });
        }


        const payload = {
            id: user.id,
            role: user.role
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
        });

    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP & get token
router.post("/verify-otp", async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        if (!identifier || !otp) {
            return res.status(400).json({ message: "Identifier and OTP are required" });
        }

        const idNormalized = identifier.toLowerCase().trim();

        let user = await User.findOne({
            $or: [{ email: idNormalized }, { mobile: idNormalized }]
        });
        if (!user) {
            console.log("OTP verification failed: User not found for identifier:", idNormalized);
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Clear OTP and set verified
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const payload = {
            id: user.id,
            role: user.role
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});
