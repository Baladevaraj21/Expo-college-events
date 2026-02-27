const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const Event = require("../models/Event");
const Application = require("../models/Application");

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
router.post("/events", async (req, res) => {
    try {
        const newEvent = new Event({
            ...req.body,
            organizer: req.user.id
        });
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
            .populate("student", "name email college idCardFront idCardBack")
            .populate("event", "title type")
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

module.exports = router;
