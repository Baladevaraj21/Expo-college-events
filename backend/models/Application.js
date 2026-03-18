const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
    {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
        applicationNumber: { type: String, unique: true },
        name: { type: String },
        year: { type: String },
        department: { type: String },
        email: { type: String },
        phoneNumber: { type: String },
        paymentScreenshot: { type: String },
        foodPreference: { type: String },
        paymentStatus: { type: String, enum: ["pending", "completed"], default: "pending" },
        status: { type: String, enum: ["applied", "confirmed", "rejected"], default: "applied" },
        selectedEvents: [{ type: String }],
        certificateUrl: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Application", ApplicationSchema);
