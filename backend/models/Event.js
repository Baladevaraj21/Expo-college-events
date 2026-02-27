const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        category: { type: String, enum: ["technical", "non-technical", "sports", "workshop"], required: true },
        type: { type: String, required: true },
        organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        address: { type: String, required: true },
        busRoutes: { type: String },
        entryFee: { type: Number, required: true, default: 0 },
        videoUrl: { type: String },
        instructions: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Event", EventSchema);
