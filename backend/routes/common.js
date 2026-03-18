const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const User = require("../models/User");
const Event = require("../models/Event");

// @route   GET /api/common/profile/:id
// @desc    Get any user's public profile info
router.get("/profile/:id", authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password -otp -otpExpires")
            .populate('followers', 'name profilePic role')
            .populate('following', 'name profilePic role');
            
        if (!user) return res.status(404).json({ message: "User not found" });
        
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/common/college-events/:id
// @desc    Get events for a specific college
router.get("/college-events/:id", authenticate, async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.params.id }).sort({ startDate: 1 });
        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
