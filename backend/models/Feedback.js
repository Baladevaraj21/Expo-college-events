const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
    {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
    },
    { timestamps: true }
);

// One feedback per student per event
FeedbackSchema.index({ student: 1, event: 1 }, { unique: true });

module.exports = mongoose.model("Feedback", FeedbackSchema);
