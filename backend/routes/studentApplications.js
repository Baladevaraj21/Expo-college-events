const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authenticate, authorize } = require("../middleware/auth");
const User = require("../models/User");
const Event = require("../models/Event");
const Application = require("../models/Application");

// Context: Student protected routes
router.use(authenticate, authorize("student"));

// @route   GET /api/student/applications
// @desc    Get all applications applied by the student
router.get("/applications", async (req, res) => {
    try {
        const applications = await Application.find({ student: req.user.id })
            .populate("event", "title category startDate startTime endTime address entryFee")
            .sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   PUT /api/student/applications/certificate
// @desc    Upload certificate URL for confirmed application
router.put("/applications/certificate", async (req, res) => {
    try {
        const { applicationId, certificateUrl } = req.body;

        const application = await Application.findOneAndUpdate(
            { _id: applicationId, student: req.user.id, status: "confirmed" },
            { certificateUrl },
            { new: true }
        );

        if (!application) return res.status(404).json({ message: "Application not found or not confirmed" });

        res.json(application);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;
