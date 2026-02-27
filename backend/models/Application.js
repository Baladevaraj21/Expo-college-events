const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
    {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
        paymentStatus: { type: String, enum: ["pending", "completed"], default: "pending" },
        status: { type: String, enum: ["applied", "confirmed", "rejected"], default: "applied" },
        certificateUrl: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Application", ApplicationSchema);
