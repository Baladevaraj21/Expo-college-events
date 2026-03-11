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
    upload.fields([{ name: "idCardFront", maxCount: 1 }, { name: "idCardBack", maxCount: 1 }, { name: "profilePic", maxCount: 1 }]),
    async (req, res) => {
        try {
            const { college, department, year, place, age, gender, collegeAddress, mobile } = req.body;
            const updateFields = { college, department, year, place, age, gender, collegeAddress, mobile };

            if (req.files) {
                if (req.files.idCardFront) updateFields.idCardFront = req.files.idCardFront[0].path;
                if (req.files.idCardBack) updateFields.idCardBack = req.files.idCardBack[0].path;
                if (req.files.profilePic) updateFields.profilePic = req.files.profilePic[0].path;
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

// @route   GET /api/student/events-by-category/:category
// @desc    Get events by category, grouped by college
router.get("/events-by-category/:category", authenticate, authorize("student"), async (req, res) => {
    try {
        const { category } = req.params;
        const events = await Event.find({ category })
            .populate("organizer", "name")
            .sort({ startDate: 1 });

        // Group events by college name
        const collegeMap = {};
        events.forEach(event => {
            const collegeName = event.collegeName || event.organizer?.name || "Unknown College";
            if (!collegeMap[collegeName]) {
                collegeMap[collegeName] = [];
            }
            collegeMap[collegeName].push(event);
        });

        const result = Object.entries(collegeMap).map(([collegeName, events]) => ({
            collegeName,
            eventCount: events.length,
            events
        }));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/student/applications
// @desc    Apply to event
router.post("/applications", authenticate, authorize("student"), async (req, res) => {
    try {
        const { eventId, studentDetails } = req.body;

        let existing = await Application.findOne({ event: eventId, student: req.user.id });
        if (existing) return res.status(400).json({ message: "Already applied" });

        // Update student profile if details are provided
        if (studentDetails) {
            await User.findByIdAndUpdate(
                req.user.id,
                { $set: studentDetails },
                { new: true }
            );
        }

        const application = new Application({
            event: eventId,
            student: req.user.id,
            status: "applied"
        });
        await application.save();

        // Send confirmation email
        try {
            const user = await User.findById(req.user.id);
            const event = await Event.findById(eventId).populate('organizer', 'name');
            const collegeName = event.collegeName || event.organizer?.name || "the college";
            const sendEmail = require("../utils/sendEmail");

            await sendEmail({
                to: user.email,
                subject: `Application Confirmation - ${event.title}`,
                text: `Dear ${user.name},\n\nYou have successfully applied for the event "${event.title}" organized by ${collegeName}.\n\nDate: ${new Date(event.startDate).toLocaleDateString()}\nLocation: ${event.address}\n\nGood luck!`,
                html: `<p>Dear <strong>${user.name}</strong>,</p><p>You have successfully applied for the event <strong>"${event.title}"</strong> organized by ${collegeName}.</p><p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()}<br><strong>Location:</strong> ${event.address}</p><p>Good luck!</p>`
            });
        } catch (emailErr) {
            console.error("Error sending application confirmation email:", emailErr);
            // Don't fail the application request if email fails
        }

        res.json(application);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/student/feedback
// @desc    Submit feedback for a finished event
router.post("/feedback", authenticate, authorize("student"), async (req, res) => {
    try {
        const { eventId, rating, comment } = req.body;

        // Check event exists and has ended
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        const now = new Date();
        const eventEndDate = new Date(event.endDate);
        if (now < eventEndDate) {
            return res.status(400).json({ message: "Feedback can only be submitted after the event has ended" });
        }

        // Check student applied to this event
        const application = await Application.findOne({ event: eventId, student: req.user.id });
        if (!application) {
            return res.status(400).json({ message: "You can only give feedback for events you applied to" });
        }

        // Check if already submitted feedback
        const Feedback = require("../models/Feedback");
        const existing = await Feedback.findOne({ event: eventId, student: req.user.id });
        if (existing) return res.status(400).json({ message: "You have already submitted feedback for this event" });

        const feedback = new Feedback({
            student: req.user.id,
            event: eventId,
            rating,
            comment
        });
        await feedback.save();
        res.json(feedback);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/student/feedback/:eventId
// @desc    Get feedbacks for an event
router.get("/feedback/:eventId", authenticate, authorize("student"), async (req, res) => {
    try {
        const Feedback = require("../models/Feedback");
        const feedbacks = await Feedback.find({ event: req.params.eventId })
            .populate("student", "name college")
            .sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/student/my-applications
// @desc    Get student's own applications with event details
router.get("/my-applications", authenticate, authorize("student"), async (req, res) => {
    try {
        const applications = await Application.find({ student: req.user.id })
            .populate("event")
            .sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;
