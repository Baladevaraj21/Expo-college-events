const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authenticate, authorize } = require("../middleware/auth");
const User = require("../models/User");
const Event = require("../models/Event");
const Application = require("../models/Application");
const Notification = require("../models/Notification");

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
            const { college, department, year, rollNo, regNo, place, age, gender, collegeAddress, mobile } = req.body;
            const updateFields = { college, department, year, rollNo, regNo, place, age, gender, collegeAddress, mobile };

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

// @route   PUT /api/student/change-username
// @desc    Change student display name
router.put("/change-username", authenticate, authorize("student"), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim().length < 2) return res.status(400).json({ message: "Name must be at least 2 characters." });
        const user = await User.findByIdAndUpdate(req.user.id, { $set: { name: name.trim() } }, { new: true }).select("-password");
        res.json({ message: "Username updated successfully!", user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// @route   PUT /api/student/change-password
// @desc    Change student password
router.put("/change-password", authenticate, authorize("student"), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both fields are required." });
        if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters." });
        const bcrypt = require("bcryptjs");
        const user = await User.findById(req.user.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Current password is incorrect." });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.json({ message: "Password changed successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

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
router.post("/applications", authenticate, authorize("student"), upload.single("paymentScreenshot"), async (req, res) => {
    try {
        const { eventId, name, year, department, collegeName, rollNo, regNo, email, phoneNumber } = req.body;

        let existing = await Application.findOne({ event: eventId, student: req.user.id });
        if (existing) return res.status(400).json({ message: "Already applied" });

        const applicationNumber = "APP" + Date.now() + Math.floor(Math.random() * 1000);

        const applicationData = {
            event: eventId,
            student: req.user.id,
            status: "applied",
            applicationNumber,
            name,
            year,
            department,
            collegeName,
            rollNo,
            regNo,
            email,
            phoneNumber,
            selectedEvents: req.body.selectedEvents ? (typeof req.body.selectedEvents === 'string' ? JSON.parse(req.body.selectedEvents) : req.body.selectedEvents) : []
        };

        if (req.file) {
            applicationData.paymentScreenshot = req.file.path.replace(/\\/g, "/");
        }

        const application = new Application(applicationData);
        await application.save();

        // Notify the college about this new application
        const event = await Event.findById(eventId).populate('organizer', 'name');
        if (event && event.organizer) {
            const notif = new Notification({
                user: event.organizer._id,
                type: "NEW_APPLICATION",
                message: `New application received for ${event.title} from ${name || 'a student'}.`,
                relatedEvent: eventId,
                relatedUser: req.user.id
            });
            await notif.save();
        }

        // Send confirmation email
        try {
            const user = await User.findById(req.user.id);
            const collegeName = event.collegeName || event.organizer?.name || "the college";
            const sendEmail = require("../utils/sendEmail");

            await sendEmail({
                to: user.email,
                subject: `Application Confirmation - ${event.title}`,
                text: `Dear ${user.name},\n\nYou have successfully applied for the event "${event.title}" organized by ${collegeName}.\nYour Application Number: ${applicationNumber}\n\nDate: ${new Date(event.startDate).toLocaleDateString()}\nLocation: ${event.address}\n\nGood luck!`,
                html: `<p>Dear <strong>${user.name}</strong>,</p><p>You have successfully applied for the event <strong>"${event.title}"</strong> organized by ${collegeName}.</p><p><strong>Application Number:</strong> ${applicationNumber}</p><p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()}<br><strong>Location:</strong> ${event.address}</p><p>Good luck!</p>`
            });
        } catch (emailErr) {
            console.error("Error sending application confirmation email:", emailErr);
            // Don't fail the application request if email fails
        }

        res.json(application);
    } catch (err) {
        console.error(err);
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

// @route   GET /api/student/search
// @desc    Search colleges
router.get("/search", authenticate, authorize("student"), async (req, res) => {
    try {
        const { query } = req.query;
        let queryObj = { role: "college" };
        if (query) {
            queryObj.name = { $regex: query, $options: "i" };
        }
        const colleges = await User.find(queryObj).select("name profilePic followers following email mobile collegeAddress");
        res.json(colleges);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/student/follow/:id
// @desc    Follow a college
router.post("/follow/:id", authenticate, authorize("student"), async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.id;

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (targetUserId === currentUserId) {
            return res.status(400).json({ message: "Cannot follow yourself" });
        }

        if (currentUser.following.includes(targetUserId)) {
            return res.status(400).json({ message: "Already following" });
        }

        currentUser.following.push(targetUserId);
        targetUser.followers.push(currentUserId);

        await currentUser.save();
        await targetUser.save();

        // Notify the target user
        const notif = new Notification({
            user: targetUserId,
            type: "NEW_FOLLOWER",
            message: `${currentUser.name} started following you.`,
            relatedUser: currentUserId
        });
        await notif.save();

        res.json({ success: true, user: currentUser.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }) });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   DELETE /api/student/unfollow/:id
// @desc    Unfollow a college
router.delete("/unfollow/:id", authenticate, authorize("student"), async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.id;

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
        targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);

        await currentUser.save();
        await targetUser.save();

        res.json({ success: true, user: currentUser.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }) });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/student/notifications
// @desc    Get student notifications
router.get("/notifications", authenticate, authorize("student"), async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .populate("relatedUser", "name profilePic")
            .populate("relatedEvent", "title")
            .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/student/followers
// @desc    Get detailed list of followers
router.get("/followers", authenticate, authorize("student"), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('followers', 'name profilePic role email');
        res.json(user.followers);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/student/following
// @desc    Get detailed list of followed colleges
router.get("/following", authenticate, authorize("student"), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('following', 'name profilePic role email collegeAddress');
        res.json(user.following);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;
