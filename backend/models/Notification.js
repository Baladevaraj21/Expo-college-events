const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Recipient
        type: { type: String, enum: ["NEW_EVENT", "NEW_APPLICATION", "NEW_FOLLOWER", "STATUS_UPDATE", "SYSTEM"], required: true },
        message: { type: String, required: true },
        link: { type: String },
        read: { type: Boolean, default: false },
        relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
