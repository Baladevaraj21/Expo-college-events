const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authenticate, authorize } = require("../middleware/auth");
const Event = require("../models/Event");
const Application = require("../models/Application");
const User = require("../models/User");

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, req.user.id + "-qr-" + Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });


// Context: All routes are protected and require "college" role
router.use(authenticate, authorize("college"));

// @route   GET /api/college/events
// @desc    Get college's events
router.get("/events", async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user.id }).sort({ createdAt: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/college/events
// @desc    Create new event
router.post("/events", upload.single("qrCode"), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const eventData = {
            ...req.body,
            organizer: req.user.id,
            collegeName: user.name
        };

        if (req.file) {
            eventData.qrCode = req.file.path.replace(/\\/g, "/"); // normalize path separators
        }

        const newEvent = new Event(eventData);
        await newEvent.save();
        res.json(newEvent);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/college/applications
// @desc    Get applications for college's events
router.get("/applications", async (req, res) => {
    try {
        // Find all events created by this college
        const events = await Event.find({ organizer: req.user.id }).select("_id");
        const eventIds = events.map(e => e._id);

        const applications = await Application.find({ event: { $in: eventIds } })
            .populate("student", "name email college department year mobile place age gender collegeAddress profilePic idCardFront idCardBack")
            .populate("event", "title type category")
            .sort({ createdAt: -1 });

        res.json(applications);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   PATCH /api/college/applications/:id
// @desc    Update application status
router.patch("/applications/:id", async (req, res) => {
    try {
        const { status } = req.body;
        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(application);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/college/profile
// @desc    Get college profile
router.get("/profile", async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   PUT /api/college/profile
// @desc    Update college profile (name, address, mobile, profilePic)
router.put(
    "/profile",
    upload.single("profilePic"),
    async (req, res) => {
        try {
            const { name, collegeAddress, mobile } = req.body;
            const updateFields = {};

            if (name !== undefined) updateFields.name = name;
            if (collegeAddress !== undefined) updateFields.collegeAddress = collegeAddress;
            if (mobile !== undefined) updateFields.mobile = mobile;

            if (req.file) {
                updateFields.profilePic = req.file.path.replace(/\\/g, "/");
            }

            const user = await User.findByIdAndUpdate(
                req.user.id,
                { $set: updateFields },
                { new: true }
            ).select("-password");

            res.json(user);
        } catch (err) {
            console.error(err);
            res.status(500).send("Server Error");
        }
    }
);

module.exports = router;
