const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        category: { type: String, enum: ["Symposium", "Sports", "Events"], required: true },
        subCategory: { type: String, enum: ["Technical", "Non-Technical", "Workshop"] },
        type: { type: String, required: true },
        collegeName: { type: String, required: true },
        organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        contactNumber: { type: String },
        email: { type: String },
        registrationEndDate: { type: Date },
        foodProvided: { type: Boolean, default: false },
        mapLink: { type: String },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        address: { type: String, required: true },
        collegeBusRoutes: { type: String },
        localBusRoutes: { type: String },
        entryFee: { type: Number, required: true, default: 0 },
        videoUrl: { type: String },
        qrCode: { type: String },
        posterUrl: { type: String },
        instructions: { type: String },
        technicalEvents: [{ type: String }],
        nonTechnicalEvents: [{ type: String }],
        workshopEvents: [{ type: String }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Event", EventSchema);
