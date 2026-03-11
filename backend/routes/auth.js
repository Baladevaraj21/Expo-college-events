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

        let user = await User.findOne({ email });
        if (user) {
            if (user.isVerified) {
                return res.status(400).json({ message: "User already exists" });
            }
            // User exists but unverified, update details and resend OTP
        } else {
            user = new User();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.name = name;
        user.email = email;
        user.password = hashedPassword;
        user.role = role || "student";
        user.isVerified = false;

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;

        await user.save();

        // Send OTP via email
        const sendEmail = require("../utils/sendEmail");
        await sendEmail({
            to: user.email,
            subject: "CampusConnect - Account Verification",
            text: `Your OTP for account creation is: ${otp}. It is valid for 10 minutes.`,
            html: `<p>Your OTP for account creation is: <strong style="font-size: 24px;">${otp}</strong>. It is valid for 10 minutes.</p>`
        });

        res.status(200).json({ message: "OTP sent to email", requireOtp: true, email: user.email });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post("/login", async (req, res) => {
    try {
        const { identifier, password } = req.body;

        let user = await User.findOne({
            $or: [{ email: identifier }, { mobile: identifier }]
        });
        if (!user) {
            console.log("Login failed: User not found for identifier:", identifier);
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Login failed: Password mismatch for user:", user.email);
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        // BACKWARD COMPATIBILITY: If isVerified is null/undefined, treat as true
        if (user.isVerified === false) {
            console.log("Login failed: User unverified:", user.email);
            return res.status(400).json({ message: "Please verify your account first." });
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
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP & get token
router.post("/verify-otp", async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        let user = await User.findOne({
            $or: [{ email: identifier }, { mobile: identifier }]
        });
        if (!user) {
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
