const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authenticate, authorize } = require("../middleware/auth");
const Event = require("../models/Event");
const Application = require("../models/Application");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const type = file.fieldname === "qrCode" ? "qr" : "poster";
        cb(null, req.user.id + "-" + type + "-" + Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });
const eventUploads = upload.fields([
    { name: "qrCode", maxCount: 1 },
    { name: "poster", maxCount: 1 }
]);


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
router.post("/events", eventUploads, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const eventData = {
            ...req.body,
            organizer: req.user.id,
            collegeName: user.name,
            technicalEvents: req.body.technicalEvents ? (typeof req.body.technicalEvents === 'string' ? JSON.parse(req.body.technicalEvents) : req.body.technicalEvents) : [],
            nonTechnicalEvents: req.body.nonTechnicalEvents ? (typeof req.body.nonTechnicalEvents === 'string' ? JSON.parse(req.body.nonTechnicalEvents) : req.body.nonTechnicalEvents) : [],
            workshopEvents: req.body.workshopEvents ? (typeof req.body.workshopEvents === 'string' ? JSON.parse(req.body.workshopEvents) : req.body.workshopEvents) : [],
        };

        if (req.files) {
            if (req.files.qrCode) {
                eventData.qrCode = req.files.qrCode[0].path.replace(/\\/g, "/");
            }
            if (req.files.poster) {
                eventData.posterUrl = req.files.poster[0].path.replace(/\\/g, "/");
            }
        }

        const newEvent = new Event(eventData);
        await newEvent.save();

        // Notify followers
        if (user.followers && user.followers.length > 0) {
            const notifications = user.followers.map(followerId => ({
                user: followerId,
                type: "NEW_EVENT",
                message: `${user.name} posted a new event: ${newEvent.title}`,
                relatedEvent: newEvent._id,
                relatedUser: req.user.id
            }));
            await Notification.insertMany(notifications);
        }

        res.json(newEvent);
    } catch (err) {
        console.error("Event creation error", err);
        res.status(500).send("Server Error");
    }
});

// @route   DELETE /api/college/events/:id
// @desc    Delete an event
router.delete("/events/:id", async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Ensure user owns the event
        if (event.organizer.toString() !== req.user.id) {
            return res.status(401).json({ message: "User not authorized" });
        }

        await Event.findByIdAndDelete(req.params.id);
        // Also delete associated applications and notifications (optional but good practice)
        await Application.deleteMany({ event: req.params.id });
        await Notification.deleteMany({ relatedEvent: req.params.id });

        res.json({ message: "Event removed" });
    } catch (err) {
        console.error("Delete event error", err);
        res.status(500).send("Server Error");
    }
});

// @route   PUT /api/college/events/:id
// @desc    Update an existing event
router.put("/events/:id", eventUploads, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Ensure user owns the event
        if (event.organizer.toString() !== req.user.id) {
            return res.status(401).json({ message: "User not authorized" });
        }

        const updateData = { ...req.body };
        if (updateData.technicalEvents) updateData.technicalEvents = typeof updateData.technicalEvents === 'string' ? JSON.parse(updateData.technicalEvents) : updateData.technicalEvents;
        if (updateData.nonTechnicalEvents) updateData.nonTechnicalEvents = typeof updateData.nonTechnicalEvents === 'string' ? JSON.parse(updateData.nonTechnicalEvents) : updateData.nonTechnicalEvents;
        if (updateData.workshopEvents) updateData.workshopEvents = typeof updateData.workshopEvents === 'string' ? JSON.parse(updateData.workshopEvents) : updateData.workshopEvents;

        // If new files were uploaded
        if (req.files) {
            if (req.files.qrCode) {
                updateData.qrCode = req.files.qrCode[0].path.replace(/\\/g, "/");
            }
            if (req.files.poster) {
                updateData.posterUrl = req.files.poster[0].path.replace(/\\/g, "/");
            }
        }

        // Remove subCategory if category is not Symposium
        if (updateData.category && updateData.category !== "Symposium") {
            updateData.subCategory = undefined;
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.json(updatedEvent);
    } catch (err) {
        console.error("Update event error", err);
        res.status(500).send("Server Error");
    }
});

// @route   PUT /api/college/change-username
// @desc    Change college display name
router.put("/change-username", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim().length < 2) return res.status(400).json({ message: "Name must be at least 2 characters." });
        const user = await User.findByIdAndUpdate(req.user.id, { $set: { name: name.trim() } }, { new: true }).select("-password");
        res.json({ message: "College name updated successfully!", user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// @route   PUT /api/college/change-password
// @desc    Change college password
router.put("/change-password", async (req, res) => {
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

// @route   GET /api/college/applications
// @desc    Get applications for college's events
router.get("/applications", async (req, res) => {
    try {
        // Find all events created by this college
        const events = await Event.find({ organizer: req.user.id }).select("_id");
        const eventIds = events.map(e => e._id);

        let queryObj = { event: { $in: eventIds } };
        
        if (req.query.search) {
            const students = await User.find({ name: { $regex: req.query.search, $options: "i" } }).select("_id");
            const studentIds = students.map(s => s._id);
            
            queryObj.$or = [
                { applicationNumber: { $regex: req.query.search, $options: "i" } },
                { student: { $in: studentIds } }
            ];
        }

        const applications = await Application.find(queryObj)
            .populate("student", "name email college department year mobile place age gender collegeAddress profilePic idCardFront idCardBack")
            .populate("event", "title type category")
            .sort({ createdAt: -1 });

        // Add apply count per student
        const applicationsWithCount = await Promise.all(applications.map(async (app) => {
            const studentApplyCount = await Application.countDocuments({ student: app.student ? app.student._id : null });
            return {
                ...app.toObject(),
                studentApplyCount
            };
        }));

        res.json(applicationsWithCount);
    } catch (err) {
        console.error("Fetch applications error", err);
        res.status(500).send("Server Error");
    }
});

// @route   PATCH /api/college/applications/:id
// @desc    Update application status
router.patch("/applications/:id", async (req, res) => {
    try {
        const { status } = req.body;
        const application = await Application.findById(req.params.id).populate('event');
        if (!application) return res.status(404).json({ message: "Application not found" });

        application.status = status;
        await application.save();

        // Notify the student
        const notif = new Notification({
            user: application.student,
            type: "STATUS_UPDATE",
            message: `Your application for "${application.event.title}" has been ${status}.`,
            relatedEvent: application.event._id,
            relatedUser: req.user.id
        });
        await notif.save();

        res.json(application);
    } catch (err) {
        console.error(err);
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

// @route   GET /api/college/search
// @desc    Search other colleges
router.get("/search", async (req, res) => {
    try {
        const { query } = req.query;
        let queryObj = { role: "college" };
        if (query) {
            queryObj.name = { $regex: query, $options: "i" };
        }
        const colleges = await User.find(queryObj).select("name profilePic followers following");
        res.json(colleges);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/college/follow/:id
// @desc    Follow another college
router.post("/follow/:id", async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.id;

        if (targetUserId === currentUserId) return res.status(400).json({ message: "Cannot follow yourself" });

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
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

// @route   DELETE /api/college/unfollow/:id
// @desc    Unfollow a college
router.delete("/unfollow/:id", async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.id;

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser) return res.status(404).json({ message: "User not found" });

        currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
        targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);

        await currentUser.save();
        await targetUser.save();

        res.json({ success: true, user: currentUser.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }) });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/college/notifications
// @desc    Get college notifications
router.get("/notifications", async (req, res) => {
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

// @route   GET /api/college/followers
// @desc    Get detailed list of followers
router.get("/followers", async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('followers', 'name profilePic role email');
        res.json(user.followers);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/college/following
// @desc    Get detailed list of following
router.get("/following", async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('following', 'name profilePic role email');
        res.json(user.following);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;
