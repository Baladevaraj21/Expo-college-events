const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authenticate, authorize } = require("../middleware/auth");
const User = require("../models/User");
const Event = require("../models/Event");
const Application = require("../models/Application");

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, req.user.id + "-" + Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// @route   GET /api/student/profile
// @desc    Get student profile
router.get("/profile", authenticate, authorize("student"), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   PUT /api/student/profile
// @desc    Update student profile and upload ID cards
router.put(
    "/profile",
    authenticate,
    authorize("student"),
    upload.fields([{ name: "idCardFront", maxCount: 1 }, { name: "idCardBack", maxCount: 1 }]),
    async (req, res) => {
        try {
            const { college, department, year, place, age, gender, collegeAddress, mobile } = req.body;
            const updateFields = { college, department, year, place, age, gender, collegeAddress, mobile };

            if (req.files) {
                if (req.files.idCardFront) updateFields.idCardFront = req.files.idCardFront[0].path;
                if (req.files.idCardBack) updateFields.idCardBack = req.files.idCardBack[0].path;
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

// @route   POST /api/student/upload-certificate
// @desc    Upload a certificate (PDF only)
router.post("/upload-certificate", authenticate, authorize("student"), upload.single("certificate"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        if (req.file.mimetype !== "application/pdf") {
            const fs = require('fs');
            fs.unlinkSync(req.file.path); // remove the non-pdf file
            return res.status(400).json({ message: "Only PDF format is allowed" });
        }

        const user = await User.findById(req.user.id);
        user.certificates.push(req.file.path);
        await user.save();

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/student/events
// @desc    Get all events
router.get("/events", authenticate, authorize("student"), async (req, res) => {
    try {
        const events = await Event.find().populate("organizer", "name").sort({ startDate: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/student/applications
// @desc    Apply to event
router.post("/applications", authenticate, authorize("student"), async (req, res) => {
    try {
        const { eventId } = req.body;

        let existing = await Application.findOne({ event: eventId, student: req.user.id });
        if (existing) return res.status(400).json({ message: "Already applied" });

        const application = new Application({
            event: eventId,
            student: req.user.id,
            status: "applied"
        });
        await application.save();

        res.json(application);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;
